import { describe, it, expect, vi } from 'vitest'
import { env as cloudflareEnv } from 'cloudflare:test'
import worker, { type Env } from '../src/index'

const env: Env = { FIREBASE_PROJECT_ID: 'test-project', YOUTUBE_API_KEY: 'test-youtube', TAVILY_API_KEY: 'test-tavily' }

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length }
  return output
}

function der(tag: number, content: Uint8Array): Uint8Array {
  const length = content.length < 128 ? Uint8Array.of(content.length) : (() => {
    const octets: number[] = []
    let remaining = content.length
    while (remaining > 0) { octets.unshift(remaining & 0xff); remaining >>>= 8 }
    return Uint8Array.of(0x80 | octets.length, ...octets)
  })()
  return concatBytes(Uint8Array.of(tag), length, content)
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function replaceTokenClaims(token: string, changes: Record<string, unknown>): string {
  const [header, payload, signature] = token.split('.')
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')), char => char.charCodeAt(0))))
  return `${header}.${base64Url(new TextEncoder().encode(JSON.stringify({ ...claims, ...changes })))}.${signature}`
}

function replaceTokenKeyId(token: string, kid: string): string {
  const [header, payload, signature] = token.split('.')
  const decodedHeader = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(header.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0))))
  return `${base64Url(new TextEncoder().encode(JSON.stringify({ ...decodedHeader, kid })))}.${payload}.${signature}`
}

async function createFirebaseTestToken(): Promise<{ token: string; certificate: string }> {
  const keyPair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: Uint8Array.of(1, 0, 1), hash: 'SHA-256' }, true, ['sign', 'verify'])
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey))
  const tbs = der(0x30, concatBytes(
    der(0xa0, der(0x02, Uint8Array.of(2))),
    der(0x02, Uint8Array.of(1)),
    der(0x30, new Uint8Array()),
    der(0x30, new Uint8Array()),
    der(0x30, new Uint8Array()),
    der(0x30, new Uint8Array()),
    publicKey,
  ))
  const certificateBytes = der(0x30, concatBytes(tbs, der(0x30, new Uint8Array()), der(0x03, Uint8Array.of(0))))
  const pem = `-----BEGIN CERTIFICATE-----\n${btoa(String.fromCharCode(...certificateBytes))}\n-----END CERTIFICATE-----`
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', kid: 'unit-test-key' })))
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({
    aud: env.FIREBASE_PROJECT_ID,
    iss: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    sub: 'test-user',
    iat: now,
    exp: now + 3600,
    auth_time: now,
  })))
  const signingInput = `${header}.${payload}`
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, new TextEncoder().encode(signingInput)))
  return { token: `${signingInput}.${base64Url(signature)}`, certificate: pem }
}

describe('StudyMate API Worker', () => {
  it('reports health without requiring authentication', async () => {
    const response = await worker.fetch(new Request('https://example.com/api/health'), env, {} as ExecutionContext)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, status: 'ok' })
  })

  it('returns JSON 404 for unknown API routes', async () => {
    const response = await worker.fetch(new Request('https://example.com/api/missing'), env, {} as ExecutionContext)
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ success: false })
  })

  it('requires an authenticated Firebase request for search', async () => {
    const response = await worker.fetch(new Request('https://example.com/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'linear algebra', type: 'all' }),
    }), env, {} as ExecutionContext)
    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ success: false, message: 'A Firebase ID token is required.' })
  })

  it('handles browser preflight with the requested local origin', async () => {
    const response = await worker.fetch(new Request('https://example.com/api/search', {
      method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' },
    }), env, {} as ExecutionContext)
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
  })

  it('calls each provider once, caches normalized repeats, and aborts timed-out providers', async () => {
    const { token, certificate } = await createFirebaseTestToken()
    await cloudflareEnv.SEARCH_CACHE_DB.prepare(`CREATE TABLE IF NOT EXISTS search_cache (
      cache_key TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      query TEXT NOT NULL,
      result_json TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run()
    const counts = { googleHomepage: 0, firebaseKeys: 0, youtube: 0, tavily: 0 }
    const backgroundWrites: Promise<unknown>[] = []
    const context = { waitUntil: (promise: Promise<unknown>) => backgroundWrites.push(promise) } as unknown as ExecutionContext
    const integrationEnv: Env = { ...env, SEARCH_CACHE_DB: cloudflareEnv.SEARCH_CACHE_DB }
    const remotePreviewEnv: Env = { ...env, APP_ORIGIN: 'http://127.0.0.1:5173', ENABLE_DEV_DIAGNOSTICS: 'true' }
    const query = `cache-test-${crypto.randomUUID()}`
    let shouldHangYoutube = false
    let youtubeWasAborted = false
    let certificateStatus = 200
    const searchLogs = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const authErrorLogs = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : input.toString())
      if (url.hostname === 'www.google.com') {
        counts.googleHomepage++
        return new Response('Google homepage', { status: 200 })
      }
      if (url.hostname === 'www.googleapis.com' && url.pathname.includes('metadata/x509')) {
        counts.firebaseKeys++
        return Response.json({ 'unit-test-key': certificate }, { status: certificateStatus, headers: { 'Cache-Control': 'public, max-age=22932', Age: '0' } })
      }
      if (url.hostname === 'www.googleapis.com' && url.pathname === '/youtube/v3/search') {
        counts.youtube++
        if (shouldHangYoutube) {
          return await new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              youtubeWasAborted = true
              reject(new Error('Request aborted by timeout'))
            }, { once: true })
          })
        }
        await new Promise(resolve => setTimeout(resolve, 100))
        return Response.json({ items: [{ id: { videoId: 'video-1' }, snippet: { title: 'Linear algebra', channelTitle: 'Study channel' } }] })
      }
      if (url.hostname === 'api.tavily.com') {
        counts.tavily++
        await new Promise(resolve => setTimeout(resolve, 100))
        return Response.json({ results: [{ title: 'Linear algebra guide', url: 'https://example.com/linear-algebra', content: 'A concise guide.' }] })
      }
      throw new Error(`Unexpected outbound request: ${url.hostname}${url.pathname}`)
    }))

    try {
      const disabledDiagnostic = await worker.fetch(new Request('http://localhost:8787/__dev/outbound-network-diagnostic'), integrationEnv, context)
      expect(disabledDiagnostic.status).toBe(404)

      const diagnosticResponse = await worker.fetch(new Request('https://backend-remote-dev.workers.dev/__dev/outbound-network-diagnostic'), remotePreviewEnv, context)
      expect(diagnosticResponse.status).toBe(200)
      const diagnostic = await diagnosticResponse.json() as { google: Record<string, unknown>; firebaseCertificates: Record<string, unknown> }
      expect(diagnostic.google).toMatchObject({ success: true, status: 200 })
      expect(diagnostic.firebaseCertificates).toMatchObject({ success: true, status: 200, cacheControl: 'public, max-age=22932', ageSeconds: 0, cacheTtlSeconds: 22932 })
      expect(JSON.stringify(diagnostic)).not.toContain('BEGIN CERTIFICATE')

      const productionDiagnostic = await worker.fetch(new Request('https://example.com/__dev/outbound-network-diagnostic'), integrationEnv, context)
      expect(productionDiagnostic.status).toBe(404)
      expect(counts.firebaseKeys).toBe(1)
      expect(counts.googleHomepage).toBe(1)

      const previewPreflight = await worker.fetch(new Request('https://backend-remote-dev.workers.dev/api/search', {
        method: 'OPTIONS',
        headers: { Origin: 'http://127.0.0.1:5173' },
      }), remotePreviewEnv, context)
      expect(previewPreflight.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:5173')
      const otherPreviewOrigin = await worker.fetch(new Request('https://backend-remote-dev.workers.dev/api/search', {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:5173' },
      }), remotePreviewEnv, context)
      expect(otherPreviewOrigin.headers.has('Access-Control-Allow-Origin')).toBe(false)

      const validMeRequest = () => worker.fetch(new Request('http://localhost:8787/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      }), integrationEnv, context)
      const [meResponse, concurrentMeResponse] = await Promise.all([validMeRequest(), validMeRequest()])
      expect(meResponse.status).toBe(200)
      expect(await meResponse.json()).toMatchObject({ success: true, user: { uid: 'test-user' } })
      expect(concurrentMeResponse.status).toBe(200)

      const search = (searchQuery: string) => worker.fetch(new Request('http://localhost:8787/api/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, type: 'all' }),
      }), integrationEnv, context)

      const first = await search(`  ${query.toUpperCase()}   `)
      expect(first.status).toBe(200)
      expect((await first.json()).videos).toHaveLength(1)
      await Promise.all(backgroundWrites.splice(0))
      const repeated = await search(`  ${query.toLowerCase()} `)
      expect(repeated.status).toBe(200)
      expect(counts).toEqual({ googleHomepage: 1, firebaseKeys: 2, youtube: 1, tavily: 1 })
      const records = searchLogs.mock.calls
        .filter(([label]) => label === '[search] completed')
        .map(([, data]) => JSON.parse(String(data)))
      expect(records).toHaveLength(2)
      expect(records[0]).toMatchObject({ youtubeD1Cache: 'MISS', tavilyD1Cache: 'MISS', youtubeCache: 'MISS', tavilyCache: 'MISS', youtubeApiCalls: 1, tavilyApiCalls: 1 })
      expect(records[1]).toMatchObject({ youtubeD1Cache: 'HIT', tavilyD1Cache: 'HIT', youtubeCache: 'HIT', tavilyCache: 'HIT', youtubeApiCalls: 0, tavilyApiCalls: 0 })
      expect(records[0]).toMatchObject({ authMs: expect.any(Number), youtubeMs: expect.any(Number), tavilyMs: expect.any(Number), d1CacheLookupMs: expect.any(Number), d1CacheWriteMs: 'deferred', totalMs: expect.any(Number) })
      expect(records[0].youtubeMs).toBeGreaterThanOrEqual(90)
      expect(records[0].tavilyMs).toBeGreaterThanOrEqual(90)
      expect(records[0].totalMs - records[0].authMs - records[0].d1CacheLookupMs).toBeLessThan((records[0].youtubeMs + records[0].tavilyMs) * 0.75)
      const writeRecords = searchLogs.mock.calls
        .filter(([label]) => label === '[search] D1 cache write completed')
        .map(([, data]) => JSON.parse(String(data)))
      expect(writeRecords).toHaveLength(2)
      expect(writeRecords.every(record => typeof record.durationMs === 'number')).toBe(true)
      expect(JSON.stringify(records)).not.toContain(token)
      expect(JSON.stringify(records)).not.toContain('test-youtube')
      expect(JSON.stringify(records)).not.toContain('test-tavily')

      const invalidTokenResponse = await worker.fetch(new Request('http://localhost:8787/api/me', {
        headers: { Authorization: 'Bearer not-a-valid-jwt' },
      }), integrationEnv, context)
      expect(invalidTokenResponse.status).toBe(401)

      const expiredToken = replaceTokenClaims(token, { exp: Math.floor(Date.now() / 1000) - 30 })
      const expiredResponse = await worker.fetch(new Request('http://localhost:8787/api/me', {
        headers: { Authorization: `Bearer ${expiredToken}` },
      }), integrationEnv, context)
      expect(expiredResponse.status).toBe(401)
      expect(await expiredResponse.json()).toMatchObject({ message: 'The Firebase ID token has expired. Please sign in again.' })

      const wrongAudience = replaceTokenClaims(token, { aud: 'another-project' })
      const wrongAudienceResponse = await worker.fetch(new Request('http://localhost:8787/api/me', {
        headers: { Authorization: `Bearer ${wrongAudience}` },
      }), integrationEnv, context)
      expect(wrongAudienceResponse.status).toBe(401)

      const futureTimestamp = Math.floor(Date.now() / 1000) + 120
      const futureIssuedToken = replaceTokenClaims(token, { iat: futureTimestamp, auth_time: futureTimestamp })
      const futureIssuedResponse = await worker.fetch(new Request('http://localhost:8787/api/me', {
        headers: { Authorization: `Bearer ${futureIssuedToken}` },
      }), integrationEnv, context)
      expect(futureIssuedResponse.status).toBe(401)
      expect(await futureIssuedResponse.json()).toMatchObject({ message: 'The Firebase ID token is not yet valid.' })

      const invalidSignature = `${token.split('.').slice(0, 2).join('.')}.${base64Url(new Uint8Array(256))}`
      const invalidSignatureResponse = await worker.fetch(new Request('http://localhost:8787/api/me', {
        headers: { Authorization: `Bearer ${invalidSignature}` },
      }), integrationEnv, context)
      expect(invalidSignatureResponse.status).toBe(401)

      const unknownKeyResponse = await worker.fetch(new Request('http://localhost:8787/api/me', {
        headers: { Authorization: `Bearer ${replaceTokenKeyId(token, 'rotated-test-key')}` },
      }), integrationEnv, context)
      expect(unknownKeyResponse.status).toBe(401)
      expect(counts.firebaseKeys).toBe(3)

      certificateStatus = 503
      const certificateFailureResponse = await worker.fetch(new Request('http://localhost:8787/api/me', {
        headers: { Authorization: `Bearer ${replaceTokenKeyId(token, 'unavailable-test-key')}` },
      }), integrationEnv, context)
      expect(certificateFailureResponse.status).toBe(503)
      expect(await certificateFailureResponse.json()).toMatchObject({ message: 'Firebase signing certificate service returned HTTP 503.' })
      expect(counts.firebaseKeys).toBe(4)
      expect(authErrorLogs.mock.calls.some(([label, data]) => label === '[auth] Firebase signing certificate refresh failed' && String(data).includes('http_error'))).toBe(true)

      shouldHangYoutube = true
      const timeoutQuery = `timeout-test-${crypto.randomUUID()}`
      const timeoutResponse = await search(timeoutQuery)
      expect(timeoutResponse.status).toBe(200)
      const timeoutPayload = await timeoutResponse.json() as { videos: unknown[]; web: unknown[]; providers: { youtube: { ok: boolean; error?: string }; tavily: { ok: boolean } } }
      expect(youtubeWasAborted).toBe(true)
      expect(timeoutPayload.providers.youtube).toMatchObject({ ok: false, error: expect.stringContaining('timed out') })
      expect(timeoutPayload.providers.tavily.ok).toBe(true)
      expect(timeoutPayload.videos).toHaveLength(0)
      expect(timeoutPayload.web.length).toBeGreaterThan(0)
      await Promise.all(backgroundWrites.splice(0))
      const timedOutYouTubeRow = await cloudflareEnv.SEARCH_CACHE_DB.prepare('SELECT result_json FROM search_cache WHERE cache_key = ?1')
        .bind(`youtube:${timeoutQuery.toLocaleLowerCase('en-US')}`)
        .first()
      expect(timedOutYouTubeRow).toBeNull()
      const successfulTavilyRow = await cloudflareEnv.SEARCH_CACHE_DB.prepare('SELECT result_json FROM search_cache WHERE cache_key = ?1')
        .bind(`tavily:${timeoutQuery.toLocaleLowerCase('en-US')}`)
        .first()
      expect(successfulTavilyRow).not.toBeNull()
    } finally {
      searchLogs.mockRestore()
      authErrorLogs.mockRestore()
      vi.unstubAllGlobals()
    }
  }, 20_000)
})
