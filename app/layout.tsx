import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AdSenseScript } from "@/components/ads/google-adsense";
import { PushNotificationBanner } from "@/components/ui/push-notification";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "EvolvoAI - Sun'iy Intellekt va Dasturlash Xizmatlari",
    template: "%s | EvolvoAI",
  },
  description: "Professional sun'iy intellekt, web development va mobil ilova yaratish xizmatlari. O'zbekiston va Markaziy Osiyoda eng yaxshi AI echimlari.",
  keywords: [
    "sun'iy intellekt",
    "AI",
    "web development",
    "mobile app",
    "dasturlash",
    "chatbot",
    "biznes avtomatlashtirish",
    "EvolvoAI",
    "O'zbekiston",
  ],
  authors: [{ name: "EvolvoAI Team" }],
  creator: "EvolvoAI",
  publisher: "EvolvoAI",
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "https://evolvoai.uz",
    title: "EvolvoAI - AI Bilan Biznesingizni Avtomatlashtiring",
    description: "Zamonaviy web saytlar, Telegram botlar va AI yechimlarini taqdim etamiz",
    siteName: "EvolvoAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "EvolvoAI - AI Bilan Biznesingizni Avtomatlashtiring",
    description: "Zamonaviy web saytlar, Telegram botlar va AI yechimlarini taqdim etamiz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EvolvoAI",
    url: "https://evolvoai.uz",
    logo: "https://evolvoai.uz/logo.png",
    description:
      "Zamonaviy web saytlar, Telegram botlar, AI chatbotlar va biznes avtomatlashtirish yechimlarini taqdim etamiz",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+998-90-123-45-67",
      contactType: "customer service",
      areaServed: "UZ",
      availableLanguage: ["uz", "ru", "en"],
    },
    sameAs: [
      "https://t.me/evolvoaichannel",
      "https://instagram.com/evolvoai",
    ],
  };

  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366F1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EvolvoAI" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <AdSenseScript />
        <PushNotificationBanner />
      </body>
    </html>
  );
}
