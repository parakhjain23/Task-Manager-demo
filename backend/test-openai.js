require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  console.log('Testing OpenAI connection...');
  console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: "Say hello"
        }
      ],
      max_tokens: 20
    });

    console.log('✓ Success! OpenAI is working.');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('✗ Error connecting to OpenAI:');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Type:', error.type);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();
