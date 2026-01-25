// ===========================
// VISITOR ID & STORAGE SETUP
// ===========================

// Generate or retrieve unique visitor ID
function getVisitorId() {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    // Create new ID if first visit - GUARANTEED UNIQUE
    visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('visitorId', visitorId);
  }
  return visitorId;
}

// Get user name (optional - can be empty)
function getUserName() {
  let userName = localStorage.getItem('userName');
  if (!userName) {
    // Don't ask for name - let them provide it naturally in chat or form
    userName = null;
  }
  return userName;
}

// Save conversation to localStorage
function saveConversation(messages) {
  localStorage.setItem('chatHistory', JSON.stringify(messages));
}

// Get conversation from localStorage
function getConversationHistory() {
  const history = localStorage.getItem('chatHistory');
  return history ? JSON.parse(history) : [];
}

// ===========================
// CHATBOT HANDLING
// ===========================

// Webhook URL for n8n
const WEBHOOK_URL = 'https://n8n.srv1254694.hstgr.cloud/webhook-test/da09fd3a-d203-4304-8b29-e25f0709dd34';

// Get current user info
const VISITOR_ID = getVisitorId();
const USER_NAME = getUserName(); // Can be null

// Chat DOM elements (will be set in DOMContentLoaded)
let chatMessages;
let chatInput;
let chatSend;

async function sendChatMessage() {
  const message = chatInput.value.trim();
  
  if (!message) return;

  // Add user message to chat
  addMessageToChat(message, 'user');
  
  // Clear input
  chatInput.value = '';
  
  // Get current conversation history
  let conversationHistory = getConversationHistory();
  
  // Add this message to history
  conversationHistory.push({
    sender: 'user',
    message: message,
    timestamp: new Date().toISOString()
  });
  
  // Save updated history
  saveConversation(conversationHistory);
  
  // Send to webhook with full context
  try {
    const chatData = {
      visitorId: VISITOR_ID,
      userName: USER_NAME,
      userMessage: message,
      conversationHistory: conversationHistory,
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
      // Message sent successfully - try to get n8n response
      let aiResponse = null;
      
      try {
        const responseData = await response.json();
        aiResponse = responseData.message || responseData.aiMessage || responseData.reply;
      } catch (parseError) {
        console.log('Response received but could not parse JSON');
      }
      
      // Display the AI response if we got one
      if (aiResponse) {
        setTimeout(() => {
          addMessageToChat(aiResponse, 'bot');
          
          // Add bot message to history
          conversationHistory.push({
            sender: 'bot',
            message: aiResponse,
            timestamp: new Date().toISOString()
          });
          saveConversation(conversationHistory);
        }, 300);
      } else {
        console.log('Message sent to n8n successfully');
      }
    } else {
      addMessageToChat(`Error: Server returned ${response.status}`, 'bot');
    }
  } catch (error) {
    console.error('Error sending chat message:', error);
    addMessageToChat(`Sorry, there was an error: ${error.message}. Check that n8n webhook is running.`, 'bot');
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
        showError(`Failed to submit: Server returned ${response.status} ${response.statusText}. Check n8n webhook status.`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showError(`Error: ${error.message}. Is n8n webhook URL correct and running?`);
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
  // Get DOM elements after page loads and assign to global variables
  chatMessages = document.getElementById('chatMessages');
  chatInput = document.getElementById('chatInput');
  chatSend = document.getElementById('chatSend');

  console.log('Chat elements loaded:', {chatMessages, chatInput, chatSend});

  // Handle chat message sending
  if (chatSend && chatInput) {
    chatSend.addEventListener('click', function() {
      console.log('Send button clicked!');
      sendChatMessage();
    });
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
    console.log('Event listeners attached');
  } else {
    console.error('Chat elements not found!');
  }
});
