const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên là bắt buộc'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Ngày là bắt buộc'],
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: props => `${props.value} không phải là định dạng ngày hợp lệ (YYYY-MM-DD)!`
    }
  },
  shift: {
    type: String,
    required: [true, 'Ca làm việc là bắt buộc'],
    enum: {
      values: ['ca sáng', 'ca chiều'],
      message: '{VALUE} không phải là ca làm việc hợp lệ'
    }
  }
}, {
  timestamps: true,
  collection: 'schedules'
});

module.exports = mongoose.model('Schedule', ScheduleSchema); 