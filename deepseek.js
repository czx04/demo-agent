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
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function extractIntentAndData(message) {
  try {
    console.log("🟢 Input message:", message);
    const prompt = fs.readFileSync("prompt.md", "utf-8");

    const result = await llm.invoke([
      { role: "system", content: prompt },
      { role: "user", content: message },
    ]);

    console.log("🟢 Raw AI response:\n", result.content);

    // Clean AI response before parsing
    let cleaned = result.content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/```json|```/g, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("❌ JSON parse error:", parseErr);
      console.error("❌ Nội dung không hợp lệ:\n", cleaned);
      throw new Error(
        "AI trả về kết quả không phải JSON hợp lệ. Vui lòng thử lại."
      );
    }

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    return parsed;
  } catch (err) {
    console.error("🔥 Error in extractIntentAndData:", err.message);
    if (err.message.includes("JSON")) {
      throw new Error(
        "Không thể hiểu được yêu cầu. Vui lòng thử lại với câu lệnh rõ ràng hơn."
      );
    }
    throw err;
  }
}

module.exports = { extractIntentAndData };
