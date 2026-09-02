const cron = require('node-cron');
const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../lib/prisma');
const { sendPushToUser } = require('./notifications');
const { calculateStreak, resetWeeklyPoints } = require('./points');

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === 'your-anthropic-api-key') return null;
  return new Anthropic({ apiKey: key });
}

function startScheduler() {
  // ── Every minute: check for tasks due in next 15 minutes ──────
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const in15 = new Date(now.getTime() + 15 * 60 * 1000);

      const tasks = await prisma.task.findMany({
        where: {
          status: 'pending',
          notified15: false,
          dueAt: { gte: now, lte: in15 },
        },
        include: { user: true },
      });

      for (const task of tasks) {
        await sendPushToUser(task.userId, {
          title: '⏰ Task Due Soon',
          body: `"${task.title}" is due in less than 15 minutes!`,
          tag: `due-soon-${task.id}`,
        });
        await prisma.task.update({ where: { id: task.id }, data: { notified15: true } });
      }

      // ── Check for overdue tasks (past due, still pending) ──────
      const overdue = await prisma.task.findMany({
        where: {
          status: 'pending',
          notifiedDue: false,
          dueAt: { lt: now },
        },
        include: { user: true },
      });

      for (const task of overdue) {
        await sendPushToUser(task.userId, {
          title: '🚨 Task Overdue',
          body: `"${task.title}" is now overdue!`,
          tag: `overdue-${task.id}`,
        });
        await prisma.task.update({ where: { id: task.id }, data: { notifiedDue: true } });
      }
    } catch (err) {
      console.error('[Scheduler] Error checking due tasks:', err.message);
    }
  });

  // ── Every day at 8:00 AM: AI daily planning suggestion ────────
  cron.schedule('0 8 * * *', async () => {
    try {
      const users = await prisma.user.findMany({
        include: {
          tasks: { where: { status: 'pending' } },
          pushSubs: true,
        },
      });

      for (const user of users) {
        if (user.tasks.length === 0) continue;

        const taskList = user.tasks
          .map((t) => `- ${t.title} (due: ${new Date(t.dueAt).toLocaleString()}, priority: ${t.priority})`)
          .join('\n');

        try {
          const anthropic = getAnthropic();
          if (!anthropic) {
            console.log('[Scheduler] Skipping AI plan — ANTHROPIC_API_KEY not set');
            continue;
          }
          const msg = await anthropic.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 500,
            messages: [
              {
                role: 'user',
                content: `You are a helpful daily planning assistant. Here are my tasks for today and upcoming:\n${taskList}\n\nGive me a brief, friendly morning planning suggestion: what to tackle first, any overloaded areas, and any tasks I should split up. Keep it under 150 words.`,
              },
            ],
          });

          const suggestion = msg.content[0].text;

          // Save to chat history
          await prisma.chatMessage.create({
            data: { userId: user.id, role: 'assistant', content: `🌅 Good morning! Here's your daily plan:\n\n${suggestion}` },
          });

          // Push notification
          if (user.pushSubs.length > 0) {
            await sendPushToUser(user.id, {
              title: '🌅 Your Daily AI Plan is Ready',
              body: suggestion.substring(0, 100) + '...',
              tag: 'daily-plan',
            });
          }
        } catch (aiErr) {
          console.error(`[Scheduler] AI error for user ${user.id}:`, aiErr.message);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error in daily plan job:', err.message);
    }
  });

  // ── Every night at 11:59 PM: streak calculation ───────────────
  cron.schedule('59 23 * * *', async () => {
    try {
      const users = await prisma.user.findMany({ select: { id: true } });
      for (const user of users) {
        await calculateStreak(prisma, user.id);
      }
      console.log('[Scheduler] Streak calculation complete');
    } catch (err) {
      console.error('[Scheduler] Error in streak job:', err.message);
    }
  });

  // ── Every day at midnight 00:01: remove completed tasks from prev days ──
  cron.schedule('1 0 * * *', async () => {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Delete all tasks that are 'done' AND whose dueAt was before today
      const result = await prisma.task.deleteMany({
        where: {
          status: 'done',
          dueAt: { lt: startOfToday },
        },
      });

      console.log(`[Scheduler] Midnight cleanup: removed ${result.count} completed task(s) from previous days.`);
    } catch (err) {
      console.error('[Scheduler] Error in midnight cleanup job:', err.message);
    }
  });

  // ── Every Monday at midnight 00:00: reset all users' points to zero ──
  cron.schedule('0 0 * * 1', async () => {
    try {
      const result = await resetWeeklyPoints(prisma);
      console.log(`[Scheduler] Weekly points reset: reset points to 0 for ${result.count} user(s).`);
    } catch (err) {
      console.error('[Scheduler] Error in weekly points reset job:', err.message);
    }
  });

  console.log('[Scheduler] All cron jobs started');

}

module.exports = { startScheduler };
