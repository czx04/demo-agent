// Add polyfills for web APIs
const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill');
const fetch = require('node-fetch');

// Add to global scope
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;
global.fetch = fetch;

require('dotenv').config();
const { ChatDeepSeek } = require('@langchain/deepseek');

const llm = new ChatDeepSeek({
  model: 'deepseek-reasoner',
  temperature: 0,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Validate output từ AI
function validateAIOutput(data) {
  const { action, name, date, shift } = data;

  if (!action || !['register', 'cancel'].includes(action)) {
    throw new Error('Action không hợp lệ. Chỉ chấp nhận "register" hoặc "cancel"');
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Tên không được để trống');
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Ngày phải có định dạng YYYY-MM-DD');
  }

  if (!shift || !['ca sáng', 'ca chiều'].includes(shift)) {
    throw new Error('Ca làm việc phải là "ca sáng" hoặc "ca chiều"');
  }

  return { action, name: name.trim(), date, shift };
}

async function extractIntentAndData(message) {
  try {
    console.log('Input message:', message);

    const aiMsg = await llm.invoke([
      ["system", `Bạn là một AI xử lý lệnh đăng ký và huỷ lịch làm việc.

Nhiệm vụ của bạn là phân tích tin nhắn của người dùng và trả về một JSON object với các trường sau:
{
  "action": "register" hoặc "cancel",
  "name": "tên người",
  "date": "ngày theo định dạng YYYY-MM-DD",
  "shift": "ca sáng" hoặc "ca chiều"
}

Quy tắc xử lý:
1. Nếu là đăng ký lịch: action = "register"
2. Nếu là huỷ lịch: action = "cancel"
3. Chuyển đổi ngày từ DD/MM/YYYY sang YYYY-MM-DD
4. Chỉ chấp nhận "ca sáng" hoặc "ca chiều"

Ví dụ:
Input: "đăng ký lịch cho Nam làm ca sáng ngày 15/3/2024"
Output: {
  "action": "register",
  "name": "Nam",
  "date": "2024-03-15",
  "shift": "ca sáng"
}

Input: "huỷ lịch của Hoa ca chiều 20/03/2024"
Output: {
  "action": "cancel",
  "name": "Hoa", 
  "date": "2024-03-20",
  "shift": "ca chiều"
}

Lưu ý quan trọng:
- LUÔN trả về một JSON object hợp lệ
- Nếu không thể hiểu được tin nhắn, trả về: { "error": "Không thể hiểu được yêu cầu" }
- KHÔNG trả về text, chỉ trả về JSON`],
      ["human", message]
    ]);

    console.log('AI response:', aiMsg.content);

    let parsed;
    try {
      parsed = JSON.parse(aiMsg.content);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      console.error('Raw AI response:', aiMsg.content);
      throw new Error('AI trả về kết quả không phải JSON hợp lệ. Vui lòng thử lại.');
    }

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    return validateAIOutput(parsed);
  } catch (err) {
    console.error('Error in extractIntentAndData:', err);
    if (err.message.includes('JSON')) {
      throw new Error('Không thể hiểu được yêu cầu. Vui lòng thử lại với câu lệnh rõ ràng hơn.');
    }
    throw err;
  }
}

module.exports = { extractIntentAndData };
