require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Resend with API Key from .env
const resend = new Resend(process.env.RESEND_API_KEY);
const destinationEmail = process.env.DESTINATION_EMAIL || 'vijaygpre2@gmail.com';

// Middleware
app.use(cors());
app.use(express.json());

/**
 * POST /submit-support
 * Handles Feedback and Issue Reports from Nigah App
 */
app.post('/submit-support', async (req, res) => {
  try {
    const {
      type,
      name,
      email,
      category,
      message,
      deviceInfo,
      appVersion,
      submittedAt
    } = req.body;

    // 1. Validation
    if (!type || !['feedback', 'issue'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing 'type'. Must be 'feedback' or 'issue'."
      });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "'message' is required."
      });
    }

    // 2. Prepare Email Content
    const subject = type === 'feedback'
      ? "Nigah App - New Feedback"
      : "Nigah App - New Issue Report";

    const emailHtml = `
      <h2>${subject}</h2>
      <p><strong>Type:</strong> ${type.toUpperCase()}</p>
      <p><strong>Name:</strong> ${name || 'N/A'}</p>
      <p><strong>Email:</strong> ${email || 'N/A'}</p>
      <p><strong>Category:</strong> ${category || 'General'}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="background: #f9f9f9; padding: 15px; border-left: 5px solid #ccc;">
        ${message.replace(/\n/g, '<br>')}
      </blockquote>
      <hr />
      <p><strong>Device Info:</strong> ${deviceInfo || 'Unknown'}</p>
      <p><strong>App Version:</strong> ${appVersion || 'Unknown'}</p>
      <p><strong>Submitted At:</strong> ${submittedAt || new Date().toLocaleString()}</p>
    `;

    // 3. Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Nigah Support <onboarding@resend.dev>', // Replace with your verified domain in production
      to: [destinationEmail],
      subject: subject,
      html: emailHtml,
      reply_to: email || undefined
    });

    if (error) {
      console.error('Resend Error:', error);
      return res.status(500).json({
        success: false,
        message: "Submission failed",
        error: error.message
      });
    }

    // 4. Success Response
    return res.status(200).json({
      success: true,
      message: "Submitted successfully"
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred"
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Nigah Backend API is running.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
