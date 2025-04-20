require("dotenv").config();
const express = require("express");
const { extractIntentAndData } = require("./deepseek");
const Schedule = require("./models/schedule");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

const validateBody = (req, res, next) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res
      .status(400)
      .json({ message: "Message là bắt buộc và phải là chuỗi" });
  }
  next();
};

const client = new MongoClient(process.env.MONGO_URI);
client.connect((err) => {
  if (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  } else {
    console.log("MongoDB connected successfully");
  }
});
const db = client.db("te");
const collection = db.collection("te");

app.post("/post/ai", validateBody, async (req, res) => {
  const { message } = req.body;
  try {
    console.log("message", message);
    const { action ,data} = await extractIntentAndData(message);
    const { name, date, shift } = data;
    console.log( `sv is  ` + action, data);
    
    if (action === 'add') {
      const schedule = await collection.insertOne({ name, date, shift });
      return res.json({
        success: true,
        message: `Bạn đã đăng ký lịch cho ${name} vào ngày ${date} ${shift}`,
        data: schedule
      });
    }

    if (action === 'delete') {
      const { action ,data} = await extractIntentAndData(message);
      const { name, date, shift } = data;
      console.log( `sv is  ` + action, data);
      const result = await collection.findOneAndDelete({ name, date, shift });
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
      message: "Hành động không hợp lệ. Chỉ hỗ trợ 'add' hoặc 'delete'"
    });
    return res.status(200).json({
      success: true,
      message: "Đăng ký thành công",
    });
  } catch (err) {
    console.error("Server error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi server: " + (err.message || "Unknown error"),
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
