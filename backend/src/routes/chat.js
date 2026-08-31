const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// Lazy-initialize Gemini
function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your-gemini-api-key') return null;
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
}

// Lazy-initialize Anthropic client
function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === 'your-anthropic-api-key') return null;
  return new Anthropic({ apiKey: key });
}

// ── NLP Intent & Task Extraction Engine (Zero-Credit Fallback & Booster) ──
function parseNaturalTasks(message) {
  const lower = message.toLowerCase();
  const tasksFound = [];
  const now = new Date();

  // Split by common delimiters like comma, "and", "then", semicolons, newlines
  const parts = message
    .split(/[,;\n]|\band\b|\bthen\b/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 3 && !['yes', 'no', 'sure', 'ok', 'please', 'today', 'tomorrow'].includes(p.toLowerCase()));

  for (const part of parts) {
    const pLower = part.toLowerCase();

    // Determine category
    let category = 'Personal';
    if (/leetcode|code|study|read|homework|exam|learn|math|course/i.test(pLower)) category = 'Study';
    else if (/gym|workout|exercise|run|walk|jog|yoga|fitness|health/i.test(pLower)) category = 'Health';
    else if (/meeting|standup|project|work|client|email|deploy|review/i.test(pLower)) category = 'Work';
    else if (/shop|buy|grocery|market|store/i.test(pLower)) category = 'Shopping';

    // Determine priority
    let priority = 'medium';
    if (/urgent|asap|important|must|exam|interview|deadline/i.test(pLower)) priority = 'high';
    else if (/movie|chill|relax|game|play|snack|series/i.test(pLower)) priority = 'low';

    // Extract time
    let dueAt = new Date();
    const timeMatch = pLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|night|morning|evening)?/i);

    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const mod = (timeMatch[3] || '').toLowerCase();

      if ((mod === 'pm' || mod === 'night' || mod === 'evening') && hour < 12) {
        hour += 12;
      } else if (mod === 'morning' && hour === 12) {
        hour = 0;
      } else if (!mod && hour >= 1 && hour <= 7 && (pLower.includes('night') || pLower.includes('evening'))) {
        hour += 12; // e.g. "at 8 night" -> 20:00
      }

      dueAt.setHours(hour, minute, 0, 0);
      if (dueAt < now) dueAt.setHours(dueAt.getHours() + 12);
    } else {
      // Default time slot spacing
      dueAt.setHours(now.getHours() + tasksFound.length + 1, 0, 0, 0);
    }

    // Clean title
    let cleanTitle = part
      .replace(/^(i would like to|i want to|i need to|i have to|let me|please|going to|go to)\s+/i, '')
      .replace(/\s+at\s+\d{1,2}(?::\d{2})?\s*(am|pm|night|morning|evening)?/i, '')
      .replace(/\s+(today|tomorrow|tonight)/gi, '')
      .trim();

    if (cleanTitle) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
      tasksFound.push({
        title: cleanTitle,
        dueAt: dueAt.toISOString(),
        priority,
        category,
      });
    }
  }

  return tasksFound;
}

// Generates an interactive planning response
function generateSmartReply(message, existingTasks, user) {
  const extracted = parseNaturalTasks(message);
  const lower = message.toLowerCase().trim();

  // If user listed activities, return structured plan with actionable task cards
  if (extracted.length > 0) {
    const taskSummary = extracted
      .map((t, i) => `${i + 1}. 📌 **${t.title}** — Due *${new Date(t.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}* (${t.category} • ${t.priority.toUpperCase()})`)
      .join('\n');

    return {
      reply: `Awesome plan! 🚀 I've organized your activities into an optimized schedule:\n\n${taskSummary}\n\nClick **"Add All to Schedule"** below to automatically add them to your planner!`,
      suggestedTasks: extracted,
    };
  }

  if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
    return {
      reply: `Hello ${user?.email ? user.email.split('@')[0] : 'there'}! 👋 I'm your AI Daily Planner.\n\nYou can tell me what you want to achieve today (e.g. *"Solve 2 LeetCode problems, gym at 8pm, watch a movie"*) and I'll build your schedule automatically!`,
      suggestedTasks: [],
    };
  }

  if (lower.includes('plan') || lower.includes('schedule')) {
    if (existingTasks.length === 0) {
      return {
        reply: `Your schedule is open! 🌟 Tell me 2 or 3 things you'd like to do today, and I'll schedule them with optimal focus blocks.`,
        suggestedTasks: [],
      };
    }
    const taskListStr = existingTasks.slice(0, 5).map((t, idx) => `${idx + 1}. **${t.title}** (${t.priority.toUpperCase()} priority${t.category ? ` • ${t.category}` : ''})`).join('\n');
    return {
      reply: `Here is your current priority plan for today:\n\n${taskListStr}\n\n💡 Would you like to add more tasks or adjust the timing?`,
      suggestedTasks: [],
    };
  }

  return {
    reply: `Got it! Tell me any tasks, routines, or goals for today (e.g. *"read for 30 mins at 7pm, finish report"*), and I'll structure and schedule them for you in 1 click! 🎯`,
    suggestedTasks: [],
  };
}

// POST /api/chat
router.post('/', auth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    // Current tasks for context
    const existingTasks = await prisma.task.findMany({
      where: { userId: req.userId, status: 'pending' },
      orderBy: { dueAt: 'asc' },
    });

    const taskContext = existingTasks.length
      ? existingTasks.map((t) => `- ${t.title} (due: ${new Date(t.dueAt).toLocaleString()}, priority: ${t.priority}, category: ${t.category || 'none'})`).join('\n')
      : 'No pending tasks currently.';

    // Save user message
    await prisma.chatMessage.create({ data: { userId: req.userId, role: 'user', content: message } });

    let reply = '';
    let suggestedTasks = [];

    // 1. Try Google Gemini if configured
    const gemini = getGemini();
    if (gemini) {
      try {
        const prompt = `You are a smart, proactive daily planning AI assistant for DailyFlow AI.
User's existing tasks:
${taskContext}

User message: "${message}"

If the user mentions activities they want to do (e.g., "gym at 8pm, solve 2 leetcode questions, watch a movie"), formulate an encouraging, concise plan under 150 words.
Also extract any new tasks as a JSON block at the very end formatted as:
\`\`\`json
[{"title": "...", "dueAt": "ISO string", "priority": "low|medium|high", "category": "Work|Personal|Study|Health"}]
\`\`\``;

        const result = await gemini.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON block if present
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            suggestedTasks = JSON.parse(jsonMatch[1]);
          } catch (e) {}
          reply = text.replace(/```json[\s\S]*?```/, '').trim();
        } else {
          reply = text.trim();
        }
      } catch (geminiErr) {
        console.warn('[Gemini API Notice]:', geminiErr.message);
      }
    }

    // 2. Try Anthropic Claude if Gemini didn't provide reply
    if (!reply) {
      const anthropic = getAnthropic();
      if (anthropic) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-3-5-haiku-latest',
            max_tokens: 500,
            system: `You are DailyFlow AI, an intelligent daily planning assistant. The user has ${existingTasks.length} pending tasks: ${taskContext}. Plan their day proactively.`,
            messages: [{ role: 'user', content: message }],
          });
          reply = response.content[0].text;
          suggestedTasks = parseNaturalTasks(message);
        } catch (apiErr) {
          console.warn('[Anthropic Notice]:', apiErr.message);
        }
      }
    }

    // 3. Resilient Built-in NLP Planner Engine Fallback
    if (!reply) {
      const smartResult = generateSmartReply(message, existingTasks, user);
      reply = smartResult.reply;
      suggestedTasks = smartResult.suggestedTasks;
    }

    // Save assistant reply
    await prisma.chatMessage.create({ data: { userId: req.userId, role: 'assistant', content: reply } });

    res.json({ reply, suggestedTasks });
  } catch (err) {
    console.error('[Chat Error]:', err);
    res.status(500).json({ error: 'AI assistant error. Please try again.' });
  }
});

// POST /api/chat/batch-create-tasks (Batch schedule proposed AI tasks)
router.post('/batch-create', auth, async (req, res) => {
  const { tasks: taskList } = req.body;
  if (!Array.isArray(taskList) || taskList.length === 0) {
    return res.status(400).json({ error: 'tasks array is required' });
  }

  try {
    const createdTasks = await prisma.$transaction(
      taskList.map((t) =>
        prisma.task.create({
          data: {
            userId: req.userId,
            title: t.title,
            description: t.description || 'Scheduled via AI Assistant',
            dueAt: new Date(t.dueAt),
            priority: t.priority || 'medium',
            category: t.category || 'Personal',
          },
        })
      )
    );

    res.status(201).json({ success: true, count: createdTasks.length, tasks: createdTasks });
  } catch (err) {
    console.error('[Batch Create Error]:', err);
    res.status(500).json({ error: 'Failed to batch create tasks' });
  }
});

// GET /api/chat/history
router.get('/history', auth, async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
