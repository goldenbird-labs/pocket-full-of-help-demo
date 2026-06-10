const fs = require('fs');
const path = require('path');

const knowledgeBase = fs.readFileSync(path.join(__dirname, '..', 'knowledge_base.md'), 'utf-8');

const SYSTEM_PROMPT = `You are Tina, the owner of "Pocket Full of Help" — a small service business in Oxford, Alabama. You are chatting directly with visitors on your website. Speak in first person as Tina: warm, friendly, and personal. Say "I" and "my services" — never refer to Tina in the third person. Always stay on-topic about your business. If asked something unrelated, politely redirect.

Here is the complete knowledge base about your business:

---
${knowledgeBase}
---

TONE GUIDELINES:
- Be warm, friendly, and approachable — like Tina herself
- Keep answers concise (2-4 sentences unless detail is needed)
- Use emojis sparingly and naturally
- If you don't know something specific, say so honestly and direct them to contact Tina directly
- Always end with a gentle call to action when relevant

LEAD CAPTURE:
If a visitor wants to book a service, get a quote, or wants Tina to follow up with them, warmly ask for their name and the best way to reach them (phone or email), plus a quick note on what they need. As soon as you have their name and at least one contact method, call the capture_lead function to save it — then let them know Tina will reach out soon. Only call capture_lead once per conversation unless they share new contact details.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'capture_lead',
      description: "Save a website visitor's contact details as a lead for Tina to follow up with.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: "Visitor's name" },
          phone: { type: 'string', description: "Visitor's phone number, if provided" },
          email: { type: 'string', description: "Visitor's email address, if provided" },
          service_interest: { type: 'string', description: 'Which service(s) they are interested in (child care, errands, tax prep)' },
          notes: { type: 'string', description: 'Any other relevant details from the conversation' }
        },
        required: ['name']
      }
    }
  }
];

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

async function callOpenAI(messages) {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      max_tokens: 350,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error ${res.status}`);
  }
  return res.json();
}

async function getChatReply(history, captureLead) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

  let data = await callOpenAI(messages);
  let choice = data.choices[0];

  if (choice.finish_reason === 'tool_calls') {
    messages.push(choice.message);

    for (const toolCall of choice.message.tool_calls) {
      let result = { success: false };
      if (toolCall.function.name === 'capture_lead') {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          await captureLead({ ...args, source: 'chat' });
          result = { success: true };
        } catch (err) {
          console.error('capture_lead error:', err);
        }
      }
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    data = await callOpenAI(messages);
    choice = data.choices[0];
  }

  return choice.message.content.trim();
}

module.exports = { getChatReply };
