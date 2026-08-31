const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { awardPoints } = require('../services/points');

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const where = { userId: req.userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueAt: 'asc' }, { priority: 'desc' }],
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks
router.post(
  '/',
  auth,
  [
    body('title').notEmpty().trim(),
    body('dueAt').isISO8601().custom((value) => {
      const due = new Date(value);
      if (due.getTime() < Date.now() - 60000) {
        throw new Error('Due date and time cannot be in the past');
      }
      return true;
    }),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, dueAt, priority, category } = req.body;
    try {
      const task = await prisma.task.create({
        data: {
          userId: req.userId,
          title,
          description,
          dueAt: new Date(dueAt),
          priority: priority || 'medium',
          category,
        },
      });
      res.status(201).json(task);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PATCH /api/tasks/:id
router.patch('/:id', auth, async (req, res) => {
  const taskId = parseInt(req.params.id);
  try {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    let updateData = { ...req.body };
    let pointsAwarded = existing.pointsAwarded;
    let newBadges = [];

    // Handle task completion
    if (req.body.status === 'done' && existing.status !== 'done') {
      updateData.completedAt = new Date();
      const result = await awardPoints(prisma, req.userId, existing);
      pointsAwarded = result.pointsAwarded;
      newBadges = result.newBadges;
      updateData.pointsAwarded = pointsAwarded;
    }

    // Prevent changing dueAt / re-awarding points on already-done tasks
    if (existing.status === 'done') {
      delete updateData.status;
    }

    const task = await prisma.task.update({ where: { id: taskId }, data: updateData });
    res.json({ task, pointsAwarded, newBadges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  const taskId = parseInt(req.params.id);
  try {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await prisma.task.delete({ where: { id: taskId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
