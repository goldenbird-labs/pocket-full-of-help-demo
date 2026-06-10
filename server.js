require('dotenv').config()

const express = require('express')
const path = require('path')
const { getChatReply } = require('./lib/chat')
const { captureLead } = require('./lib/leads')

const app = express()

app.use(express.json())
app.use(express.static(__dirname))

app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'Chat is not configured yet — please contact Tina directly.' })
    }

    const { messages } = req.body
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request' })
    }

    const reply = await getChatReply(messages, captureLead)
    res.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

app.post('/api/lead', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body || {}
    if (!firstName || !email) {
      return res.status(400).json({ error: 'Name and email are required.' })
    }

    await captureLead({
      name: `${firstName} ${lastName || ''}`.trim(),
      email,
      phone,
      notes: message,
      source: 'contact_form'
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Lead error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Pocket Full of Help demo running on port ${PORT}`))
