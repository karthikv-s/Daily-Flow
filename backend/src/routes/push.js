const router = require('express').Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// POST /api/push/subscribe
router.post('/subscribe', auth, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.userId },
      create: { userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', auth, async (req, res) => {
  const { endpoint } = req.body;
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.userId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
