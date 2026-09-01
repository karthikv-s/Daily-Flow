const webpush = require('web-push');
const prisma = require('../lib/prisma');

function initWebPush() {
  const subject = process.env.VAPID_EMAIL || 'mailto:karthikvs765@gmail.com';
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BNzVGa28PEhMk6ckH_iq9Ge3Q8hSaQyYTWsNxWO4vK1H7V5rSnX0ghEF8KfZBCRrLIOHc3QM2tr5LDCRZjzwdz4';
  const privateKey = process.env.VAPID_PRIVATE_KEY || 'hyvTDVdjG85prCWYO8tHYKOnQHvPMgzagsIElq-m82s';

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    console.log('[WebPush] Initialized successfully');
  } catch (err) {
    console.warn('[WebPush Notice]: Could not set VAPID details:', err.message);
  }
}

/**
 * Send a push notification to all subscriptions of a user.
 */
async function sendPushToUser(userId, payload) {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (!subs || subs.length === 0) return;

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      )
    );
    // Remove stale subscriptions (410 Gone)
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'rejected' && r.reason?.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: subs[i].id } }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[WebPush Send Error]:', err.message);
  }
}

module.exports = { initWebPush, sendPushToUser };
