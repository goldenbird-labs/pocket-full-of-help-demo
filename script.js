// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen);
  hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
});
mobileMenu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
  })
);

// ===== CONTACT FORM =====
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName.value,
        lastName: form.lastName.value,
        email: form.email.value,
        phone: form.phone.value,
        message: form.message.value
      })
    });

    if (!res.ok) throw new Error('Request failed');

    btn.textContent = '✓ Message Sent!';
    btn.style.background = 'linear-gradient(135deg, #10B981, #059669)';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  } catch (err) {
    console.error('Lead form error:', err);
    btn.textContent = 'Error — Please Call Tina';
    btn.style.background = '#DC2626';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  }
});

// ===== CHATBOT =====
const chatbot = document.getElementById('chatbot');
const launcher = document.getElementById('chatLauncher');
const closeBtn = document.getElementById('chatbotClose');
const messagesEl = document.getElementById('chatMessages');
const inputEl = document.getElementById('chatInput');
const sendBtn = document.getElementById('chatSend');

// Conversation history for GPT (maintains context)
const conversationHistory = [];

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

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: conversationHistory })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error ${response.status}`);
  }

  const data = await response.json();
  conversationHistory.push({ role: 'assistant', content: data.reply });
  return data.reply;
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
    const reply = await sendToGPT(text);
    removeTyping();
    addMessage(reply, 'bot');
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
