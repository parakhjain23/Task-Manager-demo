import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate AI response for chat
 */
export async function generateChatResponse(message: string, context: string = ''): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful task management assistant. Help users create and manage work items naturally."
        },
        {
          role: "user",
          content: context ? `Context: ${context}\n\nUser: ${message}` : message
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('Error generating chat response:', error);
    console.error('Error details:', error.response?.data || error.message);
    if (error.response) {
      throw new Error(`OpenAI API Error: ${error.response.data?.error?.message || error.message}`);
    }
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}
