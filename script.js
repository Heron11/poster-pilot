document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const newChatBtn = document.getElementById('newChatBtn');
    const conversationsContainer = document.querySelector('.conversations-container');
    
    let currentConversationId = 1;
    let conversations = {
        1: []
    };

    // OpenAI API configuration
    const OPENAI_API_KEY = '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';
    const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

    // Keywords that indicate image generation requests
    const IMAGE_KEYWORDS = [
        'generate image', 'create image', 'draw', 'picture of', 'image of', 
        'show me', 'make an image', 'illustrate', 'visualize', 'paint',
        'sketch', 'design', 'render', 'depict', 'portray'
    ];

    // Auto-resize textarea
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    // Update send button state
    function updateSendButton() {
        const hasContent = messageInput.value.trim().length > 0;
        sendButton.disabled = !hasContent;
    }

    // Function to create message avatar
    function createMessageAvatar(isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (isUser) {
            avatar.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            `;
        } else {
            avatar.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            `;
        }
        
        return avatar;
    }

    // Function to detect if message is requesting image generation
    function isImageRequest(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check for image generation keywords (more flexible)
        const imageKeywords = [
            'generate image',
            'create image', 
            'draw',
            'picture of',
            'image of',
            'show me',
            'make image',
            'illustrate',
            'visualize',
            'paint',
            'sketch',
            'design',
            'render'
        ];
        
        // Check if any keyword appears in the message
        const hasImageKeyword = imageKeywords.some(keyword => lowerMessage.includes(keyword));
        
        // Additional check for specific patterns
        const specificPatterns = [
            /generate\s+image/i,
            /create\s+image/i,
            /draw\s+/i,
            /picture\s+of/i,
            /image\s+of/i
        ];
        
        const hasSpecificPattern = specificPatterns.some(pattern => pattern.test(message));
        
        return hasImageKeyword || hasSpecificPattern;
    }

    // Function to extract image prompt from user message
    function extractImagePrompt(message) {
        let prompt = message;
        
        // Remove image generation prefixes using regex patterns
        const patterns = [
            /generate\s+(an\s+)?image\s+(of\s+)?/i,
            /create\s+(an\s+)?image\s+(of\s+)?/i,
            /draw\s+(a\s+|an\s+)?/i,
            /picture\s+of\s+/i,
            /image\s+of\s+/i,
            /show\s+me\s+(a\s+|an\s+)?/i,
            /make\s+(an\s+)?image\s+(of\s+)?/i,
            /illustrate\s+/i,
            /visualize\s+/i,
            /paint\s+(a\s+|an\s+)?/i,
            /sketch\s+(a\s+|an\s+)?/i,
            /design\s+(a\s+|an\s+)?/i,
            /render\s+(a\s+|an\s+)?/i,
            /depict\s+/i,
            /portray\s+/i
        ];
        
        for (const pattern of patterns) {
            prompt = prompt.replace(pattern, '');
        }
        
        return prompt.trim();
    }

    // Function to generate image using GPT Image 1
    async function generateImage(prompt) {
        try {
            console.log('Generating image with prompt:', prompt);
            
            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-image-1',
                    prompt: prompt,
                    size: '1024x1024',
                    n: 1
                })
            });

            console.log('API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('API response data:', data);
            console.log('Response structure:', JSON.stringify(data, null, 2));
            
            // Try different possible response structures
            let imageData = null;
            
            // GPT Image 1 format: data[0].b64_json (base64 encoded image)
            if (data.data && data.data[0] && data.data[0].b64_json) {
                imageData = data.data[0].b64_json;
                console.log('Found base64 image data in GPT Image 1 format');
                // Convert base64 to data URL
                return `data:image/png;base64,${imageData}`;
            }
            // Standard DALL-E format: data.data[0].url
            else if (data.data && data.data[0] && data.data[0].url) {
                imageData = data.data[0].url;
                console.log('Found image URL in standard format:', imageData);
                return imageData;
            }
            // Alternative format: data.images[0].url
            else if (data.images && data.images[0] && data.images[0].url) {
                imageData = data.images[0].url;
                console.log('Found image URL in images format:', imageData);
                return imageData;
            }
            // Direct format: data.url
            else if (data.url) {
                imageData = data.url;
                console.log('Found image URL in direct format:', imageData);
                return imageData;
            }
            // Array format: data[0].url
            else if (Array.isArray(data) && data[0] && data[0].url) {
                imageData = data[0].url;
                console.log('Found image URL in array format:', imageData);
                return imageData;
            }
            else {
                console.error('Could not find image data in any expected format. Full response:', data);
                throw new Error(`Unexpected API response structure. Available keys: ${Object.keys(data).join(', ')}`);
            }
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }

    // Function to add a message to the chat
    function addMessage(content, isUser = false, imageUrl = null) {
        const messageGroup = document.createElement('div');
        messageGroup.className = 'message-group';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
        
        const avatar = createMessageAvatar(isUser);
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (imageUrl) {
            console.log('Adding image to message:', imageUrl);
            // Add image to message
            const imageElement = document.createElement('img');
            imageElement.src = imageUrl;
            imageElement.alt = 'Generated image';
            imageElement.className = 'generated-image';
            imageElement.loading = 'lazy';
            
            // Add error handling for image loading
            imageElement.onerror = function() {
                console.error('Failed to load image:', imageUrl);
                this.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.textContent = 'Failed to load image';
                errorDiv.style.color = '#ff6b6b';
                messageContent.appendChild(errorDiv);
            };
            
            imageElement.onload = function() {
                console.log('Image loaded successfully:', imageUrl);
            };
            
            messageContent.appendChild(imageElement);
            
            if (content) {
                const textContent = document.createElement('div');
                textContent.textContent = content;
                messageContent.appendChild(textContent);
            }
        } else {
            console.log('No image URL provided, showing text only:', content);
            messageContent.textContent = content;
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageGroup.appendChild(messageDiv);
        chatMessages.appendChild(messageGroup);
        
        // Store message in current conversation
        conversations[currentConversationId].push({
            content: content,
            isUser: isUser,
            imageUrl: imageUrl,
            timestamp: new Date()
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to send a message
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '' || sendButton.disabled) return;

        // Add user message
        addMessage(message, true);
        messageInput.value = '';
        autoResize(messageInput);
        updateSendButton();

        // Check if this is an image generation request
        console.log('User message:', message);
        console.log('Is image request:', isImageRequest(message));
        
        if (isImageRequest(message)) {
            const imagePrompt = extractImagePrompt(message);
            console.log('Extracted prompt:', imagePrompt);
            
            // Show image generation indicator
            const imageIndicator = document.createElement('div');
            imageIndicator.className = 'message-group';
            imageIndicator.innerHTML = `
                <div class="message assistant-message">
                    ${createMessageAvatar(false).outerHTML}
                    <div class="message-content">
                        <div class="image-generation-indicator">
                            <div class="spinner"></div>
                            <span>Generating image...</span>
                        </div>
                    </div>
                </div>
            `;
            chatMessages.appendChild(imageIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                // Generate image
                const imageUrl = await generateImage(imagePrompt);
                
                // Remove indicator and add image
                chatMessages.removeChild(imageIndicator);
                addMessage(`Here's your generated image:`, false, imageUrl);
                
            } catch (error) {
                // Remove indicator and show error
                chatMessages.removeChild(imageIndicator);
                addMessage(`Sorry, I couldn't generate the image. Error: ${error.message}`, false);
            }
        } else {
            // Regular text conversation
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'message-group';
            typingIndicator.innerHTML = `
                <div class="message assistant-message">
                    ${createMessageAvatar(false).outerHTML}
                    <div class="message-content">
                        <div class="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            `;
            chatMessages.appendChild(typingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Simulate assistant response
            setTimeout(() => {
                // Remove typing indicator
                chatMessages.removeChild(typingIndicator);
                
                const responses = [
                    "I understand what you're saying. Let me help you with that.",
                    "That's an interesting question. Here's what I think...",
                    "I see. Could you provide more details about that?",
                    "Thanks for sharing that with me. Let me respond accordingly.",
                    "I appreciate your message. Here's my response.",
                    "That's a good point. Let me elaborate on that.",
                    "I'm here to help. What would you like to know more about?",
                    "Interesting perspective. Let me share my thoughts on this.",
                    "Great question! Let me break that down for you.",
                    "I can definitely help with that. Here's my take on it.",
                    "Try asking me to 'generate an image of a cat' or 'draw a sunset' to see image generation in action!"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addMessage(randomResponse, false);
            }, 1500 + Math.random() * 1000);
        }
    }

    // Function to create new conversation
    function createNewConversation() {
        const conversationId = Date.now();
        conversations[conversationId] = [];
        currentConversationId = conversationId;
        
        // Clear chat messages
        chatMessages.innerHTML = `
            <div class="message-group">
                <div class="message assistant-message">
                    <div class="message-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                    <div class="message-content">
                        Hello! How can I help you today?
                    </div>
                </div>
            </div>
        `;
        
        // Update conversation list
        updateConversationList();
    }

    // Function to update conversation list
    function updateConversationList() {
        conversationsContainer.innerHTML = '';
        
        Object.keys(conversations).forEach(id => {
            const conversationItem = document.createElement('div');
            conversationItem.className = `conversation-item ${id == currentConversationId ? 'active' : ''}`;
            conversationItem.dataset.conversation = id;
            
            const messages = conversations[id];
            const title = messages.length > 0 ? 
                (messages.find(m => m.isUser)?.content.substring(0, 30) + '...' || 'New conversation') : 
                'New conversation';
            
            conversationItem.innerHTML = `
                <div class="conversation-title">${title}</div>
            `;
            
            conversationItem.addEventListener('click', () => {
                switchConversation(id);
            });
            
            conversationsContainer.appendChild(conversationItem);
        });
    }

    // Function to switch conversation
    function switchConversation(conversationId) {
        currentConversationId = conversationId;
        
        // Clear chat messages
        chatMessages.innerHTML = '';
        
        // Load conversation messages
        const messages = conversations[conversationId];
        if (messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="message-group">
                    <div class="message assistant-message">
                        <div class="message-avatar">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div class="message-content">
                            Hello! How can I help you today?
                        </div>
                    </div>
                </div>
            `;
        } else {
            messages.forEach(msg => {
                addMessage(msg.content, msg.isUser, msg.imageUrl);
            });
        }
        
        updateConversationList();
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('input', function() {
        autoResize(this);
        updateSendButton();
    });
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    newChatBtn.addEventListener('click', createNewConversation);

    // Test function for image generation (can be called from console)
    window.testImageGeneration = async function(prompt = "a cute cat") {
        console.log('Testing image generation with prompt:', prompt);
        try {
            const imageUrl = await generateImage(prompt);
            console.log('Generated image URL:', imageUrl);
            addMessage(`Test image generated:`, false, imageUrl);
            return imageUrl;
        } catch (error) {
            console.error('Test image generation failed:', error);
            addMessage(`Test failed: ${error.message}`, false);
            return null;
        }
    };

    // Initialize
    updateConversationList();
    messageInput.focus();
    
    console.log('Chat interface loaded. You can test image generation by typing:');
    console.log('- "generate an image of a cat"');
    console.log('- "draw a sunset"'); 
    console.log('- "create image of a robot"');
    console.log('Or test directly with: testImageGeneration("a cute cat")');
});
