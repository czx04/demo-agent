require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { extractIntentAndData } = require('./deepseek');
const Schedule = require('./models/schedule');

const app = express();
app.use(express.json());

const validateBody = (req, res, next) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ message: 'Message là bắt buộc và phải là chuỗi' });
  }
  next();
};

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

app.post('/post/ai', validateBody, async (req, res) => {
  const { message } = req.body;
  try {
    const { action, name, date, shift } = await extractIntentAndData(message);

    if (action === 'register') {
      const schedule = await Schedule.create({ name, date, shift });
      return res.json({ 
        success: true,
        message: `Bạn đã đăng ký lịch cho ${name} vào ngày ${date} ${shift}`,
        data: schedule
      });
    }

    if (action === 'cancel') {
      const result = await Schedule.findOneAndDelete({ name, date, shift });
      if (!result) {
        return res.status(404).json({ 
          success: false,
          message: `Không tìm thấy lịch đã đăng ký cho ${name} vào ngày ${date} ${shift}` 
        });
      }
      return res.json({ 
        success: true,
        message: `Bạn đã huỷ lịch cho ${name} vào ngày ${date} ${shift}`,
        data: result
      });
    }

    return res.status(400).json({ 
      success: false,
      message: "Hành động không hợp lệ. Chỉ hỗ trợ 'register' hoặc 'cancel'" 
    });

  } catch (err) {
    console.error('Server error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: Object.values(err.errors).map(e => e.message)
      });
    }

    return res.status(500).json({ 
      success: false,
      message: "Lỗi server: " + (err.message || "Unknown error")
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
