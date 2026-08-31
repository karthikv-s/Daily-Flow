const webpush = require('web-push');
const prisma = require('../lib/prisma');

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Send a push notification to all subscriptions of a user.
 */
async function sendPushToUser(userId, payload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
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
}

module.exports = { initWebPush, sendPushToUser };
