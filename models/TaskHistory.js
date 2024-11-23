// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db'); // Використовуємо підключення з db.js

// const TaskHistory = sequelize.define('TaskHistory', {
//   taskId: {
//     type: DataTypes.INTEGER,
//     allowNull: false
//   },
//   status: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   result: {
//     type: DataTypes.STRING,
//     allowNull: true
//   }
// });

// module.exports = TaskHistory;


const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaskHistory = sequelize.define('TaskHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  result: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = TaskHistory;
