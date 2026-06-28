'use client';

import { useEffect } from 'react';
import { seedDatabase } from '@/lib/db';
import { syncWithCloud } from '@/lib/syncManager';

export default function ClientInitializer() {
  useEffect(() => {
    // 0. Request persistent storage permission
    if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        if (persistent) {
          console.log('PWA Storage persists: OS will not purge IndexedDB / OPFS data under storage pressure.');
        } else {
          console.warn('PWA Storage is temporary: OS might purge local data under severe pressure.');
        }
      });
    }

    // 1. Seed database with default data, then sync
    seedDatabase()
      .then(() => {
        syncWithCloud().catch((error) => {
          console.error('Initial sync failed:', error);
        });
      })
      .catch((error) => {
        console.error('Failed to seed database:', error);
      });

    // 2. Register online event listener
    const handleOnline = () => {
      syncWithCloud().catch((error) => {
        console.error('Online sync failed:', error);
      });
    };
    window.addEventListener('online', handleOnline);

    // 3. Register Service Worker for PWA and handle automatic updates
    let focusListener: (() => void) | undefined;
    let updateInterval: any;

    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            
            // Check for updates every 30 minutes
            updateInterval = setInterval(() => {
              registration.update();
            }, 30 * 60 * 1000);

            // Also check for updates when window gains focus
            focusListener = () => {
              registration.update();
            };
            window.addEventListener('focus', focusListener);

            // If an updated worker is already waiting, activate it
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Handle found updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New content available, activating new service worker...');
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                };
              }
            };
          },
          (err) => {
            console.warn('ServiceWorker registration failed: ', err);
          }
        );
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }

      // Force reload when a new service worker takes control
      let refreshing = false;
      const handleControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      if (focusListener) window.removeEventListener('focus', focusListener);
      if (updateInterval) clearInterval(updateInterval);
    };
  }, []);

  return null;
}
