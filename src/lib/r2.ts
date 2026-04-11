/**
 * Cloudflare R2 client for the Vercel side (Next.js API routes).
 *
 * R2 is S3-compatible, so we sign PUT/DELETE requests with AWS SigV4
 * by hand using Node's built-in `crypto`. We deliberately avoid
 * `@aws-sdk/client-s3` (~5MB bundle, hurts Vercel cold starts) — for the
 * tiny set of operations we need (PUT, DELETE), hand-rolled SigV4 is
 * smaller, faster, and adds zero dependencies.
 *
 * The Worker side does NOT use this — it uses the R2 binding directly
 * via `env.SCREENSHOTS.put()` from workers/src/index.ts.
 *
 * Public URLs are generated against `R2_PUBLIC_URL` (the custom domain
 * `https://screenshots.cheetahping.com` we connected to the bucket).
 */

import crypto from 'node:crypto';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

function getConfig(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error('R2 environment variables not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)');
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function sha256Hex(data: string | Uint8Array): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function getSigningKey(secret: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac('AWS4' + secret, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

/**
 * RFC 3986 compliant URL encoding for individual path segments.
 * `encodeURIComponent` leaves `!*'()` unescaped, which differs from S3's expectation.
 */
function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function encodeKeyPath(key: string): string {
  return key.split('/').map(encodeRfc3986).join('/');
}

async function signedRequest(
  method: 'PUT' | 'DELETE',
  key: string,
  body: Uint8Array | null,
  contentType: string | null,
): Promise<Response> {
  const cfg = getConfig();
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${cfg.bucket}/${encodeKeyPath(key)}`;
  const url = `https://${host}${canonicalUri}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = body ? sha256Hex(body) : sha256Hex('');

  // Headers that participate in the signature (lowercase, sorted by name)
  const sigHeaders: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) sigHeaders['content-type'] = contentType;

  const sortedHeaderNames = Object.keys(sigHeaders).sort();
  const canonicalHeaders = sortedHeaderNames.map((h) => `${h}:${sigHeaders[h].trim()}\n`).join('');
  const signedHeaders = sortedHeaderNames.join(';');

  const canonicalRequest = [
    method,
    canonicalUri,
    '', // empty canonical query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(cfg.secretAccessKey, dateStamp, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const fetchHeaders: Record<string, string> = {
    Authorization: authorization,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) fetchHeaders['Content-Type'] = contentType;

  return await fetch(url, {
    method,
    headers: fetchHeaders,
    // Uint8Array is a valid BodyInit at runtime; the cast works around a
    // strict generic mismatch in newer lib.dom.d.ts (ArrayBufferLike vs ArrayBuffer).
    body: (body ?? undefined) as BodyInit | undefined,
  });
}

/**
 * Upload bytes to R2. Returns the public URL.
 *
 * @param key  Object key, e.g. `previews/abc123.png` or `snapshots/<monitor>/<change>.jpg`
 * @param body Image bytes
 * @param contentType e.g. `image/png`, `image/jpeg`
 */
export async function uploadToR2(key: string, body: Uint8Array, contentType: string): Promise<string> {
  const cfg = getConfig();
  const res = await signedRequest('PUT', key, body, contentType);
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`R2 upload failed (${res.status} ${res.statusText}): ${detail}`.trim());
  }
  return `${cfg.publicUrl}/${key}`;
}

/**
 * Delete an object from R2. Silently succeeds on 404.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const res = await signedRequest('DELETE', key, null, null);
  if (!res.ok && res.status !== 404) {
    const detail = await res.text().catch(() => '');
    throw new Error(`R2 delete failed (${res.status} ${res.statusText}): ${detail}`.trim());
  }
}

/**
 * Extract the R2 object key from a public screenshot URL.
 * Inverse of the URL constructed by `uploadToR2`. Returns null if the URL
 * isn't an R2 public URL we issued.
 */
export function r2KeyFromUrl(url: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) return null;
  const prefix = publicUrl.endsWith('/') ? publicUrl : publicUrl + '/';
  if (!url.startsWith(prefix)) return null;
  return url.slice(prefix.length);
}
