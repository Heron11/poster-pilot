// GPT Image 1 API Configuration
const OPENAI_API_KEY = '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';
const API_ENDPOINT = 'https://api.openai.com/v1/images/generations';

// DOM Elements

// Overlay elements
const overlay = document.getElementById('overlay');
const overlayLoading = document.getElementById('overlayLoading');
const overlaySuccess = document.getElementById('overlaySuccess');
const overlayError = document.getElementById('overlayError');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const overlayImageUrlInput = document.getElementById('overlayImageUrlInput');
const overlayCopyUrlBtn = document.getElementById('overlayCopyUrlBtn');
const overlayDownloadBtn = document.getElementById('overlayDownloadBtn');
const overlayRegenerateBtn = document.getElementById('overlayRegenerateBtn');
const overlayCloseBtn = document.getElementById('overlayCloseBtn');
const overlayRetryBtn = document.getElementById('overlayRetryBtn');
const overlayCloseErrorBtn = document.getElementById('overlayCloseErrorBtn');
const overlayErrorText = document.getElementById('overlayErrorText');

// Parameter elements
const businessName = document.getElementById('businessName');
const eventName = document.getElementById('eventName');
const eventDate = document.getElementById('eventDate');
const eventTime = document.getElementById('eventTime');
const eventLocation = document.getElementById('eventLocation');
const designStyle = document.getElementById('designStyle');
const colorScheme = document.getElementById('colorScheme');
const additionalDetails = document.getElementById('additionalDetails');
const generateWithParams = document.getElementById('generateWithParams');

// State
let currentImageUrl = null;
let currentPrompt = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Generate with parameters button
    if (generateWithParams) {
        generateWithParams.addEventListener('click', handleGenerateWithParams);
    }
    
    // Overlay buttons
    if (overlayDownloadBtn) {
        overlayDownloadBtn.addEventListener('click', handleDownload);
    }
    
    if (overlayRegenerateBtn) {
        overlayRegenerateBtn.addEventListener('click', handleRegenerate);
    }
    
    if (overlayCloseBtn) {
        overlayCloseBtn.addEventListener('click', hideOverlay);
    }
    
    if (overlayRetryBtn) {
        overlayRetryBtn.addEventListener('click', handleGenerateWithParams);
    }
    
    if (overlayCloseErrorBtn) {
        overlayCloseErrorBtn.addEventListener('click', hideOverlay);
    }
    
    if (overlayCopyUrlBtn) {
        overlayCopyUrlBtn.addEventListener('click', handleCopyUrl);
    }
    
    // Close overlay when clicking outside
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                hideOverlay();
            }
        });
    }

}


// Generate image using GPT Image 1 API
    async function generateImage(prompt) {
    const requestBody = {
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1
    };
    
    console.log('Sending request to GPT Image 1 API:', requestBody);
    
    const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
    });
            
            if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
    console.log('GPT Image 1 API response:', data);
    
    // Debug: Log the data array structure
    console.log('Data array:', data.data);
    if (data.data && data.data[0]) {
        console.log('First data item:', data.data[0]);
        console.log('First data item keys:', Object.keys(data.data[0]));
    }
    
    // Parse the response - try multiple possible structures
    let imageUrl = null;
    
    // Try GPT Image 1 format: data[0].url
    if (data.data && data.data[0] && data.data[0].url) {
        imageUrl = data.data[0].url;
        console.log('Found image URL in GPT Image 1 format:', imageUrl);
    }
    // Try alternative format: data[0].image_url
    else if (data.data && data.data[0] && data.data[0].image_url) {
        imageUrl = data.data[0].image_url;
        console.log('Found image URL in alternative format:', imageUrl);
    }
    // Try base64 format: data[0].b64_json
    else if (data.data && data.data[0] && data.data[0].b64_json) {
        imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
        console.log('Found base64 image data');
    }
    // Try direct format: data.url
            else if (data.url) {
        imageUrl = data.url;
        console.log('Found image URL in direct format:', imageUrl);
    }
    
    if (imageUrl) {
        // Complete progress
        updateProgress(100, 'Complete!');
        
        // Download the image immediately
        await downloadImage(imageUrl, prompt);
        return imageUrl;
    } else {
        console.error('Could not find image URL in any format. Full response:', data);
        throw new Error('Could not find image URL in API response. Please try again.');
    }
}

// Download image function
async function downloadImage(imageUrl, prompt) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(link.href);
        
        console.log('Image downloaded successfully');
    } catch (error) {
        console.error('Error downloading image:', error);
        throw new Error('Failed to download image');
    }
}

// Handle download
function handleDownload() {
    if (!currentImageUrl) return;
    
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Handle regenerate
function handleRegenerate() {
    if (!currentPrompt) return;
    
    showLoading();
    hideError();
    hideImage();
    
    try {
        generateImage(currentPrompt).then(imageUrl => {
            showImage(imageUrl);
            currentImageUrl = imageUrl;
        }).catch(error => {
            console.error('Regeneration error:', error);
            showError(error.message || 'Failed to regenerate image. Please try again.');
        });
    } catch (error) {
        console.error('Regeneration error:', error);
        showError(error.message || 'Failed to regenerate image. Please try again.');
    }
}

// Handle generation with parameters
async function handleGenerateWithParams() {
    const params = getParameters();
    
    if (!params.businessName) {
        showError('Please enter a business name.');
        return;
    }
    
    const tailoredPrompt = generateTailoredPrompt(params);
    
    currentPrompt = tailoredPrompt;
    showLoading();
    hideError();
    hideImage();
    
    try {
        const imageUrl = await generateImage(tailoredPrompt);
        showImage(imageUrl);
        currentImageUrl = imageUrl;
            } catch (error) {
        console.error('Generation error:', error);
        showError(error.message || 'Failed to generate image. Please try again.');
    }
}

// Get parameters from form
function getParameters() {
    return {
        businessName: businessName.value.trim(),
        eventName: eventName.value.trim(),
        eventDate: eventDate.value,
        eventTime: eventTime.value,
        eventLocation: eventLocation.value.trim(),
        designStyle: designStyle.value,
        colorScheme: colorScheme.value.trim(),
        additionalDetails: additionalDetails.value.trim()
    };
}

// Generate tailored prompt from parameters
function generateTailoredPrompt(params) {
    console.log('Parameters received:', params);
    
    // Build creative and unique poster prompt
    let prompt = `Design a stunning, eye-catching promotional poster that breaks the mold of typical boring advertisements. Create something truly memorable and unique.

CORE INFORMATION TO INCLUDE:
- Business: "${params.businessName}"
- Event: "${params.eventName || 'Special Event'}"
- Date: ${formatDate(params.eventDate) || 'TBA'}
- Time: ${formatTime(params.eventTime) || 'TBA'}
- Location: "${params.eventLocation || 'Contact for details'}"

CREATIVE DIRECTION:
${getDesignStyleDescription(params.designStyle)}

COLOR INSPIRATION: ${params.colorScheme || 'Create a dynamic, energetic color palette that grabs attention'}

SPECIAL ELEMENTS: ${params.additionalDetails || 'Add creative visual elements that make this poster stand out from the crowd'}

DESIGN CHALLENGE:
- Think outside the box - avoid cliché layouts and typical poster designs
- Create visual interest through unexpected compositions, creative typography, and unique graphic elements
- Use dynamic angles, creative text placement, or innovative visual metaphors
- Add personality and character that reflects the business and event theme
- Include subtle details, textures, or artistic elements that reward closer inspection
- Make it feel like a work of art, not just an advertisement

CRITICAL TEXT ACCURACY REQUIREMENTS:
- Generate ALL text with perfect accuracy - every character, number, and word must be exactly correct
- Double-check spelling of business names, event names, dates, times, and locations
- Ensure dates are in the correct format (MM/DD/YYYY)
- Ensure times are in the correct 12-hour AM/PM format
- Verify all text is legible and clearly readable at any size
- Use high contrast between text and background for maximum readability
- Ensure no text is cut off, overlapping, or partially obscured
- Make sure all information is displayed exactly as provided without any modifications

VISUAL IMPACT:
- Design something that would stop people in their tracks
- Create visual drama and excitement
- Use creative lighting, shadows, or atmospheric effects
- Consider unique perspectives or artistic techniques
- Add unexpected visual elements that surprise and delight

TYPOGRAPHY CREATIVITY:
- Experiment with creative text treatments beyond basic fonts
- Use typography as a design element itself
- Consider artistic text effects, creative sizing, or unique placements
- Make the text part of the overall artistic composition

The goal is to create a poster that people will remember, photograph, and share - something that stands out in a sea of boring promotional materials. Be bold, be creative, and make it unforgettable!

FINAL REMINDER: Pay meticulous attention to text accuracy. Every single character in the business name, event name, date, time, and location must be rendered exactly as provided. Text accuracy is absolutely critical - double-check everything before finalizing the design.`;
    
    console.log('Final generated prompt:', prompt);
    return prompt;
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return null;
    const dateParts = dateString.split('-');
    return `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
}

// Helper function to format time
function formatTime(timeString) {
    if (!timeString) return null;
    const timeParts = timeString.split(':');
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

// Helper function to get detailed design style descriptions
function getDesignStyleDescription(style) {
    const styleDescriptions = {
        'modern': 'Push the boundaries of contemporary design with unexpected geometric compositions, innovative typography treatments, and cutting-edge visual elements. Experiment with asymmetrical layouts, creative use of negative space, and modern artistic techniques that feel fresh and avant-garde.',
        'vintage': 'Channel authentic retro aesthetics with creative reinterpretations of classic design eras. Think artistic vintage posters, hand-drawn elements, weathered textures, and nostalgic color palettes that tell a story. Add artistic flair and period-appropriate details that feel authentic yet surprising.',
        'minimalist': 'Master the art of "less is more" with sophisticated minimalism that uses every element purposefully. Create visual impact through strategic use of space, innovative typography choices, and subtle details that reveal themselves upon closer inspection. Make simplicity feel luxurious and intentional.',
        'bold': 'Create explosive visual energy with dramatic compositions, powerful typography treatments, and dynamic graphic elements. Use bold color contrasts, creative text effects, and energetic layouts that demand attention. Think poster art that would look stunning on a gallery wall.',
        'elegant': 'Design with refined sophistication and artistic grace. Use premium visual elements, sophisticated color harmonies, and elegant typography treatments that feel luxurious and timeless. Create something that feels like high-end design art rather than typical advertising.',
        'playful': 'Infuse joy and creativity with whimsical design elements, unexpected visual surprises, and delightful artistic touches. Use creative character illustrations, fun typography treatments, and playful compositions that bring smiles and create memorable experiences.',
        'professional': 'Elevate corporate design to an art form with innovative professional aesthetics. Use sophisticated layouts, premium typography treatments, and refined visual elements that maintain professionalism while pushing creative boundaries.'
    };
    return styleDescriptions[style] || 'Create a unique, memorable design that stands out from typical promotional materials with artistic flair and creative innovation';
}

// Show loading state
function showLoading() {
    if (generateWithParams) {
        generateWithParams.disabled = true;
        generateWithParams.textContent = 'Generating...';
    }
    showOverlayLoading();
}

// Hide loading state
function hideLoading() {
    if (generateWithParams) {
        generateWithParams.disabled = false;
        generateWithParams.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                            </svg>
            Generate with Parameters
        `;
    }
}

// Show error message
function showError(message) {
    hideLoading();
    showOverlayError(message);
}

// Hide error message
function hideError() {
    // Error handling is now done through overlay
}

// Show generated image success message
function showImage(imageUrl) {
    hideLoading();
    
    // Store the image URL globally for Zapier use
    window.generatedImageUrl = imageUrl;
    
    // Show success overlay
    showOverlaySuccess(imageUrl);
}

// Hide generated image
function hideImage() {
    // Image display is now handled through overlay
}

// Overlay control functions
function showOverlayLoading() {
    overlay.style.display = 'flex';
    overlayLoading.classList.remove('hidden');
    overlaySuccess.classList.add('hidden');
    overlayError.classList.add('hidden');
    
    // Reset progress
    updateProgress(0, 'Initializing...');
    
    // Simulate progress
    setTimeout(() => updateProgress(20, 'Generating prompt...'), 500);
    setTimeout(() => updateProgress(40, 'Sending to AI...'), 1000);
    setTimeout(() => updateProgress(60, 'Creating image...'), 1500);
    setTimeout(() => updateProgress(80, 'Processing...'), 2000);
}

function updateProgress(percentage, text) {
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    if (progressText) {
        progressText.textContent = text;
    }
}

function showOverlaySuccess(imageUrl) {
    overlay.style.display = 'flex';
    overlayLoading.classList.add('hidden');
    overlaySuccess.classList.remove('hidden');
    overlayError.classList.add('hidden');
    
    if (overlayImageUrlInput) {
        overlayImageUrlInput.value = imageUrl;
    }
}

function showOverlayError(message) {
    overlay.style.display = 'flex';
    overlayLoading.classList.add('hidden');
    overlaySuccess.classList.add('hidden');
    overlayError.classList.remove('hidden');
    
    if (overlayErrorText) {
        overlayErrorText.textContent = message;
    }
}

function hideOverlay() {
    overlay.style.display = 'none';
}

function handleCopyUrl() {
    if (overlayImageUrlInput) {
        overlayImageUrlInput.select();
        overlayImageUrlInput.setSelectionRange(0, 99999);
        document.execCommand('copy');
        
        // Show feedback
        const originalText = overlayCopyUrlBtn.innerHTML;
        overlayCopyUrlBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            </svg>
            Copied!
        `;
        
        setTimeout(() => {
            overlayCopyUrlBtn.innerHTML = originalText;
        }, 2000);
    }
}

// Utility function to format error messages
function formatErrorMessage(error) {
    if (error.includes('API request failed')) {
        return 'There was an issue with the image generation service. Please try again.';
    } else if (error.includes('Unexpected API response')) {
        return 'The service returned an unexpected response. Please try again.';
    } else {
        return error;
    }
}