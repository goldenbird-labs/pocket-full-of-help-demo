async function sendPushoverNotification({ title, message }) {
  const { PUSHOVER_APP_TOKEN, PUSHOVER_USER_KEY } = process.env;

  if (!PUSHOVER_APP_TOKEN || !PUSHOVER_USER_KEY) {
    console.warn('Pushover not configured — skipping notification');
    return;
  }

  const res = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token: PUSHOVER_APP_TOKEN,
      user: PUSHOVER_USER_KEY,
      title,
      message
    })
  });

  if (!res.ok) {
    console.error('Pushover error:', await res.text());
  }
}

module.exports = { sendPushoverNotification };
