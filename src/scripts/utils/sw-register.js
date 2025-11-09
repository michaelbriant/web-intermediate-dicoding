import { Workbox } from 'workbox-window';

const swRegister = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported in the browser');
    return;
  }

  const wb = new Workbox('./sw.bundle.js');

  try {
    await wb.register();
    console.log('Service worker registered successfully');
  } catch (error) {
    console.error('Failed to register service worker', error);
  }
};

const registerBackgroundSync = async () => {
  if (!('SyncManager' in window)) {
    console.log('Background Sync not supported');
    return;
  }
  
  const registration = await navigator.serviceWorker.ready;
  try {
    await registration.sync.register('sync-new-stories');
    console.log('Background sync registered');
  } catch (error) {
    console.error('Failed to register background sync', error);
  }
};

export { swRegister, registerBackgroundSync };