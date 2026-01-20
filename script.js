// ===========================
// CHATBOT HANDLING
// ===========================

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

// Webhook URL for n8n
const WEBHOOK_URL = 'https://n8n.srv1254694.hstgr.cloud/webhook/da09fd3a-d203-4304-8b29-e25f0709dd34';

// Handle chat message sending
if (chatSend && chatInput) {
  chatSend.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
}

async function sendChatMessage() {
  const message = chatInput.value.trim();
  
  if (!message) return;

  // Add user message to chat
  addMessageToChat(message, 'user');
  
  // Clear input
  chatInput.value = '';
  
  // Send to webhook
  try {
    const chatData = {
      userMessage: message,
      timestamp: new Date().toISOString(),
      type: 'chat'
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatData)
    });

    if (response.ok) {
      // Message sent successfully
      // Optionally add a bot response
      setTimeout(() => {
        addMessageToChat('Thank you for your message. I\'ll process your request and get back to you with insights about your automation needs.', 'bot');
      }, 500);
    }
  } catch (error) {
    console.error('Error sending chat message:', error);
    addMessageToChat('Sorry, there was an error processing your message. Please try again.', 'bot');
  }
}

function addMessageToChat(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const p = document.createElement('p');
  p.textContent = text;
  
  messageDiv.appendChild(p);
  chatMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===========================
// FORM HANDLING
// ===========================

const automationForm = document.getElementById('automationForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const automationTypeSelect = document.getElementById('automationType');

// Handle form submission
if (automationForm) {
  automationForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get form data
    const formData = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      automationType: document.getElementById('automationType').value,
      problemDescription: document.getElementById('problemDescription').value.trim(),
      budget: document.getElementById('budget').value.trim(),
      additionalNotes: document.getElementById('additionalNotes').value.trim(),
      submittedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.automationType || !formData.problemDescription) {
      showError('Please fill in all required fields.');
      return;
    }

    // Validate email format
    if (!isValidEmail(formData.email)) {
      showError('Please enter a valid email address.');
      return;
    }

    // Hide previous messages
    hideMessages();

    try {
      // Send data to webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Success
        showSuccess();
        automationForm.reset();
        automationTypeSelect.value = ''; // Reset dropdown
        
        // Scroll to success message
        setTimeout(() => {
          document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        showError('Failed to submit the form. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showError('An error occurred while submitting the form. Please try again.');
    }
  });
}

// ===========================
// SERVICE CARD BUTTONS
// ===========================

const serviceButtons = document.querySelectorAll('.scroll-to-form');
serviceButtons.forEach(button => {
  button.addEventListener('click', function() {
    const service = this.getAttribute('data-service');
    automationTypeSelect.value = service;
    
    // Scroll to form
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Focus on problem description field
    setTimeout(() => {
      document.getElementById('problemDescription').focus();
    }, 500);
  });
});

// ===========================
// UTILITY FUNCTIONS
// ===========================

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showSuccess() {
  if (successMessage) {
    successMessage.classList.add('show');
  }
}

function showError(message) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
  }
}

function hideMessages() {
  if (successMessage) {
    successMessage.classList.remove('show');
  }
  if (errorMessage) {
    errorMessage.classList.remove('show');
  }
}

// ===========================
// INITIALIZE ON PAGE LOAD
// ===========================

document.addEventListener('DOMContentLoaded', function() {
  // Any initialization code can go here
});
