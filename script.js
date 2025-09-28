// GPT Image 1 API Configuration
const OPENAI_API_KEY = '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';
const API_ENDPOINT = 'https://api.openai.com/v1/images/generations';

// Sports Teams Configuration
const PHILLY_TEAMS = {
    eagles: { 
        id: '21',
        league: 'nfl',
        name: 'Philadelphia Eagles',
        logo: '🦅',
        colors: ['#004C54', '#A5ACAF', '#ACC0C6']
    },
    phillies: { 
        id: '22',
        league: 'mlb',
        name: 'Philadelphia Phillies',
        logo: '⚾',
        colors: ['#E81828', '#002D72', '#FFFFFF']
    },
    sixers: { 
        id: '20',
        league: 'nba',
        name: 'Philadelphia 76ers',
        logo: '🏀',
        colors: ['#006BB6', '#ED174C', '#002B5C']
    },
    // FIX: use usa.1 (MLS competition code) not mls
    union: { 
        id: '10739',
        league: 'usa.1',
        name: 'Philadelphia Union',
        logo: '⚽',
        colors: ['#B1872D', '#071B2C']
    }
};

// Global sports schedule data
let sportsSchedule = {};
let selectedGame = null;

// DOM Elements
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const imageContainer = document.getElementById('imageContainer');
const generatedImage = document.getElementById('generatedImage');
const downloadBtn = document.getElementById('downloadBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const sportsScheduleContainer = document.getElementById('sportsScheduleContainer');
const refreshScheduleBtn = document.getElementById('refreshSchedule');

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
const overlayErrorText = document.getElementById('overlayErrorText')

// Parameter elements
const businessName = document.getElementById('businessName');
const eventName = document.getElementById('eventName');
const eventDate = document.getElementById('eventDate');
const eventTime = document.getElementById('eventTime');
const eventLocation = document.getElementById('eventLocation');
const designStyle = document.getElementById('designStyle');
const textStyle = document.getElementById('textStyle');
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
    
    // Generate with parameters button
    generateWithParams.addEventListener('click', handleGenerateWithParams);

    // Sports schedule refresh
    refreshScheduleBtn.addEventListener('click', loadSportsSchedules);
    
    // Auto-resize textarea
    if (promptInput) {
        promptInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
    
    // Close overlay when clicking outside
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                hideOverlay();
            }
        });
    }
    
    // Load sports schedules on page load automatically - only if container exists
    if (sportsScheduleContainer) {
        console.log('Loading sports schedules on page load...');
        loadSportsSchedules();
    } else {
        console.log('Sports schedule container not found');
    }
}

// Handle image generation
async function handleGenerate() {
    const prompt = promptInput.value.trim();
  
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
        textStyle: textStyle.value,
        colorScheme: colorScheme.value.trim(),
        additionalDetails: additionalDetails.value.trim()
    };
}

// Generate tailored prompt from parameters
function generateTailoredPrompt(params) {
    console.log('Parameters received:', params);
    
    // Build creative and unique poster prompt
    let prompt = `Design a stunning, eye-catching promotional poster that breaks the mold of typical boring advertisements. Create something truly memorable and unique while maintaining an elegant, professional, and polished appearance.

CORE INFORMATION TO INCLUDE:
- Business: "${params.businessName}"
- Event: "${params.eventName || 'Special Event'}"
- Date: ${formatDate(params.eventDate) || 'TBA'}
- Time: ${formatTime(params.eventTime) || 'TBA'}
- Location: "${params.eventLocation || 'Contact for details'}"

CREATIVE DIRECTION:
${getDesignStyleDescription(params.designStyle)}

${params.textStyle ? `
TEXT STYLE REQUIREMENTS:
${getTextStyleDescription(params.textStyle)}

CRITICAL TEXT IMPLEMENTATION:
- Apply the specified text style to ALL business information (business name, event name, date, time, location)
- Ensure the text style is consistently applied throughout the entire poster
- Make sure the text style enhances the overall design while maintaining perfect readability
- The text style should complement and work harmoniously with the chosen design style
- All text must be rendered with the specified typography treatment and visual effects
` : ''}

${params.designStyle === 'realistic' ? `
ULTRA-REALISTIC REQUIREMENTS FOR REALISTIC STYLE:
- Generate photorealistic, ultra-realistic images that look like professional photography
- The image must be so realistic it could be mistaken for a real photograph
- Include ALL text as integrated, readable elements within the realistic image
- Use professional photography quality with dramatic lighting and realistic textures
- Create depth, shadows, and realistic materials that look authentic
- The final result must be a single, ultra-realistic image with all text included
` : ''}

COLOR INSPIRATION: ${params.colorScheme || 'Create a dynamic, energetic color palette that grabs attention'}

SPECIAL ELEMENTS: ${params.additionalDetails || 'Add creative visual elements that make this poster stand out from the crowd'}

DESIGN CHALLENGE:
- Think outside the box - avoid cliché layouts and typical poster designs
- Create visual interest through unexpected compositions, creative typography, and unique graphic elements
- Use dynamic angles, creative text placement, or innovative visual metaphors
- Add personality and character that reflects the business and event theme
- Include subtle details, textures, or artistic elements that reward closer inspection
- Make it feel like a work of art, not just an advertisement
- ALWAYS maintain an elegant, professional, and polished appearance - never scrapy or amateur-looking
- Even playful designs should have a sophisticated, refined feel

CRITICAL TEXT ACCURACY REQUIREMENTS:
- Generate ALL text with perfect accuracy - every character, number, and word must be exactly correct
- Double-check spelling of business names, event names, dates, times, and locations
- Ensure dates are in the correct format (MM/DD/YYYY)
- Ensure times are in the correct 12-hour AM/PM format
- Verify all text is legible and clearly readable at any size
- Use high contrast between text and background for maximum readability
- Ensure no text is cut off, overlapping, or partially obscured
- Make sure all information is displayed exactly as provided without any modifications
- CRITICAL: All words must stay on the same line - never split words across lines
- Ensure proper text wrapping and line breaks to maintain readability
- Use appropriate font sizing to prevent text overflow or awkward breaks

VISUAL IMPACT:
- Design something that would stop people in their tracks
- Create visual drama and excitement
- Use creative lighting, shadows, or atmospheric effects
- Consider unique perspectives or artistic techniques
- Add unexpected visual elements that surprise and delight
- Maintain a polished, professional appearance throughout

TYPOGRAPHY CREATIVITY:
- Experiment with creative text treatments beyond basic fonts
- Use typography as a design element itself
- Consider artistic text effects, creative sizing, or unique placements
- Make the text part of the overall artistic composition
- Ensure all text remains elegant and professional-looking
- Never use fonts or treatments that look cheap or amateur

The goal is to create a poster that people will remember, photograph, and share - something that stands out in a sea of boring promotional materials while maintaining an elegant, professional, and polished appearance. Be bold, be creative, and make it unforgettable!

FINAL REMINDER: Pay meticulous attention to text accuracy and professional appearance. Every single character in the business name, event name, date, time, and location must be rendered exactly as provided. Text accuracy is absolutely critical - double-check everything before finalizing the design. Ensure all text stays on single lines and maintains a polished, professional appearance.`;
    
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

// Add these missing helper functions after formatTime function
function formatGameDate(d) {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date)) return '';
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

function formatGameTime(d) {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date)) return '';
    return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });
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
        'professional': 'Elevate corporate design to an art form with innovative professional aesthetics. Use sophisticated layouts, premium typography treatments, and refined visual elements that maintain professionalism while pushing creative boundaries.',
        'realistic': 'CRITICAL: Generate ULTRA-REALISTIC, photorealistic images that look like professional photography or high-end digital art. The image must be so realistic it could be mistaken for a real photograph. Use professional photography quality with dramatic lighting, realistic textures, materials, and depth. Include ALL business text information as realistic, readable text elements within the image - never generate text separately. The text must be integrated into the visual design as part of the realistic image. Think museum-quality artwork that happens to be a business poster - sophisticated, memorable, and visually stunning with perfect text integration. Focus on realistic composition, professional typography treatments, and visual elements that make this poster look like a professional photograph while maintaining perfect business professionalism. The final result must be a single, ultra-realistic image with all text included and perfectly readable. OUTDOOR SETTING REQUIREMENTS: Create an outdoor environment with multiple real-world objects including trees, buildings, street furniture, vehicles, people, and other realistic elements. Use different depths and perspectives - include foreground, middle ground, and background elements to create realistic depth of field. Incorporate modern, contemporary text styles with clean typography that feels current and professional. Use natural lighting conditions and realistic atmospheric effects to enhance the outdoor setting.'
    };
    return styleDescriptions[style] || 'Create a unique, memorable design that stands out from typical promotional materials with artistic flair and creative innovation';
}

// Helper function to get detailed text style descriptions
function getTextStyleDescription(textStyle) {
    const textStyleDescriptions = {
        'classic': 'Use traditional, timeless typography with serif fonts that convey authority and elegance. Apply classic typography principles with proper spacing, hierarchy, and readability. Think sophisticated newspaper headlines or high-end magazine layouts.',
        'modern': 'Apply clean, contemporary sans-serif typography with geometric precision. Use modern font families like Helvetica, Arial, or Futura with clean lines and excellent readability. Focus on minimalist typography that feels current and professional.',
        'script': 'Implement elegant, flowing script typography that adds sophistication and personality. Use cursive or calligraphic fonts that feel refined and artistic. Perfect for elegant events, weddings, or upscale businesses.',
        'bold': 'Create powerful, attention-grabbing typography with thick, heavy fonts and strong visual impact. Use bold display fonts that command attention and create dramatic visual hierarchy. Perfect for energetic events and bold statements.',
        'minimal': 'Apply ultra-clean, minimal typography with maximum white space and simple font choices. Focus on typography that is almost invisible in its simplicity yet highly effective. Use thin weights and generous spacing.',
        'textMasking': 'CRITICAL TEXT MASKING REQUIREMENTS: Create text that appears to be cut out or masked from background images or textures. The text should reveal background content through the letterforms, creating a sophisticated masking effect. Use bold, thick fonts that work well for masking. The background should be visible through the text letters, creating a professional text masking effect. Ensure the text remains highly readable despite the masking technique. This creates a modern, sophisticated look where text becomes a window to the background content.',
        '3d': 'Generate dramatic 3D text effects with depth, shadows, and dimensional appearance. Create text that appears to pop off the page with realistic 3D modeling, proper lighting, and shadow effects. Use bold fonts that work well with 3D treatment.',
        'neon': 'Create glowing neon text effects with electric colors and luminous properties. Apply neon tube lighting effects, glowing edges, and vibrant colors that simulate real neon signage. Perfect for night events, clubs, or modern venues.',
        'handwritten': 'Use authentic handwritten typography that feels personal and approachable. Apply natural, organic letterforms that look genuinely hand-drawn with slight imperfections and character. Great for casual events or personal businesses.',
        'vintage': 'Implement retro typography styles from specific eras with authentic period-appropriate fonts. Use vintage letterforms, decorative elements, and classic typography treatments that evoke nostalgia and timeless appeal.'
    };
    return textStyleDescriptions[textStyle] || '';
}

// Show loading state
function showLoading() {
    if (generateWithParams) {
        generateWithParams.disabled = true;
        generateWithParams.innerHTML = 'Generating...';
    }
    showOverlayLoading();
}

// Hide loading state
function hideLoading() {
    if (generateWithParams) {
        generateWithParams.disabled = false;
        generateWithParams.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                        </svg>
            Generate
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
    if (overlay) {
        overlay.style.display = 'flex';
        if (overlayLoading) overlayLoading.classList.remove('hidden');
        if (overlaySuccess) overlaySuccess.classList.add('hidden');
        if (overlayError) overlayError.classList.add('hidden');
        
        // Reset progress
        updateProgress(0, 'Initializing...');
        
        // Simulate progress over 30 seconds
        setTimeout(() => updateProgress(10, 'Generating prompt...'), 3000);
        setTimeout(() => updateProgress(25, 'Sending to AI...'), 7500);
        setTimeout(() => updateProgress(45, 'Creating image...'), 13500);
        setTimeout(() => updateProgress(65, 'Processing details...'), 19500);
        setTimeout(() => updateProgress(80, 'Finalizing...'), 24000);
        setTimeout(() => updateProgress(95, 'Almost done...'), 27000);
    }
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
    if (overlay) {
        overlay.style.display = 'flex';
        if (overlayLoading) overlayLoading.classList.add('hidden');
        if (overlaySuccess) overlaySuccess.classList.remove('hidden');
        if (overlayError) overlayError.classList.add('hidden');
        
        if (overlayImageUrlInput) {
            overlayImageUrlInput.value = imageUrl;
        }
    }
}

function showOverlayError(message) {
    if (overlay) {
        overlay.style.display = 'flex';
        if (overlayLoading) overlayLoading.classList.add('hidden');
        if (overlaySuccess) overlaySuccess.classList.add('hidden');
        if (overlayError) overlayError.classList.remove('hidden');
        
        if (overlayErrorText) {
            overlayErrorText.textContent = message;
        }
    }
}

function hideOverlay() {
    if (overlay) {
        overlay.style.display = 'none';
    }
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

// Load sports schedules from ESPN API - REAL DATA ONLY
async function loadSportsSchedules() {
    sportsScheduleContainer.innerHTML = '<div class="loading-sports">Loading schedules...</div>';
    
    try {
        const schedulePromises = Object.entries(PHILLY_TEAMS).map(async ([key, team]) => {
            try {
                const schedule = await fetchTeamSchedule(team);
                return { key, team, schedule };
            } catch (error) {
                console.error(`Error fetching ${team.name} schedule:`, error);
                return { key, team, schedule: [] };
            }
        });
        
        const results = await Promise.all(schedulePromises);
        
        // Store the schedule data
        sportsSchedule = {};
        results.forEach(({ key, schedule }) => {
            sportsSchedule[key] = schedule;
        });
        
        displaySportsSchedules(results);
        
        console.log('Loaded real schedules for all teams');
    } catch (error) {
        console.error('Error loading sports schedules:', error);
        sportsScheduleContainer.innerHTML = '<div class="no-games">Unable to load schedules. Please try again.</div>';
    }
}

// Replace your fetchTeamSchedule function with this version
async function fetchTeamSchedule(team) {
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Map league -> ESPN path segment
    const leaguePaths = {
        nfl: 'football/nfl',
        nba: 'basketball/nba',
        mlb: 'baseball/mlb',
        'usa.1': 'soccer/usa.1' // MLS
    };

    const path = leaguePaths[team.league];
    if (!path) throw new Error(`Unsupported league: ${team.league}`);

    let url = `https://site.api.espn.com/apis/site/v2/sports/${path}/teams/${team.id}/schedule`;
    console.log(`Fetching schedule for ${team.name} from: ${url}`);

    let data;
    try {
        let resp = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!resp.ok) {
            // Fallback: if MLS 500, try legacy soccer/mls path once
            if (team.league === 'usa.1' && resp.status === 500) {
                const fallback = `https://site.api.espn.com/apis/site/v2/sports/soccer/mls/teams/${team.id}/schedule`;
                console.warn(`Primary MLS path 500. Trying fallback: ${fallback}`);
                const fr = await fetch(fallback, { headers: { Accept: 'application/json' } });
                if (!fr.ok) throw new Error(`Fallback HTTP ${fr.status}`);
                data = await fr.json();
            } else {
                throw new Error(`HTTP ${resp.status}`);
            }
        } else {
            data = await resp.json();
        }
    } catch (e) {
        console.error(`Error fetching schedule for ${team.name}:`, e);
        return []; // return empty so UI can show "No upcoming games"
    }

    const events = data.events || [];
    const upcoming = events
        .filter(ev => {
            const d = new Date(ev.date);
            return d >= today && d <= oneWeekFromNow;
        })
        .map(ev => {
            const comp = ev.competitions?.[0];
            const competitors = comp?.competitors || [];
            const home = competitors.find(c => c.homeAway === 'home');
            const away = competitors.find(c => c.homeAway === 'away');
            return {
                id: ev.id,
                name: ev.name,
                shortName: ev.shortName || `${away?.team?.abbreviation || '?'} @ ${home?.team?.abbreviation || '?'}`,
                date: new Date(ev.date),
                status: ev.status?.type?.description || 'Scheduled',
                venue: comp?.venue?.fullName || 'TBD',
                homeTeam: home?.team?.displayName || 'TBA',
                awayTeam: away?.team?.displayName || 'TBA'
            };
        })
        .sort((a,b) => a.date - b.date);

    console.log(`Found ${upcoming.length} upcoming games for ${team.name}`);
    return upcoming;
}

// Display sports schedules in the UI - REAL DATA ONLY
function displaySportsSchedules(results) {
    const hasAnyGames = results.some(({ schedule }) => schedule && schedule.length > 0);
    
    if (!hasAnyGames) {
        sportsScheduleContainer.innerHTML = `
            <div class="no-games">
                <p>No Philadelphia team games scheduled for the next week</p>
                <p style="font-size: 0.8rem; margin-top: 8px; color: #95a5a6;">
                    Check back later for upcoming games
                </p>
            </div>
        `;
        return;
    }
    
    const html = results
        .filter(({ schedule }) => schedule && schedule.length > 0)
        .map(({ team, schedule }) => `
            <div class="team-section">
                <div class="team-header">
                    <span class="team-logo">${team.logo}</span>
                    <span class="team-name">${team.name}</span>
                </div>
                <div class="game-list">
                    ${schedule.map(game => `
                        <div class="game-item" 
                             data-game-id="${game.id}" 
                             data-team="${team.name}"
                             data-matchup="${game.shortName || game.name}"
                             data-venue="${game.venue || ''}">
                            <div class="game-matchup">${game.shortName || game.name}</div>
                            <div class="game-details">
                                <span class="game-date">${formatGameDate(game.date)}</span>
                                <span class="game-time">${formatGameTime(game.date)}</span>
                            </div>
                            ${game.venue && game.venue !== 'TBD' ? 
                                `<div class="game-venue" style="font-size: 0.75rem; color: #95a5a6; margin-top: 2px;">${game.venue}</div>` 
                                : ''
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    
    sportsScheduleContainer.innerHTML = html;
    
    // Add click handlers for game selection
    document.querySelectorAll('.game-item').forEach(item => {
        item.addEventListener('click', () => selectGame(item));
    });
}

function selectGame(gameElement) {
    // Remove previous selections
    document.querySelectorAll('.game-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selected class to clicked game
    gameElement.classList.add('selected');
    
    // Get game data from element attributes and content
    const gameId = gameElement.getAttribute('data-game-id');
    const teamName = gameElement.getAttribute('data-team');
    const gameMatchup = gameElement.querySelector('.game-matchup').textContent;
    const gameDate = gameElement.querySelector('.game-date').textContent;
    const gameTime = gameElement.querySelector('.game-time').textContent;
    const gameVenue = gameElement.querySelector('.game-venue')?.textContent || '';
    
    // Store selected game globally
    selectedGame = {
        id: gameId,
        team: teamName,
        matchup: gameMatchup,
        date: gameDate,
        time: gameTime,
        venue: gameVenue
    };
    
    // Fill form fields with game information
    fillFormWithGameInfo(selectedGame);
    
    console.log('Game selected:', selectedGame);
}

function fillFormWithGameInfo(game) {
    // Set business name to a default or leave empty for user to fill
    if (businessName) businessName.value = '';
    
    // Set event name to the game matchup
    if (eventName) eventName.value = game.matchup;
    
    // Parse and set the date
    const parsedDate = parseGameDate(game.date);
    if (parsedDate && eventDate) {
        eventDate.value = parsedDate;
    }
    
    // Parse and set the time
    const parsedTime = parseGameTime(game.time);
    if (parsedTime && eventTime) {
        eventTime.value = parsedTime;
    }
    
    // Set location to venue or team default
    if (eventLocation) {
        eventLocation.value = game.venue || getTeamVenue(game.team);
    }
    
    // Set color scheme based on team
    const teamColors = getTeamColors(game.team);
    if (teamColors && colorScheme) {
        colorScheme.value = teamColors;
    }
    
    // Set additional details with team info
    if (additionalDetails) {
        additionalDetails.value = `${game.team} game - ${game.matchup}`;
    }
    
    // Optionally set design style to sports theme
    if (designStyle && designStyle.value === '') {
        designStyle.value = 'bold';
    }
    
    console.log('Form filled with game info:', game);
}

// Helper function to parse game date (e.g., "Wed, Oct 2" to "2024-10-02")
function parseGameDate(dateString) {
    if (!dateString) return '';
    
    try {
        // Current year for context
        const currentYear = new Date().getFullYear();
        
        // Parse date like "Wed, Oct 2" or "Thu, Oct 3"
        const dateMatch = dateString.match(/\w+,?\s+(\w+)\s+(\d+)/);
        if (!dateMatch) return '';
        
        const monthName = dateMatch[1];
        const day = parseInt(dateMatch[2]);
        
        // Month name to number mapping
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        const month = months[monthName];
        if (month === undefined) return '';
        
        const date = new Date(currentYear, month, day);
        
        // Format as YYYY-MM-DD for HTML date input
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    } catch (error) {
        console.error('Error parsing game date:', error);
        return '';
    }
}

// Helper function to parse game time (e.g., "1:00 PM" to "13:00")
function parseGameTime(timeString) {
    if (!timeString) return '';
    
    try {
        // Parse time like "1:00 PM" or "3:05 PM"
        const timeMatch = timeString.match(/(\d+):(\d+)\s+(AM|PM)/i);
        if (!timeMatch) return '';
        
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        const ampm = timeMatch[3].toLowerCase();
        
        // Convert to 24-hour format
        if (ampm === 'pm' && hours !== 12) {
            hours += 12;
        } else if (ampm === 'am' && hours === 12) {
            hours = 0;
        }
        
        // Format as HH:MM for HTML time input
        return String(hours).padStart(2, '0') + ':' + minutes;
    } catch (error) {
        console.error('Error parsing game time:', error);
        return '';
    }
}

// Helper function to get team venue defaults
function getTeamVenue(teamName) {
    const venues = {
        'Philadelphia Eagles': 'Lincoln Financial Field',
        'Philadelphia Phillies': 'Citizens Bank Park',
        'Philadelphia 76ers': 'Wells Fargo Center',
        'Philadelphia Union': 'Subaru Park'
    };
    
    return venues[teamName] || 'Philadelphia, PA';
}

// Helper function to get team colors
function getTeamColors(teamName) {
    const teamData = Object.values(PHILLY_TEAMS).find(team => team.name === teamName);
    if (teamData && teamData.colors) {
        return teamData.colors.join(', ');
    }
    return '';
}
