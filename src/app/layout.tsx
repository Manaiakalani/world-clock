import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author, url: siteConfig.repository }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  category: "productivity",
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.shortDescription,
    url: "/",
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.shortDescription,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  formatDetection: { telephone: false },
};

// Structured data. Described as free and self-hostable because it is: there is
// no account, no paid tier and no server-side state to sign up for.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any modern web browser",
  browserRequirements: "Requires JavaScript and WebGL",
  inLanguage: "en",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Organization", name: siteConfig.author, url: siteConfig.repository },
  license: "https://opensource.org/licenses/MIT",
  featureList: [
    "Interactive 3D globe with draggable rotation",
    "Analog and digital clocks for every tracked region",
    "Live local weather for each region",
    "Meeting planner that highlights overlapping working hours",
    "Day and night sky colours that follow each region's local time",
    "Works offline as an installable progressive web app",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Warm up TLS to Open-Meteo so the first weather request after first paint is fast. */}
        <link rel="preconnect" href="https://api.open-meteo.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://api.open-meteo.com" />
        <script
          type="application/ld+json"
          // Structured data has to be inlined as raw JSON; React would escape it otherwise.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="h-full overflow-hidden font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
                     focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm
                     focus:font-medium focus:shadow-lg focus:border focus:border-border"
        >
          Skip to content
        </a>
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
