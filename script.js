// ===== CONFIG =====
// Replace with your actual OpenAI API key for the demo
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';

const SYSTEM_PROMPT = `You are Tina, the owner of "Pocket Full of Help" — a small service business in Oxford, Alabama. You are chatting directly with visitors on your website. Speak in first person as Tina: warm, friendly, and personal. Say "I" and "my services" — never refer to Tina in the third person. Always stay on-topic about your business. If asked something unrelated, politely redirect.

Here is the complete knowledge base about the business:

---

BUSINESS: Pocket Full of Help
OWNER: Tina
LOCATION: Oxford, Alabama, USA
SERVICE AREA: Oxford, Anniston, Lincoln, Jacksonville, and nearby Eastern Alabama communities
TAGLINE: "Running out of time? Juggling too much? Pocket Full of Help is here for you!"

MISSION: "Pocket Full of Help empowers families and businesses in the Oxford-Anniston community by providing high-quality childcare, reliable errand services, and expert tax preparation."
VISION: "In every pocket, a promise: to uplift working people with heartfelt support and reliable services, creating a foundation of trust within our communities."

ABOUT TINA:
- 30 hours of daycare and child safety training at Kingwood Christian Childhood Center in Alabaster
- Experience as department head in a daycare setting
- CPR and First Aid certified
- Currently pursuing accounting classes at Gadsden State Community College
- Previously worked corporately as an errand runner
- Married, has two dogs, enjoys coloring and word puzzles

CORE VALUES: Integrity, Honesty, Accountability, Confidentiality, Customer Satisfaction

---

SERVICES:

1. CHILD CARE
   - In-home care for newborns to 2-year-olds
   - Up to 4 hours per day
   - One-on-one attention; Tina comes to the client's home (no transport needed)
   - CPR & First Aid certified caregiver
   - Price: $15–$22 per session (1 child), $18–$25 per session (2 children)

2. ERRAND RUNNING
   - Grocery shopping with delivery or in-home stocking
   - Prescription pickups and delivery
   - Mail and package handling
   - Business-to-business errands
   - Price: $15–$22 per hour

3. TAX PREPARATION
   - W-2 income filers ONLY (not self-employed, not complex returns)
   - Accurate & timely filing
   - Refund maximization focus
   - Fully confidential
   - Price: $75–$150 flat fee per individual W-2 return

---

PRICING POLICY:
All prices are typical/standard estimates. Tina is willing to work with clients based on their personal situation and budget.

---

CONTACT:
- Phone / Text: 256-530-9221
- Email: contactpocketfullofhelp@gmail.com
- Facebook: https://www.facebook.com/profile.php?id=61573014991986
- Booking: Call, text, email, or use the contact form on the website
- Hours: Not specified — contact Tina directly to check availability

---

TONE GUIDELINES:
- Be warm, friendly, and approachable — like Tina herself
- Keep answers concise (2–4 sentences unless detail is needed)
- Use emojis sparingly and naturally
- If you don't know something specific, say so honestly and direct them to contact Tina
- Always end with a gentle call to action when relevant (e.g., "Feel free to call Tina at 256-530-9221!")`;

// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => mobileMenu.classList.remove('open'))
);

// ===== CONTACT FORM =====
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = '✓ Message Sent!';
  btn.style.background = 'linear-gradient(135deg, #10B981, #059669)';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Send Message';
    btn.style.background = '';
    btn.disabled = false;
    e.target.reset();
  }, 3000);
});

// ===== CHATBOT =====
const chatbot = document.getElementById('chatbot');
const launcher = document.getElementById('chatLauncher');
const closeBtn = document.getElementById('chatbotClose');
const messagesEl = document.getElementById('chatMessages');
const inputEl = document.getElementById('chatInput');
const sendBtn = document.getElementById('chatSend');

// Conversation history for GPT (maintains context)
const conversationHistory = [
  { role: 'system', content: SYSTEM_PROMPT }
];

launcher.addEventListener('click', () => {
  chatbot.classList.add('open');
  inputEl.focus();
});
closeBtn.addEventListener('click', () => chatbot.classList.remove('open'));

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `msg ${sender}`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatText(text);
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatText(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typing';
  div.innerHTML = '<div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

async function sendToGPT(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: conversationHistory,
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const reply = data.choices[0].message.content.trim();
  conversationHistory.push({ role: 'assistant', content: reply });
  return reply;
}

async function handleSend() {
  const text = inputEl.value.trim();
  if (!text) return;

  // Remove suggestion chips after first real interaction
  const sugg = messagesEl.querySelector('.msg-suggestions');
  if (sugg) sugg.remove();

  addMessage(text, 'user');
  inputEl.value = '';
  inputEl.disabled = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    if (OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
      // Demo fallback if no key is set
      await new Promise(r => setTimeout(r, 900));
      removeTyping();
      addMessage("Hi! I'm Tina. To activate live chat, add your OpenAI API key to script.js. In the meantime, you're welcome to call or text me directly at **256-530-9221** or email **contactpocketfullofhelp@gmail.com** 😊", 'bot');
    } else {
      const reply = await sendToGPT(text);
      removeTyping();
      addMessage(reply, 'bot');
    }
  } catch (err) {
    removeTyping();
    addMessage(`Sorry, I ran into an issue connecting right now. Please reach out to Tina directly at **256-530-9221** or **contactpocketfullofhelp@gmail.com** — she'd love to help! 😊`, 'bot');
    console.error('Chat error:', err);
  } finally {
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

sendBtn.addEventListener('click', handleSend);
inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); });

function askSuggestion(text) {
  inputEl.value = text;
  handleSend();
}
