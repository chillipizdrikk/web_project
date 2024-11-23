require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/db');
const path = require('path');
const http = require('http');
const { Worker } = require('worker_threads');
const socketIo = require('socket.io');
const Task = require('./models/Task');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:8080', // Allow connections only from this origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

// Connect to the database
connectDB().catch((error) => {
  console.error('Database connection failed:', error);
  process.exit(1);
});

// Add middleware for JSON handling and CORS
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Maximum number of concurrent tasks
const MAX_CONCURRENT_TASKS = 5;
let currentTasks = 0;

// Map to store Workers by task number
const workerMap = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('startTask', async (taskData) => {
    const { number } = taskData;
    console.log(`Task for number ${number} started`);

    if (currentTasks >= MAX_CONCURRENT_TASKS) {
      socket.emit('taskFailed', {
        number,
        error: 'Maximum number of concurrent tasks reached.',
      });
      return;
    }

    if (number > 500) {
      socket.emit('taskFailed', {
        number,
        error: 'The task is too computationally intensive.',
      });
      return;
    }

    try {
      currentTasks++;
      const task = await Task.create({ number });
      const worker = new Worker(path.join(__dirname, 'workers', 'factorialWorker.js'), {
        workerData: { number },
      });

      workerMap.set(number, worker);

      worker.on('message', async (message) => {
        if (message.progress !== undefined) {
          io.emit('progressUpdate', { number, progress: message.progress });
        } else {
          try {
            task.result = message.result;
            task.status = 'completed';
            await task.save();
            currentTasks--;
            workerMap.delete(number);
            io.emit('taskComplete', { number, result: message.result });
          } catch (error) {
            console.error(`Error updating task: ${error.message}`);
            task.status = 'failed';
            await task.save();
            currentTasks--;
            workerMap.delete(number);
            io.emit('taskFailed', { number, error: error.message });
          }
        }
      });

      worker.on('error', async (error) => {
        console.error(`Worker error: ${error}`);
        task.status = 'failed';
        await task.save();
        currentTasks--;
        workerMap.delete(number);
        io.emit('taskFailed', { number, error: error.message });
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker stopped with exit code ${code}`);
        }
      });

      socket.on('cancelTask', async (cancelData) => {
        const cancelWorker = workerMap.get(cancelData.number);
        if (cancelWorker) {
          cancelWorker.terminate();
          task.status = 'cancelled';
          await task.save();
          currentTasks--;
          workerMap.delete(cancelData.number);
          io.emit('taskCancelled', { number: cancelData.number });
        }
      });
    } catch (error) {
      console.error(`Error creating task: ${error}`);
      socket.emit('taskFailed', { number, error: error.message });
      currentTasks--;
      workerMap.delete(number);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('error', (error) => {
    console.error(`Socket error: ${error.message}`);
  });
});

const PORT = process.argv[2] || process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  sequelize
    .sync({ force: false })
    .then(() => {
      console.log('Database synchronized!');
    })
    .catch((error) => {
      console.error('Database synchronization failed:', error);
    });
});
