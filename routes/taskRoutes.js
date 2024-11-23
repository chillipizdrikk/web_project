const express = require('express');
const { createTask, getTaskById, handleFactorialTask, getTaskHistory, cancelTask } = require('../controllers/taskController'); // Додано handleFactorialTask
const router = express.Router();

// Маршрут для створення нової задачі
router.post('/', createTask);

// Маршрут для отримання задачі за ID
router.get('/:id', getTaskById);

// Маршрут для обчислення факторіалу
router.post('/factorial', handleFactorialTask);

router.post('/cancel', cancelTask);

// Маршрут для історії задач
router.get('/history', async (req, res) => {
    try {
        const tasks = await Task.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task history' });
    }
});

module.exports = router;