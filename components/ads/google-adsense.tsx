"use client";

import Script from "next/script";
import { useEffect } from "react";

// Google AdSense Publisher ID - set in .env
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

// AdSense Script Component (add to layout.tsx)
export function AdSenseScript() {
  if (!ADSENSE_ID) return null;
  
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

// Ad Unit Component
interface AdUnitProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  responsive?: boolean;
  className?: string;
}

export function AdUnit({ 
  slot, 
  format = "auto", 
  responsive = true,
  className = "" 
}: AdUnitProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  if (!ADSENSE_ID) {
    // Show placeholder in development
    return (
      <div className={`bg-gray-800/50 border border-dashed border-gray-600 rounded-lg p-4 text-center text-gray-500 ${className}`}>
        <p className="text-sm">📢 Reklama joyi</p>
        <p className="text-xs mt-1">AdSense ID sozlanmagan</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

// In-Article Ad (between paragraphs)
export function InArticleAd({ slot }: { slot: string }) {
  return (
    <div className="my-8">
      <AdUnit slot={slot} format="auto" className="min-h-[250px]" />
    </div>
  );
}

// Sidebar Ad
export function SidebarAd({ slot }: { slot: string }) {
  return (
    <div className="sticky top-24">
      <p className="text-xs text-gray-500 mb-2 text-center">Reklama</p>
      <AdUnit slot={slot} format="vertical" className="min-h-[600px]" />
    </div>
  );
}

// Footer Banner Ad
export function FooterBannerAd({ slot }: { slot: string }) {
  return (
    <div className="py-4 border-t border-gray-800">
      <AdUnit slot={slot} format="horizontal" className="max-w-4xl mx-auto" />
    </div>
  );
}
