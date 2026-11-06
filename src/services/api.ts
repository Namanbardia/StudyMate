import { auth } from '@/firebase/config'

/**
 * Custom Error class representing an API failure (HTTP error or network failure).
 */
export class ApiError extends Error {
  public status: number
  public data: any

  constructor(status: number, message: string, data: any = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Options for apiRequest.
 */
export interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
  retryUnauthorized?: boolean
  params?: Record<string, string | number | boolean | undefined | null>
}

/**
 * Standard user response structure from Cloudflare Worker GET /api/me
 */
export interface WorkerUser {
  id?: string
  uid?: string
  email?: string
  name?: string
  avatar_url?: string
  avatarUrl?: string
  subscription_tier?: string
  subscriptionTier?: string
  onboarding_completed?: boolean
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface WorkerMeResponse {
  success?: boolean
  user?: WorkerUser
  data?: WorkerUser
  message?: string
  [key: string]: any
}

export type SearchType = 'all' | 'videos' | 'web'

export interface YouTubeSearchResult {
  id: string
  title: string
  url: string
  thumbnail: string
  channel: string
  publishedAt: string
  description: string
}

export interface WebSearchResult {
  title: string
  url: string
  content: string
  score: number | null
}

export interface StudySearchResponse {
  success: boolean
  query: string
  type: SearchType
  videos: YouTubeSearchResult[]
  web: WebSearchResult[]
  providers: {
    youtube: { ok: boolean; error?: string }
    tavily: { ok: boolean; error?: string }
  }
  message?: string
}

export interface SearchHistoryEntry {
  id: string
  user_id: string
  query: string
  search_type: SearchType
  result_json: string
  created_at: number
}

export interface SearchHistoryResponse {
  success: boolean
  history: SearchHistoryEntry[]
  cursor?: string
}

export interface SearchHistoryDetailResponse {
  success: boolean
  entry?: SearchHistoryEntry
  message?: string
}

/**
 * Base URL for the Cloudflare API Worker.
 * Defaults to import.meta.env.VITE_API_BASE_URL if configured.
 * In local development on localhost/127.0.0.1, uses relative path to route through Vite proxy
 * so that Cloudflare Worker CORS restrictions on localhost origins are cleanly avoided.
 */
function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL || ''
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '')
  }

  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return ''
  }
  return ''
}

/**
 * Retrieve the current Firebase user's ID token on-demand without storing it in storage.
 * Waits for authStateReady if Firebase is still initializing.
 */
export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  try {
    // If auth state is still resolving on initial page load, wait for it
    if (typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady()
    }

    const currentUser = auth.currentUser
    if (!currentUser) {
      return null
    }

    // Never store this token in localStorage or sessionStorage.
    // Firebase manages in-memory credentials and internal refresh cycles.
    return await currentUser.getIdToken(forceRefresh)
  } catch (err) {
    console.warn('[API Service] Failed to obtain Firebase ID token:', err)
    return null
  }
}

/**
 * Reusable API request function.
 * Automatically attaches Firebase ID token via Authorization: Bearer <token>.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    requiresAuth = true,
    retryUnauthorized = true,
    params,
    headers: customHeaders = {},
    ...restOptions
  } = options

  // Build full target URL
  const baseUrl = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  let fullUrl = `${baseUrl}${cleanEndpoint}`

  // Append query parameters if supplied
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val))
      }
    }
    const queryString = searchParams.toString()
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
    }
  }

  // Set default JSON headers
  const headers = new Headers(customHeaders)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  // Auto-set Content-Type: application/json if there is a body and it is not FormData
  if (
    restOptions.body &&
    !(restOptions.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  // Obtain and attach Firebase Bearer token if required
  if (requiresAuth) {
    const token = await getFirebaseIdToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    } else {
      throw new ApiError(
        401,
        'Authentication required: No active Firebase session found.'
      )
    }
  }

  // Internal execution helper with 401 retry on token refresh
  const execute = async (authRetry = false): Promise<T> => {
    let response: Response
    try {
      response = await fetch(fullUrl, {
        ...restOptions,
        headers
      })
    } catch (networkErr: any) {
      // If direct request failed with a network error / CORS block while on localhost in development,
      // fallback to the Vite local dev proxy (/api/...)
      if (
        baseUrl &&
        fullUrl.startsWith(baseUrl) &&
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        try {
          const proxiedUrl = fullUrl.replace(baseUrl, '')
          response = await fetch(proxiedUrl, {
            ...restOptions,
            headers
          })
        } catch (proxyErr: any) {
          throw new ApiError(
            0,
            `Network error connecting to API: ${proxyErr?.message || 'Server unreachable'}`
          )
        }
      } else {
        throw new ApiError(
          0,
          `Network error connecting to API: ${networkErr?.message || 'Server unreachable'}. (If running on localhost, ensure your dev server is restarted so Vite proxy is active, or allow http://${typeof window !== 'undefined' ? window.location.host : 'localhost:5173'} in your Cloudflare Worker CORS headers)`
        )
      }
    }

    // If 401 Unauthorized occurs and we haven't retried yet, force a token refresh and retry once
    if (response.status === 401 && requiresAuth && retryUnauthorized && !authRetry) {
      const refreshedToken = await getFirebaseIdToken(true)
      if (refreshedToken) {
        headers.set('Authorization', `Bearer ${refreshedToken}`)
        return execute(true)
      }
    }

    // Parse response body
    let responseData: any = null
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json()
      } catch {
        responseData = null
      }
    } else {
      try {
        responseData = await response.text()
      } catch {
        responseData = null
      }
    }

    // Handle non-2xx status codes
    if (!response.ok) {
      const errorMessage =
        (responseData && typeof responseData === 'object' && responseData.message) ||
        (typeof responseData === 'string' && responseData) ||
        `HTTP ${response.status} ${response.statusText}`

      throw new ApiError(response.status, errorMessage, responseData)
    }

    return responseData as T
  }

  return execute(false)
}

/**
 * Fetch authenticated user details from Cloudflare Worker: GET /api/me
 * Sends the Firebase ID token in the Authorization header.
 */
export async function getMe(): Promise<WorkerMeResponse> {
  return apiRequest<WorkerMeResponse>('/api/me', {
    method: 'GET',
    requiresAuth: true
  })
}

export async function searchStudyResources(query: string, type: SearchType): Promise<StudySearchResponse> {
  const normalizedQuery = query.normalize('NFKC').trim().replace(/\s+/gu, ' ')
  const dedupeKey = `${normalizedQuery.toLocaleLowerCase('en-US')}::${type}`
  const existingRequest = inFlightSearchRequests.get(dedupeKey)
  if (existingRequest) return existingRequest

  let request: Promise<StudySearchResponse>
  request = apiRequest<StudySearchResponse>('/api/search', {
    method: 'POST',
    requiresAuth: true,
    retryUnauthorized: false,
    body: JSON.stringify({ query: normalizedQuery, type }),
  }).finally(() => {
    if (inFlightSearchRequests.get(dedupeKey) === request) inFlightSearchRequests.delete(dedupeKey)
  })
  inFlightSearchRequests.set(dedupeKey, request)
  return request
}

export async function getSearchHistory(limit = 20, cursor?: string): Promise<SearchHistoryResponse> {
  const params: Record<string, string> = { limit: String(limit) }
  if (cursor) params.cursor = cursor
  return apiRequest<SearchHistoryResponse>('/api/search-history', {
    method: 'GET',
    requiresAuth: true,
    params,
  })
}

export async function getSearchHistoryEntry(id: string): Promise<SearchHistoryDetailResponse> {
  return apiRequest<SearchHistoryDetailResponse>(`/api/search-history/${id}`, {
    method: 'GET',
    requiresAuth: true,
  })
}

export async function deleteSearchHistoryEntry(id: string): Promise<{ success: boolean; message?: string }> {
  return apiRequest<{ success: boolean; message?: string }>(`/api/search-history/${id}`, {
    method: 'DELETE',
    requiresAuth: true,
  })
}

const inFlightSearchRequests = new Map<string, Promise<StudySearchResponse>>()

// Alias for convenience
export const fetchCurrentUser = getMe

