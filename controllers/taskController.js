const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');
const { v4: uuidv4 } = require('uuid');


const calculateFactorial = (num) => {
  if (num < 0) throw new Error("Number must be non-negative");
  return num === 0 ? 1 : num * calculateFactorial(num - 1);
};


// Створення нової задачі
exports.createTask = async (req, res) => {
  try {
    const { number } = req.body;
    const task = await Task.create({ number });
    const taskId = uuidv4(); // Унікальний ідентифікатор задачі
    res.status(201).json({ taskId, task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Отримання задачі за ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};


// Отримання історії задач
exports.getTaskHistory = async (req, res) => {
  try {
    const history = await TaskHistory.findAll();
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task history' });
  }
};

exports.handleFactorialTask = async (req, res) => {
  const { number } = req.body;
  const taskId = uuidv4();
  const io = req.app.get('socketio');

  try {
    console.log('Task started with number:', number); // Логування для перевірки

    let progress = 0;
    while (progress < 100) {
      progress += 10;
      io.emit('progressUpdate', { taskId, progress });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Симуляція прогресу
    }

    const result = calculateFactorial(number);
    await TaskHistory.create({
      taskId: taskId.toString(),
      status: 'completed',
      result: result.toString()
    });

    io.emit('taskComplete', { taskId, result });
    res.status(200).json({ taskId, result, server: process.env.PORT });
  } catch (error) {
    console.error('Error:', error.message); // Додано логування помилок
    await TaskHistory.create({
      taskId: taskId.toString(),
      status: 'failed',
      result: error.message
    });

    res.status(400).json({ error: error.message });
  }
};

exports.cancelTask = async (req, res) => {
  const { taskId } = req.body;
  const io = req.app.get('socketio');

  try {
    io.emit('taskCancelled', taskId);
    res.status(200).json({ message: `Task ${taskId} was cancelled` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel task' });
  }
};





// Обробка обчислення факторіалу із збереженням історії задач

// exports.handleFactorialTask = async (req, res) => {
//   const { number } = req.body;
//   const taskId = uuidv4();
//   const io = req.app.get('socketio');

//   try {
//     console.log('Task started with number:', number); // Логування для перевірки
//     let progress = 0;
//     while (progress < 100) {
//       progress += 10;
//       io.emit('progressUpdate', { taskId, progress });
//       await new Promise(resolve => setTimeout(resolve, 1000)); // Симуляція прогресу
//     }

//     const result = calculateFactorial(number);
//     await TaskHistory.create({
//       taskId: taskId,
//       status: 'completed',
//       result: result.toString()
//     });

//     io.emit('taskComplete', { taskId, result });
//     res.status(200).json({ taskId, result, server: process.env.PORT });
//   } catch (error) {
//     await TaskHistory.create({
//       taskId: taskId,
//       status: 'failed',
//       result: error.message
//     });

//     res.status(400).json({ error: error.message });
//   }
// };