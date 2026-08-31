import { useState, useEffect } from 'react';
import { subscribePush, unsubscribePush } from '../api';
import { useToast } from '../contexts/ToastContext';
import styles from './PushToggle.module.css';

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushToggle() {
  const { addToast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
      return;
    }
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setEnabled(!!sub);
      });
    });
  }, []);

  async function toggle() {
    if (!supported) {
      addToast({ title: 'Push not supported', message: 'Try Chrome or Edge', type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (enabled) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub.endpoint);
          await sub.unsubscribe();
        }
        setEnabled(false);
        addToast({ title: 'Push notifications disabled', type: 'info' });
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          addToast({ title: 'Permission denied', message: 'Allow notifications in your browser settings', type: 'warning' });
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        });
        const subJson = sub.toJSON();
        await subscribePush({
          endpoint: subJson.endpoint,
          keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
        });
        setEnabled(true);
        addToast({ title: '🔔 Notifications enabled!', message: "We'll alert you before tasks are due", type: 'success' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Could not toggle notifications', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      id="push-toggle-btn"
      className={styles.toggle + ' btn btn-ghost' + (enabled ? ' ' + styles.active : '')}
      onClick={toggle}
      disabled={loading}
    >
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (enabled ? '🔔' : '🔕')}
      {enabled ? 'Notifications On' : 'Enable Notifications'}
    </button>
  );
}
