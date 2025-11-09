import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import StoryDb from './utils/indexeddb-helper.js';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.origin.endsWith('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.href.startsWith('https://story-api.dicoding.dev/v1/stories'),
  new NetworkFirst({
    cacheName: 'story-api-data',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => request.destination === 'image' && url.href.startsWith('https://story-api.dicoding.dev/images/'),
  new CacheFirst({
    cacheName: 'story-api-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'worker' ||
                   request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  }),
);

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.options.body,
    icon: './images/icons/icon-192x192.png',
    badge: './images/icons/icon-192x192.png',
    actions: [
      { action: 'open_app', title: 'Buka Aplikasi' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open_app') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

const BASE_URL = 'https://story-api.dicoding.dev/v1';

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-stories') {
    event.waitUntil(syncNewStories());
  }
});

const syncNewStories = async () => {
  const stories = await StoryDb.getAllStoriesFromOutbox();
  for (const story of stories) {
    try {
      const formData = new FormData();
      formData.append('photo', story.photo);
      formData.append('description', story.description);
      formData.append('lat', story.lat);
      formData.append('lon', story.lon);
      
      const response = await fetch(`${BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${story.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Gagal sinkronisasi');
      }

      await StoryDb.deleteStoryFromOutbox(story.id);
      
      await caches.delete('story-api-data');
      console.log('Cache story-api-data dihapus, sinkronisasi berhasil.');

    } catch (error) {
      console.error('Gagal sinkronisasi cerita:', story.id, error);
    }
  }
};