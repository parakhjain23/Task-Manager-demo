import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  try {
    console.log('Testing OpenAI connection...');
    console.log('Model: gpt-4o-mini');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Hello! If you can see this, the OpenAI connection is working. Please respond with a short confirmation."
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    console.log('\nResponse received successfully:');
    console.log('-------------------------------');
    console.log(completion.choices[0].message.content);
    console.log('-------------------------------');
    console.log('\n✓ OpenAI API test completed successfully!');

  } catch (error: any) {
    console.error('\n✗ Error testing OpenAI:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

testOpenAI();
