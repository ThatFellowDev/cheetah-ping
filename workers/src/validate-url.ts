const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '169.254.169.254', // AWS/GCP metadata
  'metadata.google.internal',
];

const BLOCKED_PATTERNS = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^169\.254\./, // link-local
  /^fe80:/i, // IPv6 link-local
  /^fc00:/i, // IPv6 unique local
  /^fd/i, // IPv6 unique local
];

export function isSafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return false;
    }

    if (BLOCKED_PATTERNS.some((p) => p.test(hostname))) {
      return false;
    }

    if (!hostname.includes('.')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
