const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationHelper = {
  async subscribePushNotification() {
    if (!('PushManager' in window)) {
      alert('Push notification not supported');
      return null;
    }
    
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('User is already subscribed.');
      return subscription;
    }

    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      
      console.log('User subscribed successfully.');
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notification', error);
      return null;
    }
  },

  async unsubscribePushNotification() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('User is not subscribed.');
      return true;
    }

    try {
      await subscription.unsubscribe();
      console.log('User unsubscribed successfully.');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe', error);
      return false;
    }
  },
};

export default NotificationHelper;