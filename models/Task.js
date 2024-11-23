const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Task = sequelize.define('Task', {
  number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  result: {
    type: DataTypes.STRING, // Заміна типу на STRING
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  }
});

module.exports = Task;
