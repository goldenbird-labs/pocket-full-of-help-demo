const { appendLeadToSheet } = require('./sheets');
const { sendPushoverNotification } = require('./pushover');

async function captureLead(lead) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const enriched = { ...lead, timestamp };

  const sourceLabel = lead.source === 'chat' ? 'Chatbot' : 'Contact Form';
  const lines = [
    `Name: ${lead.name || '-'}`,
    `Phone: ${lead.phone || '-'}`,
    `Email: ${lead.email || '-'}`,
    lead.service_interest ? `Interested in: ${lead.service_interest}` : null,
    lead.notes ? `Notes: ${lead.notes}` : null
  ].filter(Boolean);

  await Promise.allSettled([
    appendLeadToSheet(enriched),
    sendPushoverNotification({
      title: `New Lead via ${sourceLabel}`,
      message: lines.join('\n')
    })
  ]);
}

module.exports = { captureLead };
