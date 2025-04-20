// Add polyfills for web APIs
const {
  ReadableStream,
  WritableStream,
  TransformStream,
} = require("web-streams-polyfill");
const fetch = require("node-fetch");
const fs = require("fs");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

// Add to global scope
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;
global.fetch = fetch;

require("dotenv").config();
const { ChatDeepSeek } = require("@langchain/deepseek");

const llm = new ChatDeepSeek({
  model: "deepseek-chat",
  apiKey: "sk-b1c0b13354df493bace24060eea54854",
});

// Validate output từ AI
function validateAIOutput(data) {
  const { action, name, date, shift } = data;

  if (!action || !["register", "cancel"].includes(action)) {
    throw new Error(
      'Action không hợp lệ. Chỉ chấp nhận "register" hoặc "cancel"'
    );
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Tên không được để trống");
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Ngày phải có định dạng YYYY-MM-DD");
  }

  if (!shift || !["ca sáng", "ca chiều"].includes(shift)) {
    throw new Error('Ca làm việc phải là "ca sáng" hoặc "ca chiều"');
  }

  return { action, name: name.trim(), date, shift };
}

async function extractIntentAndData(message) {
  try {
    console.log("Input message:", message);
    const prompt = fs.readFileSync("prompt.md", "utf-8");
    // console.log("Prompt:", prompt);

    const result = await llm.invoke([
      { role: "system", content: prompt },
      { role: "user", content: message },
    ]);

    console.log("message", message);
    console.log("AI response:", result.content);

    let parsed;
    try {
      parsed = JSON.parse(result.content);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      console.error("Raw AI response:", result.content);
      throw new Error(
        "AI trả về kết quả không phải JSON hợp lệ. Vui lòng thử lại."
      );
    }

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    return validateAIOutput(parsed);
  } catch (err) {
    console.error("Error in extractIntentAndData:", err);
    if (err.message.includes("JSON")) {
      throw new Error(
        "Không thể hiểu được yêu cầu. Vui lòng thử lại với câu lệnh rõ ràng hơn."
      );
    }
    throw err;
  }
}

module.exports = { extractIntentAndData };
