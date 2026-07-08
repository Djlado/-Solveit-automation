import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-mini';
const GEMINI_SYSTEM_PROMPT = process.env.GEMINI_SYSTEM_PROMPT || `You are Mr Solveit Automation, an AI assistant for automation consulting, websites, software, CRM systems, and custom business solutions. Always answer as Mr Solveit and use the following pricing guidance when discussing cost.

General pricing policy:
- Every project is quoted individually after understanding the client's requirements.
- Projects generally range from $50 to $5,000+ USD depending on complexity, integrations, and development time.

Website pricing:
- Landing Page: $50-$200
- Business Website: $250-$800
- Premium Website: $800-$2,500

AI automation pricing:
- Basic Automation: $100-$300
- Business Automation: $300-$1,500
- Enterprise Automation: $1,500-$5,000+

CRM pricing:
- Simple CRM: $250-$600
- Business CRM: $600-$2,000
- Enterprise CRM: $2,000-$5,000+

Custom software pricing:
- Simple Web Application: $500-$1,500
- Business Platform: $1,500-$3,500
- Large SaaS Platform: $3,500-$5,000+

AI solutions pricing:
- AI Chatbot: $300-$1,200
- Knowledge Base AI: $500-$2,000
- Custom AI Platform: $2,000-$5,000+

API integration pricing:
- Simple API: $100-$300
- Multiple APIs: $300-$1,000
- Complex Integrations: $1,000-$3,000+

Airtable pricing:
- Basic Base: $100-$250
- Business Operations System: $250-$1,000
- Advanced Operations Platform: $1,000-$3,000+

Rules for price questions:
- If a client asks how much a project will cost, respond that every project is different and that the final price depends on scope, features, integrations, and timeline. As a general guide, projects typically range from $50 for simple tasks to $5,000+ for complex custom software and AI systems.
- If a client says they only have $100, respond that simpler projects such as landing pages, basic automations, website improvements, or consultations may fit within that range and ask what they want to achieve.
- If a client asks why prices differ, explain that pricing is based on the amount of work involved, including features, design, integrations, AI functionality, automation complexity, security requirements, and development time.
- Never promise a fixed price before understanding the client's requirements. Always ask follow-up questions about the project scope, goals, timeline, required features, target users, and any existing systems before giving an estimate. Use the pricing ranges only as budgeting guidance, not as final quotations.`;
const GEMINI_PRICE_RANGE = process.env.GEMINI_PRICE_RANGE || '$50 to $5,000+ USD depending on scope, integrations, and complexity';
const PORT = process.env.PORT || 3000;

function buildGeminiPrompt(userMessage, conversationHistory = []) {
  const historyText = Array.isArray(conversationHistory)
    ? conversationHistory
        .map((item) => {
          const role = item.sender === 'user' ? 'User' : 'Assistant';
          return `${role}: ${item.message}`;
        })
        .join('\n')
    : '';

  return [
    `System: ${GEMINI_SYSTEM_PROMPT}`,
    `Note: Use the pricing guidance from the system prompt and avoid giving a fixed price until the client's requirements are understood.`,
    historyText,
    `User: ${userMessage}`,
    'Assistant:'
  ]
    .filter(Boolean)
    .join('\n');
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mr-solveit-automation' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'services.html'));
});

app.post('/api/chat', async (req, res) => {
  const { userMessage, conversationHistory } = req.body;

  if (!userMessage) {
    return res.status(400).json({ message: 'Missing userMessage' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Missing GEMINI_API_KEY on server' });
  }

  try {
    const prompt = buildGeminiPrompt(userMessage, conversationHistory);

    const response = await fetch(
      `https://gemini.googleapis.com/v1/models/${GEMINI_MODEL}:generateText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          prompt: {
            text: prompt
          },
          maxOutputTokens: 500,
          temperature: 0.7,
          topP: 0.95
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return res.status(500).json({ message: 'AI service request failed' });
    }

    const data = await response.json();
    const aiMessage = data?.candidates?.[0]?.content || 'Sorry, I could not generate a response.';

    return res.json({ message: aiMessage });
  } catch (error) {
    console.error('Chat request failed:', error);
    return res.status(500).json({ message: 'Chat request failed' });
  }
});

app.post('/api/book', async (req, res) => {
  const {
    fullName,
    email,
    automationType,
    problemDescription,
    budget,
    additionalNotes
  } = req.body;

  if (!fullName || !email || !automationType || !problemDescription) {
    return res.status(400).json({ message: 'Missing required booking fields' });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MY_EMAIL) {
    return res
      .status(500)
      .json({ message: 'Missing SMTP configuration or destination email on server' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailBody = `New automation booking request:\n\nName: ${fullName}\nEmail: ${email}\nService: ${automationType}\nProblem description: ${problemDescription}\nBudget: ${budget || 'N/A'}\nAdditional notes: ${additionalNotes || 'N/A'}\nSubmitted at: ${new Date().toISOString()}\n`;

    await transporter.sendMail({
      from: `Website Contact <${process.env.SMTP_USER}>`,
      to: process.env.MY_EMAIL,
      replyTo: email,
      subject: 'New Automation Booking Request',
      text: mailBody
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Email send failed:', error);
    return res.status(500).json({ message: 'Failed to send booking email' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
