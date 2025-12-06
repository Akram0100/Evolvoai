"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// VAPID Public Key - generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

interface PushNotificationProps {
  className?: string;
}

export function PushNotificationButton({ className }: PushNotificationProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error("Notification permission denied");
      }

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Save subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      setSubscription(sub);
    } catch (error) {
      console.error("Error subscribing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();
        
        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        setSubscription(null);
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <Button
      onClick={subscription ? unsubscribe : subscribe}
      disabled={isLoading}
      variant={subscription ? "outline" : "gradient"}
      size="sm"
      className={className}
    >
      {isLoading ? (
        "..."
      ) : subscription ? (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Bildirishnomalar yoqilgan
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Bildirishnomalar
        </>
      )}
    </Button>
  );
}

// Floating notification banner
export function PushNotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      
      // Check if already subscribed
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          // Show banner after 10 seconds
          setTimeout(() => setIsVisible(true), 10000);
        }
      });
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setIsVisible(false);
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      setIsVisible(false);
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  if (!isSupported || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-4 shadow-2xl z-50 animate-slide-up">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-white/70 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold mb-1">🔔 Bildirishnomalar</h3>
          <p className="text-white/80 text-sm mb-3">
            Yangi maqolalar chiqganda xabar oling!
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={handleSubscribe}
              size="sm" 
              className="bg-white text-primary-600 hover:bg-white/90"
            >
              Ruxsat berish
            </Button>
            <Button 
              onClick={() => setIsVisible(false)}
              size="sm" 
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              Keyinroq
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
