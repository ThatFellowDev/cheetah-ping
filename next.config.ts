import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''} https://challenges.cloudflare.com https://eu.i.posthog.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://eu.i.posthog.com https://challenges.cloudflare.com https://*.stripe.com",
      "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/((?!api/monitors/proxy).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          ...securityHeaders,
        ],
      },
      {
        source: "/api/monitors/proxy",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
