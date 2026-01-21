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
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(chatData),
      mode: 'cors' // Explicitly set CORS mode
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Add bot response
    setTimeout(() => {
      addMessageToChat('Thank you for your message. I\'ll process your request and get back to you with insights about your automation needs.', 'bot');
    }, 500);

  } catch (error) {
    console.error('Error sending chat message:', error);
    
    // More specific error messages
    let errorMsg = 'Sorry, there was an error sending your message. ';
    if (error.message.includes('Failed to fetch')) {
      errorMsg += 'Please check your internet connection or contact support. (CORS/Network error)';
    } else {
      errorMsg += error.message;
    }
    
    addMessageToChat(errorMsg, 'bot');
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
      submittedAt: new Date().toISOString(),
      type: 'form' // Add type to distinguish from chat
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
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
        mode: 'cors' // Explicitly set CORS mode
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Success
      showSuccess();
      automationForm.reset();
      automationTypeSelect.value = ''; // Reset dropdown
      
      // Scroll to success message
      setTimeout(() => {
        document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error('Error submitting form:', error);
      
      // More specific error messages
      let errorMsg = 'Failed to submit form. ';
      if (error.message.includes('Failed to fetch')) {
        errorMsg += 'Connection error - please check if n8n is running and CORS is enabled.';
      } else {
        errorMsg += error.message;
      }
      
      showError(errorMsg);
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
  // Test webhook connection on load (optional)
  console.log('Page loaded. Webhook URL:', WEBHOOK_URL);
});
