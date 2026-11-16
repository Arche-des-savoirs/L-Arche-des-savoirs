// Enregistrement du service worker : met l'app en cache pour le hors ligne.
import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';

export const offlineReady = signal(false);
export const swStatus = signal<'absent' | 'en cours' | 'actif'>('absent');

export function setupPWA(): void {
  if (!('serviceWorker' in navigator)) return;
  swStatus.value = 'en cours';
  registerSW({
    immediate: true,
    onOfflineReady() {
      offlineReady.value = true;
    },
    onRegisteredSW(_url, reg) {
      if (reg?.active) swStatus.value = 'actif';
      navigator.serviceWorker.ready.then(() => {
        swStatus.value = 'actif';
        offlineReady.value = true;
      });
    }
  });
}
