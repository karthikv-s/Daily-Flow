// Points & Badge logic
const POINTS_ON_TIME = 10;

const BADGE_DEFINITIONS = [
  {
    id: 'first_task',
    label: '🌟 First Task',
    check: ({ completedCount }) => completedCount === 1,
  },
  {
    id: 'on_fire',
    label: '🔥 On Fire',
    check: ({ consecutiveOnTime }) => consecutiveOnTime >= 5,
  },
  {
    id: 'century',
    label: '🏆 Century',
    check: ({ pointsTotal }) => pointsTotal >= 100,
  },
  {
    id: 'speed_demon',
    label: '⚡ Speed Demon',
    check: ({ earlyMinutes }) => earlyMinutes >= 60,
  },
  {
    id: 'week_warrior',
    label: '📅 Week Warrior',
    check: ({ streakDays }) => streakDays >= 7,
  },
];

/**
 * Award points for completing a task and check for new badges.
 * Returns { pointsAwarded, newBadges }
 */
async function awardPoints(prisma, userId, task) {
  const now = new Date();
  const dueAt = new Date(task.dueAt);
  const isOnTime = now <= dueAt;
  const pointsAwarded = isOnTime ? POINTS_ON_TIME : 0;

  // Calculate how many minutes early (negative if late)
  const earlyMinutes = (dueAt - now) / 60000;

  // Get current user state
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const newPointsTotal = user.pointsTotal + pointsAwarded;

  // Count completed tasks for badge checks
  const completedCount = await prisma.task.count({
    where: { userId, status: 'done' },
  });

  // Count consecutive on-time completions (last N tasks marked done with pointsAwarded > 0)
  const recentDone = await prisma.task.findMany({
    where: { userId, status: 'done' },
    orderBy: { completedAt: 'desc' },
    take: 10,
    select: { pointsAwarded: true },
  });
  let consecutiveOnTime = 0;
  for (const t of recentDone) {
    if (t.pointsAwarded > 0) consecutiveOnTime++;
    else break;
  }

  // Determine new badges
  const context = {
    completedCount: completedCount + 1, // include current
    consecutiveOnTime: isOnTime ? consecutiveOnTime + 1 : 0,
    pointsTotal: newPointsTotal,
    earlyMinutes: Math.max(0, earlyMinutes),
    streakDays: user.streakDays,
  };

  const existingBadges = new Set(user.badges);
  const newBadges = [];
  for (const badge of BADGE_DEFINITIONS) {
    if (!existingBadges.has(badge.id) && badge.check(context)) {
      existingBadges.add(badge.id);
      newBadges.push(badge);
    }
  }

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      pointsTotal: newPointsTotal,
      badges: [...existingBadges],
    },
  });

  return { pointsAwarded, newBadges };
}

/**
 * Nightly streak calculation for a single user.
 * Increments streak if all tasks for today were completed on time.
 * Resets streak if any tasks are still pending or late.
 */
async function calculateStreak(prisma, userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const todaysTasks = await prisma.task.findMany({
    where: { userId, dueAt: { gte: startOfDay, lte: endOfDay } },
  });

  if (todaysTasks.length === 0) return; // No tasks today, streak unchanged

  const allOnTime = todaysTasks.every(
    (t) => t.status === 'done' && t.pointsAwarded > 0
  );

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const newStreak = allOnTime ? user.streakDays + 1 : 0;

  // Check week warrior badge
  const newBadges = [...user.badges];
  if (newStreak >= 7 && !newBadges.includes('week_warrior')) {
    newBadges.push('week_warrior');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streakDays: newStreak, lastActiveDate: today, badges: newBadges },
  });
}

module.exports = { awardPoints, calculateStreak, BADGE_DEFINITIONS };
