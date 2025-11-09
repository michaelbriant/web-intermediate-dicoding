import router from './routes/routes.js';
import { swRegister } from './utils/sw-register.js';
import NotificationHelper from './utils/notification-helper.js';
import StoryApi from './data/api.js';

class App {
  constructor() {
    this._initialAppShell();
    this._initialRouter();
    this._initSkipLink();
  }

  _initialAppShell() {
    const drawerButton = document.getElementById('drawer-button');
    const navigationDrawer = document.getElementById('navigation-drawer');
    const mainContent = document.getElementById('main-content');
    const logoutButton = document.getElementById('logout-button');

    drawerButton.addEventListener('click', (event) => {
      navigationDrawer.classList.toggle('open');
      event.stopPropagation();
    });

    mainContent.addEventListener('click', () => {
      navigationDrawer.classList.remove('open');
    });

    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('authToken');
      alert('Anda telah logout.');
      window.location.hash = '#/login';
      navigationDrawer.classList.remove('open');
    });
    
    this._initNotificationToggle();
  }

  _initialRouter() {
    window.addEventListener('load', () => {
      router();
      swRegister();
    });
    window.addEventListener('hashchange', () => {
      router();
    });
  }

  _initSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.getElementById('main-content');

    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    });
  }

  async _initNotificationToggle() {
    const notifToggle = document.getElementById('notif-toggle');
    if (!notifToggle) return;
  
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    notifToggle.checked = !!subscription;
  
    notifToggle.addEventListener('change', async (event) => {
      const checked = event.target.checked;
      try {
        if (checked) {
          const newSubscription = await NotificationHelper.subscribePushNotification();
          if (newSubscription) {
            
            const subscriptionJson = newSubscription.toJSON();
            const subscriptionData = {
              endpoint: subscriptionJson.endpoint,
              keys: subscriptionJson.keys,
            };

            await StoryApi.subscribeNotification(subscriptionData);
            alert('Notifikasi diaktifkan!');
          } else {
            event.target.checked = false;
          }
        } else {
          const oldSubscription = await registration.pushManager.getSubscription();
          if (oldSubscription) {
            await StoryApi.unsubscribeNotification(oldSubscription.endpoint);
            await NotificationHelper.unsubscribePushNotification();
            alert('Notifikasi dinonaktifkan!');
          }
        }
      } catch (error) {
        alert('Gagal mengubah status notifikasi. Coba login ulang.');
        event.target.checked = !checked;
      }
    });
  }
}

export default App;