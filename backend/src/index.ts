export type SearchType = 'all' | 'videos' | 'web'

import { generateStudyPlan } from './services/gemini'

export interface Env {
  YOUTUBE_API_KEY?: string
  TAVILY_API_KEY?: string
  FIREBASE_PROJECT_ID?: string
  FIREBASE_CERT_TIMEOUT_MS?: string
  ENABLE_DEV_DIAGNOSTICS?: string
  APP_ORIGIN?: string
  SEARCH_CACHE_DB?: D1Database
  GEMINI_API_KEY?: string
  GEMINI_PRIMARY_MODEL?: string
  GEMINI_FALLBACK_MODEL_1?: string
  GEMINI_FALLBACK_MODEL_2?: string
}

export interface AuthenticatedUser {
  uid: string
  email?: string
  name?: string
  picture?: string
}

export interface VideoResult {
  id: string
  title: string
  url: string
  thumbnail: string
  channel: string
  publishedAt: string
  description: string
}

export interface WebResult {
  title: string
  url: string
  content: string
  score: number | null
}

interface SearchPayload {
  success: boolean
  requestId: string
  query: string
  type: SearchType
  videos: VideoResult[]
  web: WebResult[]
  providers: {
    youtube: { ok: boolean; error?: string }
    tavily: { ok: boolean; error?: string }
  }
}

interface SearchHistoryEntry {
  id: string
  user_id: string
  query: string
  search_type: SearchType
  result_json: string
  created_at: number
}

interface SearchHistoryResponse {
  success: boolean
  history: SearchHistoryEntry[]
  cursor?: string
}

// Study Plan interfaces
export interface StudyPlanTask {
  id: string
  plan_id: string
  user_id: string
  day_number: number
  task_title: string
  task_description: string
  estimated_duration_minutes: number
  module_name: string
  module_order: number
  is_completed: number
  completed_at: number | null
  created_at: number
  updated_at: number
}

export interface StudyPlan {
  id: string
  user_id: string
  title: string
  topic: string
  description: string
  knowledge_level: 'beginner' | 'intermediate' | 'advanced'
  daily_study_time_minutes: number
  target_completion_date: number
  learning_goals: string
  additional_instructions: string | null
  total_estimated_days: number
  progress: number
  plan_data_json: string
  created_at: number
  updated_at: number
}

export interface StudyPlanListResponse {
  success: boolean
  plans: StudyPlan[]
}

export interface StudyPlanDetailResponse {
  success: boolean
  plan?: StudyPlan
  tasks?: StudyPlanTask[]
  message?: string
}

export interface StudyPlanGenerateRequest {
  topic: string
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced'
  dailyStudyTimeMinutes: number
  targetCompletionDate: number
  learningGoals: string
  additionalInstructions?: string
}

export interface StudyPlanGenerateResponse {
  success: boolean
  plan?: StudyPlan
  tasks?: StudyPlanTask[]
  error?: string
  message?: string
}

export interface StudyPlanTaskUpdateRequest {
  isCompleted: boolean
}

export interface StudyPlanTaskUpdateResponse {
  success: boolean
  task?: StudyPlanTask
  message?: string
}

export interface StudyPlanDeleteResponse {
  success: boolean
  message?: string
}

const MAX_BODY_BYTES = 16_384
const MAX_RESULTS = 10
const PROVIDER_CACHE_TTL_MS = 5 * 60 * 1000
const YOUTUBE_TIMEOUT_MS = 10_000
const TAVILY_TIMEOUT_MS = 10_000
const DEFAULT_FIREBASE_KEYS_TIMEOUT_MS = 30_000
const D1_LOOKUP_TIMEOUT_MS = 1_000
const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const SEARCH_HISTORY_PAGE_SIZE = 20
const MAX_SEARCH_HISTORY_ENTRIES = 100
interface SigningKeyCacheEntry {
  keys: Record<string, CryptoKey>
  expiresAt: number
}
const certCache = new Map<string, SigningKeyCacheEntry>()
const certFetches = new Map<string, Promise<SigningKeyCacheEntry>>()
type CacheStatus = 'HIT' | 'MISS' | 'SKIP'
interface ProviderCacheEntry<T> {
  value?: T
  promise?: Promise<T>
  expiresAt: number
}
const youtubeResultCache = new Map<string, ProviderCacheEntry<VideoResult[]>>()
const tavilyResultCache = new Map<string, ProviderCacheEntry<WebResult[]>>()

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

class RequestTimeoutError extends Error {
  constructor(readonly label: string, readonly timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs} ms.`)
  }
}

class CertificateFetchError extends Error {
  constructor(readonly reason: string, message: string, readonly status?: number) {
    super(message)
  }
}

async function withTimeout<T>(label: string, timeoutMs: number, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new RequestTimeoutError(label, timeoutMs))
    }, timeoutMs)
  })
  try {
    return await Promise.race([operation(controller.signal), timeout])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin')
  const allowedOrigins = env.ENABLE_DEV_DIAGNOSTICS === 'true'
    ? [env.APP_ORIGIN]
    : [
      env.APP_ORIGIN,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ]
  const allowed = new Set(allowedOrigins.filter((value): value is string => Boolean(value)))
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Vary': 'Origin',
  }
  if (origin && allowed.has(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function decodeBase64UrlJson<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part))) as T
}

interface FirebaseClaims {
  aud?: string
  iss?: string
  sub?: string
  exp?: number
  iat?: number
  auth_time?: number
  email?: string
  name?: string
  picture?: string
}

function getFirebaseKeyTimeout(env: Env): number {
  const configured = Number(env.FIREBASE_CERT_TIMEOUT_MS)
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_FIREBASE_KEYS_TIMEOUT_MS
  return Math.min(Math.max(Math.floor(configured), 1_000), 30_000)
}

function getRemainingCertificateTtlSeconds(cacheControl: string, ageHeader = '0'): number {
  const maxAgeMatch = cacheControl.match(/(?:^|,)\s*max-age\s*=\s*(\d+)/i)
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 300
  const ageSeconds = Number(ageHeader)
  return Math.max(0, maxAgeSeconds - (Number.isFinite(ageSeconds) ? ageSeconds : 0))
}

async function probeOutboundUrl(url: string, timeoutMs: number, includeCacheHeaders = false): Promise<Record<string, unknown>> {
  const startedAt = performance.now()
  try {
    const response = await withTimeout('Outbound HTTPS diagnostic', timeoutMs, signal => fetch(url, { signal }))
    const durationMs = performance.now() - startedAt
    await response.body?.cancel().catch(() => undefined)
    const result: Record<string, unknown> = {
      success: response.ok,
      status: response.status,
      durationMs,
    }
    if (includeCacheHeaders) {
      const cacheControl = response.headers.get('cache-control') || ''
      const age = response.headers.get('age') || '0'
      result.cacheControl = cacheControl
      result.ageSeconds = Number(age)
      result.cacheTtlSeconds = getRemainingCertificateTtlSeconds(cacheControl, age)
    }
    return result
  } catch (error) {
    const reason = error instanceof RequestTimeoutError ? 'timeout' : 'network_error'
    return {
      success: false,
      reason,
      durationMs: performance.now() - startedAt,
      timeoutMs,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown network error.',
    }
  }
}

async function handleOutboundNetworkDiagnostic(env: Env): Promise<Response> {
  const timeoutMs = getFirebaseKeyTimeout(env)
  const [google, firebaseCertificates] = await Promise.all([
    probeOutboundUrl('https://www.google.com', timeoutMs),
    probeOutboundUrl(CERT_URL, timeoutMs, true),
  ])
  const result = { success: google.success === true && firebaseCertificates.success === true, timeoutMs, google, firebaseCertificates }
  console.info('[dev] outbound HTTPS diagnostic', JSON.stringify(result))
  return json(result, result.success ? 200 : 503)
}

async function fetchSigningKeys(projectId: string, timeoutMs: number): Promise<SigningKeyCacheEntry> {
  const startedAt = performance.now()
  console.info('[auth] Starting Firebase certificate fetch', JSON.stringify({ projectId, timeoutMs, cacheSize: certCache.size }))
  try {
    const { certs, cacheControl, ageHeader } = await withTimeout('Firebase verification key request', timeoutMs, async signal => {
      const fetchStarted = performance.now()
      console.info('[auth] HTTP fetch to Google certs endpoint started', JSON.stringify({ url: CERT_URL }))
      const response = await fetch(CERT_URL, { signal })
      const fetchDuration = performance.now() - fetchStarted
      console.info('[auth] HTTP fetch completed', JSON.stringify({ status: response.status, ok: response.ok, durationMs: fetchDuration }))
      if (!response.ok) {
        throw new CertificateFetchError('http_error', `Firebase certificate endpoint returned HTTP ${response.status}.`, response.status)
      }
      let certs: unknown
      try {
        certs = await response.json()
      } catch {
        throw new CertificateFetchError('invalid_response', 'Firebase certificate endpoint returned invalid JSON.')
      }
      if (!certs || typeof certs !== 'object' || Array.isArray(certs) || Object.keys(certs).length === 0) {
        throw new CertificateFetchError('invalid_response', 'Firebase certificate endpoint returned no signing certificates.')
      }
      return {
        certs: certs as Record<string, string>,
        cacheControl: response.headers.get('cache-control') || '',
        ageHeader: response.headers.get('age') || '0',
      }
    })

    const totalDuration = performance.now() - startedAt
    console.info('[auth] Certificate fetch + processing completed', JSON.stringify({ durationMs: totalDuration, keyCount: Object.keys(certs).length }))

    const certEntries = Object.entries(certs)
    if (certEntries.length === 0) throw new CertificateFetchError('empty_response', 'Firebase certificate endpoint returned no signing certificates.')

    let keys: Record<string, CryptoKey>
    try {
      const entries = await Promise.all(certEntries.map(async ([keyId, certificate]) => {
        if (typeof certificate !== 'string') throw new Error('Certificate value was not a string.')
        const match = certificate.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/)
        if (!match) throw new Error('Certificate was not valid PEM.')
        const der = Uint8Array.from(atob(match[1].replace(/\s/g, '')), char => char.charCodeAt(0))
        const publicKey = await crypto.subtle.importKey('spki', await extractCertificatePublicKey(der), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
        return [keyId, publicKey] as const
      }))
      keys = Object.fromEntries(entries)
    } catch (error) {
      throw new CertificateFetchError('certificate_import_error', error instanceof Error ? error.message : 'Could not import Firebase signing certificates.')
    }

    const remainingAgeSeconds = getRemainingCertificateTtlSeconds(cacheControl, ageHeader)
    const entry = { keys, expiresAt: Date.now() + remainingAgeSeconds * 1000 }
    certCache.set(projectId, entry)
    console.info('[auth] Firebase signing certificates refreshed', JSON.stringify({ durationMs: performance.now() - startedAt, keyCount: certEntries.length, cacheTtlSeconds: remainingAgeSeconds }))
    return entry
  } catch (error) {
    const reason = error instanceof CertificateFetchError
      ? error.reason
      : error instanceof RequestTimeoutError
        ? 'timeout'
        : 'network_error'
    const status = error instanceof CertificateFetchError ? error.status : undefined
    console.error('[auth] Firebase signing certificate refresh failed', JSON.stringify({
      reason,
      status,
      durationMs: performance.now() - startedAt,
      timeoutMs,
      message: error instanceof Error ? error.message : 'Unknown certificate retrieval failure.',
    }))

    if (error instanceof RequestTimeoutError) {
      throw new HttpError(503, 'Firebase signing certificate service timed out. Please retry.')
    }
    if (error instanceof CertificateFetchError && error.status) {
      throw new HttpError(503, `Firebase signing certificate service returned HTTP ${error.status}.`)
    }
    throw new HttpError(503, 'Firebase signing certificates are temporarily unavailable.')
  }
}

async function getSigningKeys(projectId: string, timeoutMs: number, forceRefresh = false): Promise<Record<string, CryptoKey>> {
  const cached = certCache.get(projectId)
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.keys

  let pending = certFetches.get(projectId)
  if (!pending) {
    pending = fetchSigningKeys(projectId, timeoutMs)
    certFetches.set(projectId, pending)
  }
  try {
    return (await pending).keys
  } catch (error) {
    // If fetch failed due to timeout/network error (not HTTP error from endpoint),
    // fall back to expired cached keys if available
    const isTimeoutOrNetworkError = error instanceof RequestTimeoutError ||
      (error instanceof Error && !('status' in error))
    const expiredCached = certCache.get(projectId)
    if (isTimeoutOrNetworkError && expiredCached && expiredCached.keys && Object.keys(expiredCached.keys).length > 0) {
      console.warn('[auth] Firebase certificate fetch failed, using expired cached keys as fallback', JSON.stringify({
        reason: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'Unknown error',
        cachedKeyCount: Object.keys(expiredCached.keys).length,
        expiredAt: expiredCached.expiresAt,
      }))
      return expiredCached.keys
    }
    throw error
  } finally {
    if (certFetches.get(projectId) === pending) certFetches.delete(projectId)
  }
}

// Extract SubjectPublicKeyInfo from the TBSCertificate portion of an X.509 certificate.
async function extractCertificatePublicKey(certificate: Uint8Array): Promise<ArrayBuffer> {
  let offset = 0
  const readLength = () => {
    const first = certificate[offset++]
    if (first < 128) return first
    const lengthBytes = first & 0x7f
    let length = 0
    for (let index = 0; index < lengthBytes; index++) length = (length << 8) | certificate[offset++]
    return length
  }
  const readElement = () => {
    const tag = certificate[offset++]
    const length = readLength()
    const start = offset
    offset += length
    return { tag, start, length, end: offset }
  }
  const root = readElement()
  if (root.tag !== 0x30) throw new HttpError(503, 'Firebase certificate format was invalid.')
  offset = root.start
  const tbs = readElement()
  if (tbs.tag !== 0x30) throw new HttpError(503, 'Firebase certificate format was invalid.')
  const tbsEnd = tbs.end
  offset = tbs.start
  const fields: Array<{ start: number; end: number }> = []
  while (offset < tbsEnd) {
    const start = offset
    const tag = certificate[offset++]
    let length = certificate[offset++]
    if (length & 0x80) {
      const n = length & 0x7f
      length = 0
      for (let i = 0; i < n; i++) length = (length << 8) | certificate[offset++]
    }
    offset += length
    if (tag === 0x30 || tag === 0xa0) fields.push({ start, end: offset })
  }
  const spki = fields.at(-1)
  if (!spki) throw new HttpError(503, 'Firebase certificate public key was missing.')
  return certificate.slice(spki.start, spki.end).buffer
}

async function verifyFirebaseToken(request: Request, env: Env): Promise<AuthenticatedUser> {
  const projectId = env.FIREBASE_PROJECT_ID
  if (!projectId) {
    console.error('[auth] Firebase token verification unavailable', JSON.stringify({ reason: 'missing_project_id' }))
    throw new HttpError(503, 'Firebase authentication is not configured on the Worker.')
  }
  const authorization = request.headers.get('Authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) throw new HttpError(401, 'A Firebase ID token is required.')
  if (token.length > 8_192) throw new HttpError(401, 'The Firebase ID token is invalid.')
  const parts = token.split('.')
  if (parts.length !== 3) throw new HttpError(401, 'The Firebase ID token is invalid.')

  try {
    const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(parts[0])
    const claims = decodeBase64UrlJson<FirebaseClaims>(parts[1])
    const now = Math.floor(Date.now() / 1000)
    const rejectToken = (reason: string, message: string) => {
      console.warn('[auth] Firebase ID token rejected', JSON.stringify({ reason }))
      throw new HttpError(401, message)
    }

    if (header.alg !== 'RS256' || !header.kid) rejectToken('invalid_token_header', 'The Firebase ID token is invalid.')
    if (claims.aud !== projectId) rejectToken('audience_mismatch', 'The Firebase ID token is invalid for this project.')
    if (claims.iss !== `https://securetoken.google.com/${projectId}`) rejectToken('issuer_mismatch', 'The Firebase ID token issuer is invalid.')
    if (!claims.sub || claims.sub.length > 128) rejectToken('invalid_subject', 'The Firebase ID token subject is invalid.')
    if (!Number.isFinite(claims.exp)) rejectToken('missing_expiration', 'The Firebase ID token is invalid.')
    if (claims.exp! <= now) rejectToken('token_expired', 'The Firebase ID token has expired. Please sign in again.')
    if (!Number.isFinite(claims.iat)) rejectToken('missing_issued_at', 'The Firebase ID token is invalid.')
    if (claims.iat! > now + 60) {
      console.warn('[auth] Firebase token rejected; check Worker system clock', JSON.stringify({ reason: 'issued_at_in_future', clockSkewSeconds: claims.iat! - now }))
      throw new HttpError(401, 'The Firebase ID token is not yet valid.')
    }
    if (!Number.isFinite(claims.auth_time)) rejectToken('missing_auth_time', 'The Firebase ID token is invalid.')
    if (claims.auth_time! > now + 60) {
      console.warn('[auth] Firebase token rejected; check Worker system clock', JSON.stringify({ reason: 'auth_time_in_future', clockSkewSeconds: claims.auth_time! - now }))
      throw new HttpError(401, 'The Firebase ID token is not yet valid.')
    }

    let keys: Record<string, CryptoKey>
    try {
      keys = await getSigningKeys(projectId, getFirebaseKeyTimeout(env))
    } catch (error) {
      if (error instanceof HttpError) throw error
      console.error('[auth] Firebase signing key retrieval failed', JSON.stringify({ reason: 'unexpected_refresh_error', message: error instanceof Error ? error.message : 'Unknown error.' }))
      throw new HttpError(503, 'Firebase signing certificates are temporarily unavailable.')
    }
    let key = keys[header.kid!]
    if (!key) {
      console.info('[auth] Firebase token has an uncached key ID; refreshing certificates')
      try {
        keys = await getSigningKeys(projectId, getFirebaseKeyTimeout(env), true)
      } catch (error) {
        if (error instanceof HttpError) throw error
        console.error('[auth] Firebase signing key refresh failed', JSON.stringify({ reason: 'unknown_key_refresh_error', message: error instanceof Error ? error.message : 'Unknown error.' }))
        throw new HttpError(503, 'Firebase signing certificates are temporarily unavailable.')
      }
      key = keys[header.kid!]
    }
    if (!key) {
      console.warn('[auth] Firebase ID token rejected', JSON.stringify({ reason: 'unknown_signing_key' }))
      throw new HttpError(401, 'The Firebase ID token signing key is unknown.')
    }
    const signature = base64UrlToBytes(parts[2])
    const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    const verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedContent)
    if (!verified) rejectToken('invalid_signature', 'The Firebase ID token signature is invalid.')
    return { uid: claims.sub!, email: claims.email, name: claims.name, picture: claims.picture }
  } catch (error) {
    if (error instanceof HttpError) throw error
    console.warn('[auth] Firebase ID token rejected', JSON.stringify({ reason: 'malformed_token' }))
    throw new HttpError(401, 'The Firebase ID token could not be verified.')
  }
}

async function readSearchInput(request: Request): Promise<{ query: string; type: SearchType }> {
  const contentType = request.headers.get('Content-Type') || ''
  if (!contentType.toLowerCase().includes('application/json')) throw new HttpError(415, 'Send the search request as JSON.')
  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_BODY_BYTES) throw new HttpError(413, 'The search request is too large.')
  let body: unknown
  try { body = await request.json() } catch { throw new HttpError(400, 'Request body must contain valid JSON.') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Request body must be a JSON object.')
  const { query, type } = body as Record<string, unknown>
  if (typeof query !== 'string' || !query.trim()) throw new HttpError(400, 'A non-empty query is required.')
  if (query.trim().length > 300) throw new HttpError(400, 'Query must be 300 characters or fewer.')
  if (type !== undefined && type !== 'all' && type !== 'videos' && type !== 'web') throw new HttpError(400, 'Type must be all, videos, or web.')
  return { query: query.trim(), type: (type as SearchType | undefined) || 'all' }
}

interface YouTubeApiResponse {
  items?: Array<{
    id?: { videoId?: string }
    snippet?: { title?: string; description?: string; channelTitle?: string; publishedAt?: string; thumbnails?: Record<string, { url?: string }> }
  }>
}

async function searchYouTube(query: string, apiKey: string, signal: AbortSignal): Promise<VideoResult[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.search = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(MAX_RESULTS),
    fields: 'items(id/videoId,snippet(title,description,channelTitle,publishedAt,thumbnails(default,medium,high)))',
    q: query,
    key: apiKey,
  }).toString()
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`YouTube search failed (${response.status}).`)
  const data = await response.json() as YouTubeApiResponse
  return (data.items || []).flatMap(item => {
    const id = item.id?.videoId
    if (!id) return []
    const snippet = item.snippet || {}
    const thumbnails = snippet.thumbnails || {}
    return [{ id, title: snippet.title || 'Untitled video', url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, thumbnail: thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '', channel: snippet.channelTitle || 'YouTube', publishedAt: snippet.publishedAt || '', description: snippet.description || '' }]
  })
}

interface TavilyResponse { results?: Array<{ title?: string; url?: string; content?: string; score?: number }> }

async function searchWeb(query: string, apiKey: string, signal: AbortSignal): Promise<WebResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: 'basic', max_results: MAX_RESULTS, include_answer: false }),
    signal,
  })
  if (!response.ok) throw new Error(`Web search failed (${response.status}).`)
  const data = await response.json() as TavilyResponse
  return (data.results || []).flatMap(result => result.url ? [{ title: result.title || result.url, url: result.url, content: result.content || '', score: typeof result.score === 'number' ? result.score : null }] : [])
}

interface CachedProviderResult<T> {
  value: T | null
  error?: string
  cacheStatus: CacheStatus
  apiCalls: number
  providerMs: number
  d1LookupMs: number
  d1LookupStatus: 'HIT' | 'MISS' | 'ERROR' | 'DISABLED' | 'SKIP_INFLIGHT'
}

async function getCachedProviderResult<T>(
  cache: Map<string, ProviderCacheEntry<T>>,
  query: string,
  provider: 'youtube' | 'tavily',
  loader: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  db: D1Database | undefined,
  ctx: ExecutionContext,
  requestId: string,
): Promise<CachedProviderResult<T>> {
  let existing = cache.get(query)
  if (existing?.promise) {
    try { return { value: await existing.promise, cacheStatus: 'HIT', apiCalls: 0, providerMs: 0, d1LookupMs: 0, d1LookupStatus: 'SKIP_INFLIGHT' } }
    catch (error) { return { value: null, error: error instanceof Error ? error.message : 'Provider request failed.', cacheStatus: 'HIT', apiCalls: 0, providerMs: 0, d1LookupMs: 0, d1LookupStatus: 'SKIP_INFLIGHT' } }
  }

  let d1LookupMs = 0
  let d1LookupStatus: CachedProviderResult<T>['d1LookupStatus'] = db ? 'MISS' : 'DISABLED'
  const d1CacheKey = `${provider}:${query}`
  if (db) {
    const lookupStarted = performance.now()
    try {
      const row = await withTimeout('D1 search cache lookup', D1_LOOKUP_TIMEOUT_MS, async () =>
        db.prepare('SELECT result_json FROM search_cache WHERE cache_key = ?1 AND expires_at > ?2 LIMIT 1')
          .bind(d1CacheKey, Math.floor(Date.now() / 1000))
          .first<{ result_json: string }>(),
      )
      d1LookupMs = performance.now() - lookupStarted
      if (row?.result_json) {
        const value = JSON.parse(row.result_json) as T
        cache.set(query, { value, expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS })
        return { value, cacheStatus: 'HIT', apiCalls: 0, providerMs: 0, d1LookupMs, d1LookupStatus: 'HIT' }
      }
    } catch (error) {
      d1LookupMs = performance.now() - lookupStarted
      d1LookupStatus = 'ERROR'
      console.warn('[search] D1 cache lookup failed', JSON.stringify({ requestId, provider, message: error instanceof Error ? error.message : 'D1 lookup failed.' }))
    }
  }

  // Another request may have populated an in-flight entry while this request awaited D1.
  existing = cache.get(query)
  if (existing?.promise) {
    try { return { value: await existing.promise, cacheStatus: 'HIT', apiCalls: 0, providerMs: 0, d1LookupMs, d1LookupStatus: 'SKIP_INFLIGHT' } }
    catch (error) { return { value: null, error: error instanceof Error ? error.message : 'Provider request failed.', cacheStatus: 'HIT', apiCalls: 0, providerMs: 0, d1LookupMs, d1LookupStatus: 'SKIP_INFLIGHT' } }
  }
  if (existing && existing.value !== undefined && existing.expiresAt > Date.now()) {
    return { value: existing.value, cacheStatus: 'HIT', apiCalls: 0, providerMs: 0, d1LookupMs, d1LookupStatus }
  }

  const entry: ProviderCacheEntry<T> = { expiresAt: 0 }
  const providerStarted = performance.now()
  entry.promise = withTimeout(`${provider === 'youtube' ? 'YouTube' : 'Tavily'} search`, timeoutMs, loader)
  cache.set(query, entry)
  try {
    const value = await entry.promise
    cache.set(query, { value, expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS })
    if (db) {
      const writePromise = (async () => {
        const writeStarted = performance.now()
        try {
          await db.prepare('INSERT INTO search_cache (cache_key, provider, query, result_json, expires_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(cache_key) DO UPDATE SET result_json = excluded.result_json, expires_at = excluded.expires_at')
            .bind(d1CacheKey, provider, query, JSON.stringify(value), Math.floor(Date.now() / 1000) + Math.floor(PROVIDER_CACHE_TTL_MS / 1000))
            .run()
          console.info('[search] D1 cache write completed', JSON.stringify({ requestId, provider, durationMs: performance.now() - writeStarted }))
        } catch (error) {
          console.warn('[search] D1 cache write failed', JSON.stringify({ requestId, provider, durationMs: performance.now() - writeStarted, message: error instanceof Error ? error.message : 'D1 write failed.' }))
        }
      })()
      ctx.waitUntil(writePromise)
    }
    return { value, cacheStatus: 'MISS', apiCalls: 1, providerMs: performance.now() - providerStarted, d1LookupMs, d1LookupStatus }
  } catch (error) {
    if (cache.get(query) === entry) cache.delete(query)
    return { value: null, error: error instanceof Error ? error.message : 'Provider request failed.', cacheStatus: 'MISS', apiCalls: 1, providerMs: performance.now() - providerStarted, d1LookupMs, d1LookupStatus }
  }
}

function normalizedCacheQuery(query: string): string {
  return query.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US')
}

async function saveSearchHistory(
  user: AuthenticatedUser,
  query: string,
  type: SearchType,
  resultJson: string,
  db: D1Database | undefined,
): Promise<void> {
  if (!db) return
  try {
    const id = crypto.randomUUID()
    const createdAt = Math.floor(Date.now() / 1000)
    await db.prepare(
      'INSERT INTO search_history (id, user_id, query, search_type, result_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
    ).bind(id, user.uid, query, type, resultJson, createdAt).run()

    // Optional: Clean up old entries beyond the limit
    const countResult = await db.prepare(
      'SELECT COUNT(*) as count FROM search_history WHERE user_id = ?1'
    ).bind(user.uid).first<{ count: number }>()
    if (countResult && countResult.count > MAX_SEARCH_HISTORY_ENTRIES) {
      const deleteCount = countResult.count - MAX_SEARCH_HISTORY_ENTRIES
      await db.prepare(
        'DELETE FROM search_history WHERE id IN (SELECT id FROM search_history WHERE user_id = ?1 ORDER BY created_at ASC LIMIT ?2)'
      ).bind(user.uid, deleteCount).run()
    }
  } catch (error) {
    console.warn('[search] Failed to save search history', JSON.stringify({
      userId: user.uid,
      message: error instanceof Error ? error.message : 'Unknown error'
    }))
  }
}

// Use SEARCH_CACHE_DB for both search_cache and search_history tables
function getHistoryDb(env: Env): D1Database | undefined {
  return env.SEARCH_CACHE_DB
}

async function handleSearch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const startedAt = performance.now()
  const requestId = crypto.randomUUID()
  const authStarted = performance.now()
  await verifyFirebaseToken(request, env)
  const authMs = performance.now() - authStarted
  const validationStarted = performance.now()
  const { query, type } = await readSearchInput(request)
  const validationMs = performance.now() - validationStarted
  const needsYouTube = type === 'all' || type === 'videos'
  const needsTavily = type === 'all' || type === 'web'
  if ((!needsYouTube || !env.YOUTUBE_API_KEY) && (!needsTavily || !env.TAVILY_API_KEY)) {
    return json({ success: false, message: 'No requested search provider is configured on the Worker.' }, 503)
  }

  const cacheQuery = normalizedCacheQuery(query)
  const [youtube, tavily] = await Promise.all([
    needsYouTube && env.YOUTUBE_API_KEY
      ? getCachedProviderResult(youtubeResultCache, cacheQuery, 'youtube', signal => searchYouTube(query, env.YOUTUBE_API_KEY!, signal), YOUTUBE_TIMEOUT_MS, env.SEARCH_CACHE_DB, ctx, requestId)
      : Promise.resolve({ value: null, error: needsYouTube ? 'YouTube search is not configured.' : undefined, cacheStatus: 'SKIP' as const, apiCalls: 0, providerMs: 0, d1LookupMs: 0, d1LookupStatus: 'DISABLED' as const }),
    needsTavily && env.TAVILY_API_KEY
      ? getCachedProviderResult(tavilyResultCache, cacheQuery, 'tavily', signal => searchWeb(query, env.TAVILY_API_KEY!, signal), TAVILY_TIMEOUT_MS, env.SEARCH_CACHE_DB, ctx, requestId)
      : Promise.resolve({ value: null, error: needsTavily ? 'Web search is not configured.' : undefined, cacheStatus: 'SKIP' as const, apiCalls: 0, providerMs: 0, d1LookupMs: 0, d1LookupStatus: 'DISABLED' as const }),
  ])

  const youtubeOk = !needsYouTube || !youtube.error
  const tavilyOk = !needsTavily || !tavily.error
  const payload: SearchPayload = {
    success: youtubeOk || tavilyOk,
    requestId,
    query,
    type,
    videos: youtube.value || [],
    web: tavily.value || [],
    providers: {
      youtube: { ok: youtubeOk, ...(youtube.error ? { error: youtube.error } : {}) },
      tavily: { ok: tavilyOk, ...(tavily.error ? { error: tavily.error } : {}) },
    },
  }
  const response = !youtubeOk && !tavilyOk
    ? json({ ...payload, message: 'All requested search providers failed.' }, 502)
    : json(payload)
  console.info('[search] completed', JSON.stringify({
    requestId,
    query: cacheQuery,
    type,
    authMs,
    validationMs,
    d1CacheLookupMs: Math.max(youtube.d1LookupMs, tavily.d1LookupMs),
    youtubeD1LookupMs: youtube.d1LookupMs,
    tavilyD1LookupMs: tavily.d1LookupMs,
    youtubeD1Cache: youtube.d1LookupStatus,
    tavilyD1Cache: tavily.d1LookupStatus,
    youtubeCache: youtube.cacheStatus,
    tavilyCache: tavily.cacheStatus,
    youtubeMs: youtube.providerMs,
    tavilyMs: tavily.providerMs,
    youtubeApiCalls: youtube.apiCalls,
    tavilyApiCalls: tavily.apiCalls,
    d1CacheWriteMs: 'deferred',
    totalMs: performance.now() - startedAt,
  }))

  // Save to user's search history if search was successful
  const historyDb = getHistoryDb(env)
  if ((youtubeOk || tavilyOk) && historyDb) {
    const user = await verifyFirebaseToken(request, env)
    const resultJson = JSON.stringify({
      query,
      type,
      videos: youtube.value || [],
      web: tavily.value || [],
      providers: payload.providers,
      timestamp: Date.now(),
    })
    ctx.waitUntil(saveSearchHistory(user, query, type, resultJson, historyDb))
  }

  return response
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const user = await verifyFirebaseToken(request, env)
  return json({ success: true, user: { id: user.uid, uid: user.uid, email: user.email, name: user.name, avatarUrl: user.picture, subscriptionTier: 'free' } })
}

async function handleSearchHistory(request: Request, env: Env): Promise<Response> {
  const user = await verifyFirebaseToken(request, env)
  const url = new URL(request.url)
  const cursor = url.searchParams.get('cursor')
  const limit = Math.min(Number(url.searchParams.get('limit') || SEARCH_HISTORY_PAGE_SIZE), 50)

  const historyDb = getHistoryDb(env)
  if (!historyDb) {
    return json({ success: false, message: 'Search history is not configured.' }, 503)
  }

  try {
    let query = 'SELECT id, user_id, query, search_type, result_json, created_at FROM search_history WHERE user_id = ?1 ORDER BY created_at DESC LIMIT ?2'
    const params: (string | number)[] = [user.uid, limit + 1]
    if (cursor) {
      query += ' AND created_at < ?3'
      params.push(Number(cursor))
    }

    console.info('[search] Fetching search history', JSON.stringify({ userId: user.uid, limit, cursor }))
    const results = await historyDb.prepare(query).bind(...params).all<SearchHistoryEntry>()
    console.info('[search] Search history query result', JSON.stringify({ userId: user.uid, rowCount: results.results?.length || 0 }))
    const entries = results.results || []
    const hasMore = entries.length > limit
    const items = hasMore ? entries.slice(0, limit) : entries
    const nextCursor = hasMore ? String(items[items.length - 1].created_at) : undefined

    return json({ success: true, history: items, cursor: nextCursor })
  } catch (error) {
    console.error('[search] Failed to fetch search history', JSON.stringify({
      userId: user.uid,
      message: error instanceof Error ? error.message : 'Unknown error'
    }))
    return json({ success: false, message: 'Failed to fetch search history.' }, 500)
  }
}

async function handleSearchHistoryDetail(request: Request, env: Env): Promise<Response> {
  const user = await verifyFirebaseToken(request, env)
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()

  const historyDb = getHistoryDb(env)
  if (!id || !historyDb) {
    return json({ success: false, message: 'Search history is not configured.' }, 503)
  }

  if (request.method === 'GET') {
    try {
      const entry = await historyDb.prepare(
        'SELECT id, user_id, query, search_type, result_json, created_at FROM search_history WHERE id = ?1 AND user_id = ?2'
      ).bind(id, user.uid).first<SearchHistoryEntry>()

      if (!entry) {
        return json({ success: false, message: 'Search history entry not found.' }, 404)
      }

      return json({ success: true, entry })
    } catch (error) {
      console.error('[search] Failed to fetch search history detail', JSON.stringify({
        userId: user.uid,
        id,
        message: error instanceof Error ? error.message : 'Unknown error'
      }))
      return json({ success: false, message: 'Failed to fetch search history entry.' }, 500)
    }
  }

  if (request.method === 'DELETE') {
    try {
      const result = await historyDb.prepare(
        'DELETE FROM search_history WHERE id = ?1 AND user_id = ?2'
      ).bind(id, user.uid).run()

      if (result.meta.changes === 0) {
        return json({ success: false, message: 'Search history entry not found.' }, 404)
      }

      return json({ success: true, message: 'Search history entry deleted.' })
    } catch (error) {
      console.error('[search] Failed to delete search history entry', JSON.stringify({
        userId: user.uid,
        id,
        message: error instanceof Error ? error.message : 'Unknown error'
      }))
      return json({ success: false, message: 'Failed to delete search history entry.' }, 500)
    }
  }

  return json({ success: false, message: 'Method not allowed.' }, 405)
}

// Study Plan Handlers
async function handleStudyPlansList(request: Request, env: Env): Promise<Response> {
  const user = await verifyFirebaseToken(request, env)
  const db = env.SEARCH_CACHE_DB
  if (!db) {
    return json({ success: false, message: 'Database not configured.' }, 503)
  }

  try {
    const results = await db.prepare(
      'SELECT id, user_id, title, topic, description, knowledge_level, daily_study_time_minutes, target_completion_date, learning_goals, additional_instructions, total_estimated_days, progress, plan_data_json, created_at, updated_at FROM ai_study_plans WHERE user_id = ?1 ORDER BY created_at DESC'
    ).bind(user.uid).all<StudyPlan>()

    return json({ success: true, plans: results.results || [] })
  } catch (error) {
    console.error('[study-plans] Failed to fetch plans', JSON.stringify({
      userId: user.uid,
      message: error instanceof Error ? error.message : 'Unknown error'
    }))
    return json({ success: false, message: 'Failed to fetch study plans.' }, 500)
  }
}

async function handleStudyPlanGenerate(request: Request, env: Env): Promise<Response> {
  const user = await verifyFirebaseToken(request, env)
  const db = env.SEARCH_CACHE_DB
  if (!db) {
    return json({ success: false, message: 'Database not configured.' }, 503)
  }

  let input: StudyPlanGenerateRequest
  try {
    const contentType = request.headers.get('Content-Type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      return json({ success: false, message: 'Send the request as JSON.' }, 415)
    }
    const body = await request.json()
    input = body as StudyPlanGenerateRequest
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400)
  }

  // Validate input
  if (!input.topic || typeof input.topic !== 'string' || input.topic.trim().length === 0) {
    return json({ success: false, message: 'Topic is required.' }, 400)
  }
  if (input.topic.trim().length > 200) {
    return json({ success: false, message: 'Topic must be 200 characters or fewer.' }, 400)
  }
  if (!['beginner', 'intermediate', 'advanced'].includes(input.knowledgeLevel)) {
    return json({ success: false, message: 'Knowledge level must be beginner, intermediate, or advanced.' }, 400)
  }
  if (!Number.isInteger(input.dailyStudyTimeMinutes) || input.dailyStudyTimeMinutes < 15 || input.dailyStudyTimeMinutes > 480) {
    return json({ success: false, message: 'Daily study time must be between 15 and 480 minutes.' }, 400)
  }
  if (!Number.isFinite(input.targetCompletionDate) || input.targetCompletionDate <= Math.floor(Date.now() / 1000) + 86400) {
    return json({ success: false, message: 'Target completion date must be at least 1 day in the future.' }, 400)
  }
  if (!input.learningGoals || typeof input.learningGoals !== 'string' || input.learningGoals.trim().length === 0) {
    return json({ success: false, message: 'Learning goals are required.' }, 400)
  }
  if (input.learningGoals.length > 2000) {
    return json({ success: false, message: 'Learning goals must be 2000 characters or fewer.' }, 400)
  }
  if (input.additionalInstructions && input.additionalInstructions.length > 2000) {
    return json({ success: false, message: 'Additional instructions must be 2000 characters or fewer.' }, 400)
  }

  // Check if Gemini is configured
  if (!env.GEMINI_API_KEY) {
    return json({ success: false, message: 'AI service is not configured.' }, 503)
  }

  // Generate plan using Gemini
  const geminiInput = {
    topic: input.topic.trim(),
    knowledgeLevel: input.knowledgeLevel,
    dailyStudyTimeMinutes: input.dailyStudyTimeMinutes,
    targetCompletionDate: input.targetCompletionDate,
    learningGoals: input.learningGoals.trim(),
    additionalInstructions: input.additionalInstructions?.trim() || '',
  }

  const generationResult = await generateStudyPlan(env, geminiInput)
  if (!generationResult.success || !generationResult.plan) {
    return json({ success: false, error: generationResult.error, message: generationResult.message }, 500)
  }

  const plan = generationResult.plan

  // Save plan to database atomically using batch
  const planId = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const planDataJson = JSON.stringify(plan)

  // Prepare all statements for atomic execution
  const statements: D1PreparedStatement[] = []

  // Plan insert statement
  statements.push(
    db.prepare(
      `INSERT INTO ai_study_plans (
        id, user_id, title, topic, description, knowledge_level, daily_study_time_minutes,
        target_completion_date, learning_goals, additional_instructions, total_estimated_days,
        progress, plan_data_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      planId, user.uid, plan.title, plan.topic, plan.description, geminiInput.knowledgeLevel,
      geminiInput.dailyStudyTimeMinutes, geminiInput.targetCompletionDate, geminiInput.learningGoals,
      geminiInput.additionalInstructions || null, plan.totalEstimatedDays, 0, planDataJson, now, now
    )
  )

  // Task insert statements with pre-generated IDs
  const taskRecords: Array<{
    id: string
    planId: string
    userId: string
    dayNumber: number
    taskTitle: string
    taskDescription: string
    estimatedDurationMinutes: number
    moduleName: string
    moduleOrder: number
  }> = []

  for (const module of plan.modules) {
    for (const task of module.tasks) {
      const taskId = crypto.randomUUID()
      taskRecords.push({
        id: taskId,
        planId,
        userId: user.uid,
        dayNumber: task.dayNumber,
        taskTitle: task.taskTitle,
        taskDescription: task.taskDescription,
        estimatedDurationMinutes: task.estimatedDurationMinutes,
        moduleName: task.moduleName,
        moduleOrder: task.moduleOrder,
      })
      statements.push(
        db.prepare(
          `INSERT INTO ai_study_plan_tasks (
            id, plan_id, user_id, day_number, task_title, task_description,
            estimated_duration_minutes, module_name, module_order, is_completed,
            completed_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          taskId, planId, user.uid, task.dayNumber, task.taskTitle, task.taskDescription,
          task.estimatedDurationMinutes, task.moduleName, task.moduleOrder, 0,
          null, now, now
        )
      )
    }
  }

  try {
    // Execute all statements atomically
    await db.batch(statements)
    console.info('[study-plans] Plan and tasks saved', JSON.stringify({ planId, taskCount: taskRecords.length }))

    // Build response using the same IDs
    const savedPlan: StudyPlan = {
      id: planId,
      user_id: user.uid,
      title: plan.title,
      topic: plan.topic,
      description: plan.description,
      knowledge_level: geminiInput.knowledgeLevel,
      daily_study_time_minutes: geminiInput.dailyStudyTimeMinutes,
      target_completion_date: geminiInput.targetCompletionDate,
      learning_goals: geminiInput.learningGoals,
      additional_instructions: geminiInput.additionalInstructions || null,
      total_estimated_days: plan.totalEstimatedDays,
      progress: 0,
      plan_data_json: planDataJson,
      created_at: now,
      updated_at: now,
    }

    const savedTasks: StudyPlanTask[] = taskRecords.map(task => ({
      id: task.id,
      plan_id: task.planId,
      user_id: task.userId,
      day_number: task.dayNumber,
      task_title: task.taskTitle,
      task_description: task.taskDescription,
      estimated_duration_minutes: task.estimatedDurationMinutes,
      module_name: task.moduleName,
      module_order: task.moduleOrder,
      is_completed: 0,
      completed_at: null,
      created_at: now,
      updated_at: now,
    }))

    // Create a response plan that includes modules for the frontend
    const responsePlan = {
      ...savedPlan,
      modules: plan.modules,
    }

    return json({ success: true, plan: responsePlan, tasks: savedTasks })
  } catch (error) {
    console.error('[study-plans] Failed to save generated plan', JSON.stringify({
      userId: user.uid,
      planId,
      message: error instanceof Error ? error.message : 'Unknown error'
    }))
    return json({ success: false, message: 'Failed to save generated study plan.' }, 500)
  }
}

async function handleStudyPlanDetail(request: Request, env: Env): Promise<Response> {
  const user = await verifyFirebaseToken(request, env)
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()

  const db = env.SEARCH_CACHE_DB
  if (!id || !db) {
    return json({ success: false, message: 'Database not configured.' }, 503)
  }

  if (request.method === 'GET') {
    try {
      const plan = await db.prepare(
        'SELECT id, user_id, title, topic, description, knowledge_level, daily_study_time_minutes, target_completion_date, learning_goals, additional_instructions, total_estimated_days, progress, plan_data_json, created_at, updated_at FROM ai_study_plans WHERE id = ?1 AND user_id = ?2'
      ).bind(id, user.uid).first<StudyPlan>()

      if (!plan) {
        return json({ success: false, message: 'Study plan not found.' }, 404)
      }

      const tasks = await db.prepare(
        'SELECT id, plan_id, user_id, day_number, task_title, task_description, estimated_duration_minutes, module_name, module_order, is_completed, completed_at, created_at, updated_at FROM ai_study_plan_tasks WHERE plan_id = ?1 AND user_id = ?2 ORDER BY day_number, module_order'
      ).bind(id, user.uid).all<StudyPlanTask>()

      return json({ success: true, plan, tasks: tasks.results || [] })
    } catch (error) {
      console.error('[study-plans] Failed to fetch plan detail', JSON.stringify({
        userId: user.uid,
        id,
        message: error instanceof Error ? error.message : 'Unknown error'
      }))
      return json({ success: false, message: 'Failed to fetch study plan.' }, 500)
    }
  }

  return json({ success: false, message: 'Method not allowed.' }, 405)
}

async function handleStudyPlanTaskUpdate(request: Request, env: Env): Promise<Response> {
  const user = await verifyFirebaseToken(request, env)
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const planId = pathParts[pathParts.length - 3]
  const taskId = pathParts[pathParts.length - 1]

  const db = env.SEARCH_CACHE_DB
  if (!planId || !taskId || !db) {
    return json({ success: false, message: 'Database not configured.' }, 503)
  }

  if (request.method !== 'PATCH') {
    return json({ success: false, message: 'Method not allowed.' }, 405)
  }

  let body: StudyPlanTaskUpdateRequest
  try {
    const contentType = request.headers.get('Content-Type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      return json({ success: false, message: 'Send the request as JSON.' }, 415)
    }
    body = await request.json()
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400)
  }

  if (typeof body.isCompleted !== 'boolean') {
    return json({ success: false, message: 'isCompleted must be a boolean.' }, 400)
  }

  try {
    const now = Math.floor(Date.now() / 1000)
    const completedAt = body.isCompleted ? now : null

    // Combined query: verify plan ownership, task existence, and get current completion status in one query
    const task = await db.prepare(
      `SELECT t.id, t.is_completed, t.plan_id
       FROM ai_study_plan_tasks t
       JOIN ai_study_plans p ON t.plan_id = p.id
       WHERE t.id = ?1 AND p.id = ?2 AND p.user_id = ?3`
    ).bind(taskId, planId, user.uid).first<{ id: string; is_completed: number; plan_id: string }>()

    if (!task) {
      return json({ success: false, message: 'Task not found or access denied.' }, 404)
    }

    // Skip if already in desired state
    if (task.is_completed === (body.isCompleted ? 1 : 0)) {
      return json({ success: true, task: { ...task, is_completed: body.isCompleted ? 1 : 0, completed_at: completedAt, updated_at: Math.floor(Date.now() / 1000) }, message: 'Task already in desired state.' })
    }

    // Update task and recalculate progress in parallel where possible
    // First update the task
    await db.prepare(
      'UPDATE ai_study_plan_tasks SET is_completed = ?1, completed_at = ?2, updated_at = ?3 WHERE id = ?4'
    ).bind(body.isCompleted ? 1 : 0, completedAt, now, taskId).run()

    // Recalculate plan progress with a single query
    const taskStats = await db.prepare(
      'SELECT COUNT(*) as total, SUM(is_completed) as completed FROM ai_study_plan_tasks WHERE plan_id = ?1'
    ).bind(planId).first<{ total: number; completed: number }>()

    if (taskStats && taskStats.total > 0) {
      const progress = Math.round((taskStats.completed / taskStats.total) * 100)
      await db.prepare(
        'UPDATE ai_study_plans SET progress = ?1, updated_at = ?2 WHERE id = ?3'
      ).bind(progress, now, planId).run()
    }

    return json({ success: true, task: { ...task, is_completed: body.isCompleted ? 1 : 0, completed_at: completedAt, updated_at: now }, message: 'Task updated successfully.' })
  } catch (error) {
    console.error('[study-plans] Failed to update task', JSON.stringify({
      userId: user.uid,
      planId,
      taskId,
      message: error instanceof Error ? error.message : 'Unknown error'
    }))
    return json({ success: false, message: 'Failed to update task.' }, 500)
  }
}

async function handleStudyPlanDelete(request: Request, env: Env): Promise<Response> {
  const user = await verifyFirebaseToken(request, env)
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()

  const db = env.SEARCH_CACHE_DB
  if (!id || !db) {
    return json({ success: false, message: 'Database not configured.' }, 503)
  }

  if (request.method !== 'DELETE') {
    return json({ success: false, message: 'Method not allowed.' }, 405)
  }

  try {
    const result = await db.prepare(
      'DELETE FROM ai_study_plans WHERE id = ?1 AND user_id = ?2'
    ).bind(id, user.uid).run()

    if (result.meta.changes === 0) {
      return json({ success: false, message: 'Study plan not found.' }, 404)
    }

    // Tasks are deleted via CASCADE
    return json({ success: true, message: 'Study plan deleted successfully.' })
  } catch (error) {
    console.error('[study-plans] Failed to delete plan', JSON.stringify({
      userId: user.uid,
      id,
      message: error instanceof Error ? error.message : 'Unknown error'
    }))
    return json({ success: false, message: 'Failed to delete study plan.' }, 500)
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const headers = corsHeaders(request, env)
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })

    try {
      // TEMPORARY: available only when explicitly enabled in a development preview config.
      if (url.pathname === '/__dev/outbound-network-diagnostic') {
        if (env.ENABLE_DEV_DIAGNOSTICS !== 'true') return json({ success: false, message: 'Not found.' }, 404, headers)
        if (request.method !== 'GET') return json({ success: false, message: 'Method not allowed.' }, 405, headers)
        const response = await handleOutboundNetworkDiagnostic(env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return json({ success: true, status: 'ok' }, 200, headers)
      }
      // Diagnostic endpoint: test Firebase certificate fetch step by step
      if (url.pathname === '/__dev/test-cert-fetch' && request.method === 'GET') {
        console.info('[test-cert-fetch] Endpoint hit', JSON.stringify({ pathname: url.pathname }))
        
        // Test 1: fetch to httpbin
        const testUrl = 'https://httpbin.org/get'
        const fetchStart = performance.now()
        console.info('[test-cert-fetch] Starting fetch to httpbin', JSON.stringify({ url: testUrl }))
        let httpbinResult: Record<string, unknown> = {}
        try {
          const response = await fetch(testUrl)
          const fetchDuration = performance.now() - fetchStart
          console.info('[test-cert-fetch] httpbin fetch completed', JSON.stringify({ status: response.status, ok: response.ok, durationMs: fetchDuration }))
          httpbinResult = { success: true, status: response.status, ok: response.ok, durationMs: fetchDuration }
        } catch (error) {
          const fetchDuration = performance.now() - fetchStart
          console.error('[test-cert-fetch] httpbin fetch failed', JSON.stringify({ error: error instanceof Error ? error.message : String(error), durationMs: fetchDuration }))
          httpbinResult = { success: false, error: error instanceof Error ? error.message : String(error), durationMs: fetchDuration }
        }
        
        // Test 2: fetch to cert URL
        const certFetchStart = performance.now()
        console.info('[test-cert-fetch] Starting fetch to cert URL', JSON.stringify({ url: CERT_URL }))
        let certResult: Record<string, unknown> = {}
        try {
          const response = await fetch(CERT_URL)
          const fetchDuration = performance.now() - certFetchStart
          console.info('[test-cert-fetch] cert URL fetch completed', JSON.stringify({ status: response.status, ok: response.ok, durationMs: fetchDuration }))
          certResult = { success: true, status: response.status, ok: response.ok, durationMs: fetchDuration }
        } catch (error) {
          const fetchDuration = performance.now() - certFetchStart
          console.error('[test-cert-fetch] cert URL fetch failed', JSON.stringify({ error: error instanceof Error ? error.message : String(error), durationMs: fetchDuration }))
          certResult = { success: false, error: error instanceof Error ? error.message : String(error), durationMs: fetchDuration }
        }
        
        return json({
          success: true,
          httpbin: httpbinResult,
          certUrl: certResult,
          cacheSize: certCache.size,
          hasProjectId: certCache.has(env.FIREBASE_PROJECT_ID || '')
        }, 200, headers)
      }
      if (url.pathname === '/api/search' && request.method === 'POST') {
        const response = await handleSearch(request, env, ctx)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname === '/api/me' && request.method === 'GET') {
        const response = await handleMe(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname === '/api/search-history' && request.method === 'GET') {
        const response = await handleSearchHistory(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname.startsWith('/api/search-history/') && (request.method === 'GET' || request.method === 'DELETE')) {
        const response = await handleSearchHistoryDetail(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname === '/api/study-plans' && request.method === 'GET') {
        const response = await handleStudyPlansList(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname === '/api/study-plans/generate' && request.method === 'POST') {
        const response = await handleStudyPlanGenerate(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname === '/api/study-plans' && request.method === 'POST') {
        const response = await handleStudyPlanGenerate(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname.startsWith('/api/study-plans/') && request.method === 'GET') {
        const response = await handleStudyPlanDetail(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname.startsWith('/api/study-plans/') && request.method === 'PATCH') {
        const response = await handleStudyPlanTaskUpdate(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname.startsWith('/api/study-plans/') && request.method === 'DELETE') {
        const response = await handleStudyPlanDelete(request, env)
        const responseHeaders = new Headers(response.headers)
        new Headers(headers).forEach((value, key) => responseHeaders.set(key, value))
        return new Response(response.body, { status: response.status, headers: responseHeaders })
      }
      if (url.pathname.startsWith('/api/')) return json({ success: false, message: 'API route not found.' }, 404, headers)
      return json({ success: false, message: 'Not found.' }, 404, headers)
    } catch (error) {
      if (error instanceof HttpError) return json({ success: false, message: error.message }, error.status, headers)
      return json({ success: false, message: 'An unexpected server error occurred.' }, 500, headers)
    }
  },
} satisfies ExportedHandler<Env>
