import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://cheetahping.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cheetah Ping - Website Change Monitor",
    template: "%s | Cheetah Ping",
  },
  description:
    "Monitor any webpage and get alerted the moment something changes. Track jobs, apartments, restocks, prices, and more. Checks every minute. Free to start.",
  keywords: [
    "website monitor",
    "page change alert",
    "website change notification",
    "price monitor",
    "job posting alert",
    "restock alert",
    "webpage tracker",
    "visualping alternative",
    "website change detector",
  ],
  authors: [{ name: "Cheetah Ping" }],
  creator: "Cheetah Ping",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Cheetah Ping",
    title: "Cheetah Ping - Website Change Monitor",
    description:
      "Monitor any webpage and get alerted the moment something changes. Checks every minute. AI-powered. Free to start.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheetah Ping - Website Change Monitor",
    description:
      "Monitor any webpage and get alerted the moment something changes. Checks every minute. Free to start.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cheetah Ping",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Website change monitoring service. Monitor any webpage and get alerted the moment something changes.",
  url: siteUrl,
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
    },
    {
      "@type": "Offer",
      name: "Starter",
      price: "9",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "19",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
    {
      "@type": "Offer",
      name: "Ultra",
      price: "49",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", billingDuration: "P1M" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
