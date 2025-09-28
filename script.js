// GPT Image 1 API Configuration
const OPENAI_API_KEY = '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';
const API_ENDPOINT = 'https://api.openai.com/v1/images/generations';

// Sports Teams Configuration
const PHILLY_TEAMS = {
    eagles: { 
        id: '21', // Correct ESPN team ID for Philadelphia Eagles
        league: 'nfl', 
        name: 'Philadelphia Eagles',
        logo: '🦅',
        colors: ['#004C54', '#A5ACAF', '#ACC0C6']
    },
    phillies: { 
        id: '22', // Correct ESPN team ID for Philadelphia Phillies
        league: 'mlb', 
        name: 'Philadelphia Phillies',
        logo: '⚾',
        colors: ['#E81828', '#002D72', '#FFFFFF']
    },
    sixers: { 
        id: '20', // Correct ESPN team ID for Philadelphia 76ers
        league: 'nba', 
        name: 'Philadelphia 76ers',
        logo: '🏀',
        colors: ['#006BB6', '#ED174C', '#002B5C']
    },
    union: { 
        id: '28567', // Correct ESPN team ID for Philadelphia Union
        league: 'mls', 
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
    // Generate button click
    generateBtn.addEventListener('click', handleGenerate);
    
    // Enter key in textarea (Ctrl+Enter for new line)
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.ctrlKey) {
            e.preventDefault();
            handleGenerate();
        }
    });
    
    // Download button
    downloadBtn.addEventListener('click', handleDownload);
    
    // Regenerate button
    regenerateBtn.addEventListener('click', handleRegenerate);
    
    // Generate with parameters button
    generateWithParams.addEventListener('click', handleGenerateWithParams);

    // Sports schedule refresh
    refreshScheduleBtn.addEventListener('click', loadSportsSchedules);
    
    // Auto-resize textarea
    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
    
    // Load sports schedules on page load
    loadSportsSchedules();
}

// Handle image generation
async function handleGenerate() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        showError('Please enter a description for the image you want to generate.');
        return;
    }
    
    currentPrompt = prompt;
    showLoading();
    hideError();
    hideImage();
    
    try {
        const imageUrl = await generateImage(prompt);
        showImage(imageUrl);
        currentImageUrl = imageUrl;
    } catch (error) {
        console.error('Generation error:', error);
        showError(error.message || 'Failed to generate image. Please try again.');
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
    
    promptInput.value = currentPrompt;
    handleGenerate();
}

// Handle generation with parameters
async function handleGenerateWithParams() {
    const params = getParameters();
    
    if (!params.businessName) {
        showError('Please enter a business name.');
        return;
    }
    
    const tailoredPrompt = generateTailoredPrompt(params);
    promptInput.value = tailoredPrompt;
    
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

The goal is to create a poster that people will remember, photograph, and share - something that stands out in a sea of boring promotional materials. Be bold, be creative, and make it unforgettable!`;
    
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
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    loadingIndicator.classList.remove('hidden');
}

// Hide loading state
function hideLoading() {
    generateBtn.disabled = false;
    generateBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        Generate Image
    `;
    loadingIndicator.classList.add('hidden');
}

// Show error message
function showError(message) {
    hideLoading();
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

// Hide error message
function hideError() {
    errorMessage.classList.add('hidden');
}

// Show generated image success message
function showImage(imageUrl) {
    hideLoading();
    
    // Create success message instead of showing image
    imageContainer.innerHTML = `
        <div class="success-message">
            <div class="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
            <h3>Image Downloaded Successfully!</h3>
            <p>Your generated image has been downloaded to your device.</p>
            <div class="image-actions">
                <button id="downloadBtn" class="action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Download Again
                </button>
                <button id="regenerateBtn" class="action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Regenerate
                </button>
                    </div>
                </div>
            `;
    
    // Re-attach event listeners for the new buttons
    document.getElementById('downloadBtn').addEventListener('click', handleDownload);
    document.getElementById('regenerateBtn').addEventListener('click', handleRegenerate);
    
    imageContainer.classList.remove('hidden');
}

// Hide generated image
function hideImage() {
    imageContainer.classList.add('hidden');
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

// Add the missing helper functions first
function formatGameDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatGameTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function parseGameDate(dateString) {
    try {
        // Parse "Mon, Oct 14" format and convert to YYYY-MM-DD
        const currentYear = new Date().getFullYear();
        const date = new Date(`${dateString}, ${currentYear}`);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
}

function parseGameTime(timeString) {
    try {
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes || '00'}`;
    } catch (error) {
        console.error('Error parsing time:', error);
        return null;
    }
}

function getTeamColors(teamName) {
    const team = Object.values(PHILLY_TEAMS).find(t => t.name === teamName);
    if (team && team.colors && team.colors.length > 0) {
        return {
            primary: team.colors[0],
            secondary: team.colors[1] || team.colors[0],
            all: team.colors.join(', ')
        };
    }
    return null;
}

// Select a game and populate form fields
function selectGame(gameElement) {
    // Remove previous selection
    document.querySelectorAll('.game-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    gameElement.classList.add('selected');
    
    // Get game data
    const gameId = gameElement.dataset.gameId;
    const teamName = gameElement.dataset.team;
    const matchupText = gameElement.querySelector('.game-matchup').textContent;
    const dateText = gameElement.querySelector('.game-date').textContent;
    const timeText = gameElement.querySelector('.game-time').textContent;
    
    // Store selected game
    selectedGame = {
        id: gameId,
        team: teamName,
        matchup: matchupText,
        date: dateText,
        time: timeText
    };
    
    // Auto-fill form fields
    autoFillGameDetails(selectedGame);
}

// Auto-fill form fields with selected game details
function autoFillGameDetails(game) {
    // Parse the date from the display format
    const gameDate = parseGameDate(game.date);
    const gameTime = parseGameTime(game.time);
    
    // Fill the form fields
    if (eventName && !eventName.value) {
        eventName.value = `${game.matchup} Watch Party`;
    }
    
    if (gameDate && eventDate && !eventDate.value) {
        eventDate.value = gameDate;
    }
    
    if (gameTime && eventTime && !eventTime.value) {
        eventTime.value = gameTime;
    }
    
    // Add game-specific details to additional details if empty
    if (additionalDetails && !additionalDetails.value) {
        additionalDetails.value = `Join us for the ${game.matchup}! Great atmosphere, food, and drinks while cheering on our team.`;
    }
    
    // Set appropriate color scheme based on team
    if (colorScheme && !colorScheme.value) {
        const teamColors = getTeamColors(game.team);
        if (teamColors) {
            colorScheme.value = teamColors.all;
        }
    }
}

// FIXED: Fetch team schedule from ESPN API with correct endpoints
async function fetchTeamSchedule(team) {
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Use correct ESPN API endpoints - different structure for each league
    let url;
    switch(team.league) {
        case 'nfl':
            url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.id}/schedule`;
            break;
        case 'nba':
            url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${team.id}/schedule`;
            break;
        case 'mlb':
            url = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${team.id}/schedule`;
            break;
        case 'mls':
            url = `https://site.api.espn.com/apis/site/v2/sports/soccer/mls/teams/${team.id}/schedule`;
            break;
        default:
            throw new Error(`Unsupported league: ${team.league}`);
    }
    
    try {
        console.log(`Fetching schedule for ${team.name} from: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            console.error(`HTTP error for ${team.name}! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Received data for ${team.name}:`, data);
        
        // Handle different API response structures
        const events = data.events || [];
        
        // Filter for upcoming games within the next week
        const upcomingGames = events
            .filter(event => {
                const gameDate = new Date(event.date);
                return gameDate >= today && gameDate <= oneWeekFromNow;
            })
            .map(event => {
                // Get opponent info
                const competition = event.competitions?.[0];
                const competitors = competition?.competitors || [];
                const homeTeam = competitors.find(c => c.homeAway === 'home');
                const awayTeam = competitors.find(c => c.homeAway === 'away');
                
                return {
                    id: event.id,
                    name: event.name,
                    shortName: event.shortName || `${awayTeam?.team?.abbreviation || 'TBA'} @ ${homeTeam?.team?.abbreviation || 'TBA'}`,
                    date: new Date(event.date),
                    status: event.status?.type?.description || 'Scheduled',
                    venue: competition?.venue?.fullName || 'TBD',
                    homeTeam: homeTeam?.team?.displayName || 'TBA',
                    awayTeam: awayTeam?.team?.displayName || 'TBA'
                };
            })
            .sort((a, b) => a.date - b.date);
        
        console.log(`Found ${upcomingGames.length} upcoming games for ${team.name}`);
        return upcomingGames;
        
    } catch (error) {
        console.error(`Error fetching schedule for ${team.name}:`, error);
        throw error;
    }
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
                        <div class="game-item" data-game-id="${game.id}" data-team="${team.name}">
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