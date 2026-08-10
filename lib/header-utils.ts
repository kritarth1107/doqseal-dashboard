import { AxiosHeaders } from 'axios';

/**
 * Common security headers that should be included in outgoing backend requests.
 */
const BASE_SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

/**
 * Identification metadata that can be passed to header factories.
 */
export interface IdentityMetadata {
  token?: string;
  fingerprint?: string | null;
  userAgent?: string | null;
  ip?: string | null;
}

/**
 * Creates headers for JSON-based API requests.
 * 
 * @param metadata Identity and authorization metadata
 * @returns Headers object compatible with Axios or Fetch
 */
export function createJsonHeaders(metadata: IdentityMetadata = {}) {
  const { token, fingerprint, userAgent, ip } = metadata;
  
  const headers: Record<string, string> = {
    ...BASE_SECURITY_HEADERS,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (fingerprint) {
    headers['x-fingerprint'] = fingerprint;
  }

  if (userAgent) {
    headers['x-user-agent'] = userAgent;
  }

  if (ip) {
    headers['x-forwarded-for'] = ip;
  }

  return headers;
}

/**
 * Creates headers for multipart/form-data requests (e.g., file uploads).
 * 
 * @param metadata Identity and authorization metadata
 * @returns Headers object compatible with Axios
 */
export function createMultipartHeaders(metadata: IdentityMetadata = {}) {
  const { token, fingerprint, userAgent, ip } = metadata;

  const headers: Record<string, string> = {
    ...BASE_SECURITY_HEADERS,
    // Left empty so Axios/fetch will automatically inject 'multipart/form-data; boundary=---...'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (fingerprint) {
    headers['x-fingerprint'] = fingerprint;
  }

  if (userAgent) {
    headers['x-user-agent'] = userAgent;
  }

  if (ip) {
    headers['x-forwarded-for'] = ip;
  }

  return headers;
}

/**
 * Helper for Next.js API routes to automatically extract identity context from an incoming request.
 * 
 * @param request The incoming NextRequest
 * @param token Optional bearer token override
 * @returns Fully populated headers for backend communication
 */
export function getHeadersFromRequest(request: any, token?: string, isMultipart: boolean = false) {
  const fingerprint = request.headers.get('x-fingerprint') || request.cookies?.get('x-fingerprint')?.value;
  const userAgent = request.headers.get('user-agent');
  let ip = request.headers.get('x-forwarded-for') || '';
  
  const contentType = request.headers.get('content-type') || '';
  const multipart = isMultipart || contentType.includes('multipart/form-data');

  const organisationId =
    request.headers.get('x-organisation-id') ||
    request.cookies?.get('active_organisation_id')?.value;

  const metadata = {
    token: token || request.cookies?.get('session_token')?.value,
    fingerprint,
    userAgent,
    ip
  };

  const headers = multipart
    ? createMultipartHeaders(metadata)
    : createJsonHeaders(metadata);

  if (organisationId) {
    headers['x-organisation-id'] = organisationId;
  }

  return headers;
}
