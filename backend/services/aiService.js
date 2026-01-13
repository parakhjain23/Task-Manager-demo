const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze natural language input and extract task details
 */
async function analyzeTaskInput(input, teamMembers) {
  try {
    const teamMembersInfo = teamMembers.map(member =>
      `- ${member.name}: Skills: ${member.skills.join(', ')}, Availability: ${member.availability}, Workload: ${member.currentWorkload}`
    ).join('\n');

    const prompt = `You are an AI task manager assistant. Analyze the following task request and extract structured information.

Task Request: "${input}"

Available Team Members:
${teamMembersInfo}

Based on the task request, provide a JSON response with:
1. title: A concise task title (max 100 chars)
2. description: Detailed description of the task
3. priority: Determine priority (low, medium, high) based on urgency keywords or context
4. assignedTo: Name of the most suitable team member based on skills and availability (must match one of the available names exactly)
5. tags: Array of relevant tags/categories for this task (e.g., ["frontend", "bug-fix", "feature"])
6. dueDate: If mentioned, provide ISO date string, otherwise null

Respond ONLY with valid JSON, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a task management AI that extracts structured data from natural language. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error analyzing task input:', error);
    if (error.response) {
      throw new Error(`OpenAI API Error: ${error.response.data?.error?.message || error.message}`);
    }
    throw new Error(`Failed to analyze task input: ${error.message}`);
  }
}

/**
 * Detect if user wants to create a task and gather information conversationally
 */
async function detectTaskIntent(conversationHistory, teamMembers) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a conversational AI task manager. Your job is to:
1. Have natural conversations with users
2. Detect when they want to create a task (keywords: "create task", "add task", "new task", or describing work to be done)
3. Gather information conversationally (title, description, priority, etc.)
4. Only create tasks when you have enough information OR user confirms

Respond with JSON containing:
- "shouldCreateTask": boolean (true only if user clearly wants to create a task AND you have enough info)
- "response": string (your conversational response to the user)
- "taskData": object (if shouldCreateTask is true, include: title, description, priority, tags)
- "needsMoreInfo": boolean (true if you need clarification)

Priority and tags are OPTIONAL - if not specified by user, decide yourself based on context.

Examples:
- "Hello" -> shouldCreateTask: false, response: friendly greeting
- "Create a task to fix login bug" -> shouldCreateTask: true if you can infer details, OR ask for more info
- "Make it high priority" (in context) -> shouldCreateTask: true with updated priority`
      }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // If should create task, assign team member
    if (result.shouldCreateTask && result.taskData) {
      const teamMembersInfo = teamMembers.map(member =>
        `- ${member.name}: Skills: ${member.skills.join(', ')}, Availability: ${member.availability}, Workload: ${member.currentWorkload}`
      ).join('\n');

      const assignmentPrompt = `Given this task: ${JSON.stringify(result.taskData)}

Available team members:
${teamMembersInfo}

Return JSON with the best assignedTo (exact name match) based on skills and availability.`;

      const assignmentCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You assign tasks to team members based on skills. Respond with JSON only."
          },
          {
            role: "user",
            content: assignmentPrompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const assignment = JSON.parse(assignmentCompletion.choices[0].message.content);
      result.taskData.assignedTo = assignment.assignedTo;
    }

    return result;
  } catch (error) {
    console.error('Error detecting task intent:', error);
    throw new Error(`Failed to process conversation: ${error.message}`);
  }
}

/**
 * Generate AI response for chat
 */
async function generateChatResponse(message, context = '') {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful task management assistant. Help users create and manage tasks naturally."
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
  } catch (error) {
    console.error('Error generating chat response:', error);
    console.error('Error details:', error.response?.data || error.message);
    if (error.response) {
      throw new Error(`OpenAI API Error: ${error.response.data?.error?.message || error.message}`);
    }
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

/**
 * Analyze user's view request and extract filter criteria
 */
async function analyzeViewRequest(userQuery) {
  try {
    const currentDate = new Date().toISOString();

    const systemPrompt = `You are a filter analyzer for a task management system.
Current date: ${currentDate}

Analyze the user's request and extract filter criteria for viewing tasks.
Return JSON with:
{
  "filters": {
    "status": "pending|in-progress|completed" or null (if not specified),
    "priority": "low|medium|high" or null,
    "createdWithinDays": number or null (e.g., "created within 1 month" = 30),
    "dueWithinDays": number or null,
    "assignedTo": "username" or "me" or null,
    "tags": ["tag1", "tag2"] or null,
    "createdToday": boolean,
    "createdThisWeek": boolean,
    "dueThisWeek": boolean
  },
  "viewName": "descriptive name for the view (e.g., 'Pending tasks from last month')"
}

Time parsing rules:
- "today" -> createdToday: true
- "this week" -> createdThisWeek: true
- "within 1 month" or "last month" -> createdWithinDays: 30
- "within 2 weeks" -> createdWithinDays: 14
- "due this week" -> dueThisWeek: true
- "my tasks" or "mine" -> assignedTo: "me"

Examples:
- "my pending tasks created within 1 month" -> {status: "pending", assignedTo: "me", createdWithinDays: 30}
- "tasks created today" -> {createdToday: true}
- "high priority tasks due this week" -> {priority: "high", dueThisWeek: true}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analyze this view request: "${userQuery}"`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error analyzing view request:', error);
    throw new Error(`Failed to analyze view request: ${error.message}`);
  }
}

module.exports = {
  analyzeTaskInput,
  generateChatResponse,
  detectTaskIntent,
  analyzeViewRequest
};
