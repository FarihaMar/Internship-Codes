/**
 * Waits for the entire page to finish loading (including all resources)
 * @returns {Promise<void>} Resolves when page is fully loaded
 */
async function waitForPageLoad() {
    // If already loaded, return immediately
    if (document.readyState === 'complete') return;
    
    // Otherwise wait for load event
    await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
    });
}

async function extractUnreadMessages(participantNames) {
    const unreadMessages = [];
    const conversationCards = document.querySelectorAll('.msg-conversation-listitem');
   
    for (const participantName of participantNames) {
        const card = Array.from(conversationCards).find(card => {
            const nameElement = card.querySelector('.msg-conversation-card__participant-names span');
            return nameElement?.textContent.trim() === participantName;
        });
        
        if (!card) continue;

        try {
            // Extract timestamp from the correct element
            const timestampElem = card.querySelector('.msg-conversation-listitem__time-stamp');
            const timestamp = timestampElem?.textContent.trim() || new Date().toLocaleTimeString('en-GB', { hour12: true });
            
            // Extract message snippet and determine sender
            const messageSnippetElement = card.querySelector('.msg-conversation-card__message-snippet--v2, .msg-conversation-card__message-snippet');
            const fullMessage = messageSnippetElement?.textContent.trim() || 'No message';

            // Extract sender (either "You" or participant name)
            let sentBy = participantName;
            let message = fullMessage;

            if (fullMessage.startsWith('You:')) {
                sentBy = 'You';
                message = fullMessage.replace(/^You:\s*/, '').trim();
            } else if (fullMessage.includes(':')) {
                // If message has "ParticipantName: message" format
                const colonIndex = fullMessage.indexOf(':');
                sentBy = fullMessage.substring(0, colonIndex).trim();
                message = fullMessage.substring(colonIndex + 1).trim();
            }

            // Extract other details
            const presenceIndicator = card.querySelector('.presence-indicator');
            const starIcon = card.querySelector('.msg-conversation-card__star-icon');
            const muteIcon = card.querySelector('.msg-conversation-card__mute-icon');
            
            unreadMessages.push({
                participantName,
                timestamp,
                sentBy: participantName,
                message: messageSnippetElement?.textContent.replace(/^You:\s*/, '').trim() || 'No message',
                isOnline: presenceIndicator?.classList.contains('presence-indicator--is-online') || 
                          presenceIndicator?.classList.contains('presence-indicator--is-reachable'),
                isStarred: starIcon?.classList.contains('msg-conversation-card__star-icon--starred'),
                isMuted: !!muteIcon,
                messageStatus: 'unread',
                unreadMessageCount: 5
            });
        } catch (error) {
            console.error(`Error processing ${participantName}:`, error);
        }
    }
}

function extractMessages(limit) {
    const messageContainer = document.querySelector('.msg-s-message-list');
    const messages = [];
    
    // Variables to store the last known sender, time, and date
    let lastKnownSender = null;
    let lastKnownTime = null;
    let lastKnownDate = null;
    
    // Select all message list items
    const messageItems = messageContainer.querySelectorAll('.msg-s-message-list__event');
    
    // Iterate over all message items
    messageItems.forEach(item => {
        // Extract date if available
        const dateHeading = item.querySelector('.msg-s-message-list__time-heading');
        if (dateHeading) {
            lastKnownDate = dateHeading.textContent.trim();
        }
        
        // Extract all messages within this event
        const messageElements = item.querySelectorAll('.msg-s-event-listitem');
        
        messageElements.forEach(messageItem => {
            const senderElement = messageItem.querySelector('.msg-s-message-group__name');
            const timeElement = messageItem.querySelector('.msg-s-message-group__timestamp');
            const messageElement = messageItem.querySelector('.msg-s-event-listitem__body');
            
            // Use the last known sender, time, and date if current ones are missing
            const sender = senderElement ? senderElement.textContent.trim() : lastKnownSender;
            const time = timeElement ? timeElement.textContent.trim() : lastKnownTime;
            const message = messageElement ? messageElement.textContent.trim() : null;
            
            // Update last known sender, time, and date if current ones are valid
            if (senderElement) lastKnownSender = sender;
            if (timeElement) lastKnownTime = time;
            
            // Add the message to the array
            messages.push({
                sender,
                message,
                time,
                date: lastKnownDate
            });
        });
    });
    
    // Return only the last `limit` messages
    return messages.slice(-limit);
}

async function activateConversation(participantName) {
    // Find all conversation cards
    const conversationCards = document.querySelectorAll('.msg-conversation-listitem');
    
    for (const card of conversationCards) {
        // Find the participant name element within each card
        const nameElement = card.querySelector('.msg-conversation-card__participant-names span');
        if (!nameElement) continue;
        
        const cardParticipantName = nameElement.textContent.trim();
        
        if (cardParticipantName === participantName) {
            console.log(`Found matching conversation for ${participantName}`);
            
            // Scroll the card into view (center of screen)
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Wait a bit for scrolling to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get the clickable element (the link inside the card)
            const clickableElement = card.querySelector('.msg-conversation-listitem__link');
            if (!clickableElement) {
                console.error('Could not find clickable element in conversation card');
                return false;
            }
            
            // Create and dispatch a proper click event
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                composed: true
            });
            
            // Dispatch the event
            clickableElement.dispatchEvent(clickEvent);
            
            // Wait for the conversation to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        }
    }
    
    console.error(`Could not find conversation for ${participantName}`);
    return false;
}

// Add the new CSS styles
const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .dm-template-btn {
        position: relative;
        overflow: hidden;
        background: #ffffff;
        color: rgb(0, 51, 204);
        border: 1px solid rgb(0, 51, 204);
        padding: 5px 10px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: normal;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        min-width: unset;
        text-align: center;
        transition: all 0.4s ease;
    }

    .dm-template-btn:hover {
        background: rgb(0, 51, 204);
        color: #ffffff;
    }

    .dm-template-btn:active {
        transform: scale(0.98);
    }

    .dm-template-btn::after {
        content: '';
        position: absolute;
        top: var(--y);
        left: var(--x);
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        opacity: 0;
    }

    .dm-template-btn.active::after {
        width: 200px;
        height: 200px;
        opacity: 1;
        transition: width 0.5s ease-out, height 0.5s ease-out, opacity 1s ease;
    }

    .dm-template-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
        background: #24268d;
        border: 1px solid #24268d;
        color: #ffffff;
    }

    .personal-dm-main-carousel {
        width: 100%;
        margin: 0 0 8px 0;
        padding: 2px;
        background-color: #f9f9f9;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
    }

    .personal-dm-carousel {
        position: relative;
        width: 400px;
        height: 30px;
        overflow: hidden;
        margin: 0 auto;
    }

    .carousel-slides {
        display: flex;
        width: ${personalDmConfigs.length * 400}px;
        height: 100%;
        transition: transform 0.3s ease;
    }

    .carousel-slide {
        width: 400px;
        height: 100%;
        display: flex;
        gap: 4px;
        padding: 0 20px;
        box-sizing: border-box;
        align-items: center;
    }

    .carousel-arrow {
        position: absolute;
        top: 0;
        height: 100%;
        width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(90deg, #0033cc, #6e2edc);
        color: white;
        cursor: pointer;
        z-index: 2;
        font-size: 12px;
    }

    .carousel-arrow.left {
        left: 0;
        border-radius: 4px 0 0 4px;
    }

    .carousel-arrow.right {
        right: 0;
        border-radius: 0 4px 4px 0;
    }

    .ai-loading-message {
        animation: pulse 1.5s infinite;
        font-size: 14px;
        margin: 10px 0;
    }
    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }

    .ai-loading-container {
        animation: fadeIn 0.3s ease-out;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f5f5f5;
        margin-bottom: 10px;
    }
    .ai-loading-message {
        font-size: 14px;
        color: #424242;
    }
    .stop-button:hover {
        background: #ffcdd2 !important;
    }
    `;
    document.head.appendChild(style);
};

// Create AgentLink Branding Footer
function createAgentLinkBranding() {
    const powered = document.createElement('div');
    powered.style.width = '100%';
    powered.style.borderTop = '1px solid #e5e7eb';
    powered.style.paddingTop = '8px';
    powered.style.display = 'flex';
    powered.style.alignItems = 'center';
    powered.style.justifyContent = 'center';
    powered.style.gap = '6px';
    powered.style.fontSize = '14px';
    powered.style.color = '#24268d';
    powered.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;background:linear-gradient(to right,#4d7cfe,#9f7aea);border-radius:5px;">
        <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none'>
        <path d='M12 8V4H8' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <rect width='16' height='12' x='4' y='8' rx='2' stroke='white' stroke-width='2'/>
        <path d='M2 14h2' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='M20 14h2' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='M15 13v2' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        <path d='M9 13v2' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
        </svg>
    </span>
    <span style="font-weight:500;">Powered by AgentLink</span>
    `;
    return powered;
}

// Loading Indicator
function createLoadingIndicator(buttons, container) {
    // Create abort controller for cancellation
    const abortController = new AbortController();
    let isCancelled = false;

    // Hide all buttons and show loading message with stop button
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'ai-loading-container';
    loadingContainer.style.display = 'flex';
    loadingContainer.style.alignItems = 'center';
    loadingContainer.style.justifyContent = 'space-between';
    loadingContainer.style.width = '100%';
    loadingContainer.style.padding = '10px';

    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'ai-loading-message';
    loadingMessage.textContent = '🤖 AgentLink is generating your message...';

    const stopButton = document.createElement('button');
    stopButton.className = 'stop-button';
    stopButton.innerHTML = '✕ Stop';
    stopButton.style.marginLeft = '10px';
    stopButton.style.padding = '3px 8px';
    stopButton.style.fontSize = '12px';
    stopButton.style.background = '#ffebee';
    stopButton.style.color = '#c62828';
    stopButton.style.border = '1px solid #ef9a9a';
    stopButton.style.borderRadius = '4px';
    stopButton.style.cursor = 'pointer';
    stopButton.style.transition = 'all 0.2s';

    stopButton.onmouseover = () => {
        stopButton.style.background = '#ffcdd2';
    };
    stopButton.onmouseout = () => {
        stopButton.style.background = '#ffebee';
    };

    stopButton.onclick = () => {
        isCancelled = true;
        abortController.abort();
        loadingMessage.textContent = '⏹️ Stopping generation...';
        stopButton.disabled = true;
    };

    loadingContainer.appendChild(loadingMessage);
    loadingContainer.appendChild(stopButton);

    // Hide all buttons
    buttons.forEach(btn => {
        btn.style.display = 'none';
    });

    // Insert loading container
    container.insertBefore(loadingContainer, container.firstChild);
    
    return { 
        loadingContainer, 
        loadingMessage, 
        stopButton, 
        abortController, 
        isCancelled 
    };
}

async function addPersonalDmButtons() {
    // Check if message box exists
    const messageFormContainer = document.querySelector('.msg-form__msg-content-container');
    if (!messageFormContainer) return;

    // Check if we already added the carousel
    if (document.querySelector('.personal-dm-main-carousel')) return;

    // Get Personal DM configs from storage
    const { personalDmConfigs = [] } = await new Promise(resolve => {
        chrome.storage.local.get(['personalDmConfigs'], resolve);
    });

    if (personalDmConfigs.length === 0) return;

    // Add styles if not already added
    if (!document.querySelector('style[data-dm-buttons]')) {
        addStyles();
    }

    // Constants for layout
    const CAROUSEL_WIDTH = 400;
    const BUTTONS_PER_SLIDE = 3;
    const BUTTON_MIN_WIDTH = 40;
    const ARROW_WIDTH = 20;

    let isAnyButtonProcessing = false;

    // Create the main container
    const mainCarouselContainer = document.createElement('div');
    mainCarouselContainer.className = 'personal-dm-main-carousel';

    // Create carousel
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'personal-dm-carousel';

    // Slides container
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'carousel-slides';
    slidesContainer.style.width = `${Math.ceil(personalDmConfigs.length / BUTTONS_PER_SLIDE) * CAROUSEL_WIDTH}px`;

    // Navigation arrows
    const createArrow = (direction) => {
        const arrow = document.createElement('div');
        arrow.innerHTML = direction === 'left' ? '&lt;' : '&gt;';
        arrow.className = `carousel-arrow ${direction}`;
        return arrow;
    };

    const leftArrow = createArrow('left');
    const rightArrow = createArrow('right');

    // Carousel state
    let currentSlide = 0;
    
    // Calculate slides count
    const slidesCount = Math.ceil(personalDmConfigs.length / BUTTONS_PER_SLIDE);
    
    // Create slides
    for (let i = 0; i < slidesCount; i++) {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        
        // Add buttons
        personalDmConfigs.slice(i * BUTTONS_PER_SLIDE, (i + 1) * BUTTONS_PER_SLIDE)
            .forEach(config => {
                const button = document.createElement('button');
                button.className = 'dm-template-btn';
                button.textContent = config.name || config.label || 'Template';
                button.setAttribute('data-original-text', config.name);

                // Add ripple effect
                button.addEventListener('click', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    this.style.setProperty('--x', x + 'px');
                    this.style.setProperty('--y', y + 'px');
                    
                    this.classList.add('active');
                    
                    setTimeout(() => {
                        this.classList.remove('active');
                    }, 1000);
                });

                button.addEventListener('click', async () => {
                    if (button.disabled || isAnyButtonProcessing) return;
                    
                    isAnyButtonProcessing = true;
                    button.disabled = true;
                    
                    try {
                        const activeConversation = document.querySelector('.msg-conversation-listitem--active');
                        const participantName = activeConversation?.querySelector('.msg-conversation-card__participant-names span')?.textContent.trim();
                        
                        if (!participantName) {
                            updateLiveLog('Please select a conversation first', 0);
                            return;
                        }
                        
                        // Show loading indicator
                        const buttons = Array.from(slide.querySelectorAll('.dm-template-btn'));
                        const { loadingContainer, loadingMessage, stopButton, abortController, isCancelled } = 
                            createLoadingIndicator(buttons, slide);
                        
                        try {
                            updateLiveLog('Generating AI message', 2);
                            // Extract the last 5 messages from the conversation
                            const lastMessages = extractMessages(5);

                            const response = await chrome.runtime.sendMessage({
                                action: "generatePersonalDm",
                                participantData: { participantName, lastMessages },
                                config,
                                aiSettings: await getAISettings(),
                                signal: abortController.signal
                            });
                            
                            if (isCancelled) {
                                loadingMessage.textContent = '❌ Generation cancelled';
                                return;
                            }
                            
                            if (!response?.message) throw new Error('Empty response');
                            
                            await simulatePasting(response.message);
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            loadingMessage.textContent = '✅ Message ready to send!';
                            stopButton.style.display = 'none';
                        } catch (error) {
                            if (error.name === 'AbortError') {
                                loadingMessage.textContent = '❌ Generation cancelled';
                            } else {
                                console.error(error);
                                loadingMessage.textContent = `❌ Error: ${error.message}`;
                                updateLiveLog(`Error: ${error.message}`, 0);
                            }
                        } finally {
                            // Remove loading container after delay
                            setTimeout(() => {
                                slide.removeChild(loadingContainer);
                                buttons.forEach(btn => {
                                    btn.style.display = '';
                                });
                            }, 2000);
                        }
                        
                        updateLiveLog('Message ready to send!', 1);
                    } catch (error) {
                        console.error(error);
                        updateLiveLog(`Error: ${error.message}`, 0);
                    } finally {
                        isAnyButtonProcessing = false;
                        button.disabled = false;
                    }
                });

                slide.appendChild(button);
            });
        
        slidesContainer.appendChild(slide);
    }
    
    // Navigation functions
    const updateCarousel = () => {
        slidesContainer.style.transform = `translateX(-${currentSlide * CAROUSEL_WIDTH}px)`;
        leftArrow.style.visibility = currentSlide > 0 ? 'visible' : 'hidden';
        rightArrow.style.visibility = currentSlide < slidesCount - 1 ? 'visible' : 'hidden';
    };
    
    leftArrow.addEventListener('click', () => {
        if (currentSlide <= 0) return;
        currentSlide--;
        updateCarousel();
    });
    
    rightArrow.addEventListener('click', () => {
        if (currentSlide >= slidesCount - 1) return;
        currentSlide++;
        updateCarousel();
    });

    // Assemble carousel
    carouselContainer.appendChild(slidesContainer);
    carouselContainer.appendChild(leftArrow);
    carouselContainer.appendChild(rightArrow);
    mainCarouselContainer.appendChild(carouselContainer);

    // Add AgentLink branding
    mainCarouselContainer.appendChild(createAgentLinkBranding());

    // Insert into DOM - above message box
    const messageForm = document.querySelector('.msg-form__contenteditable')?.closest('.msg-form__msg-content-container');
    if (messageForm) {
        messageForm.parentNode.insertBefore(mainCarouselContainer, messageForm);
    }
}

// Improved initialization with better observer logic
function initDmButtons() {
    // Clean up any existing observers first
    if (window.dmButtonObserver) {
        window.dmButtonObserver.disconnect();
    }

    // Add buttons immediately if conditions are met
    addPersonalDmButtons();

    // Set up a more precise observer
    window.dmButtonObserver = new MutationObserver((mutations) => {
        // Check if message form appeared
        const messageFormAdded = mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.classList?.contains('msg-form__contenteditable')
            )
        );
        
        // Check if our carousel exists
        const carouselExists = document.querySelector('.personal-dm-main-carousel');

        if (messageFormAdded && !carouselExists) {
            addPersonalDmButtons();
        }
    });

    // Observe only specific parts of the DOM
    const composeArea = document.querySelector('.msg-form') || document.body;
    window.dmButtonObserver.observe(composeArea, {
        childList: true,
        subtree: true
    });
}

// Start the functionality
async function getAISettings() {
    return new Promise(resolve => {
        chrome.storage.local.get(['aiSettings'], (result) => {
            resolve(result.aiSettings || {});
        });
    });
}

// Function to paste text directly into the message box
async function simulatePasting(text) {
    const messageBox = document.querySelector('.msg-form__contenteditable');
    const placeholder = document.querySelector('.msg-form__placeholder');
    
    if (!messageBox) {
        console.error('Message box not found.');
        return Promise.reject('Message box not found.');
    }

    messageBox.focus();
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Clear any existing content
    messageBox.innerHTML = '<p></p>';
    let p = messageBox.querySelector('p');
    if (!p) {
        p = document.createElement('p');
        messageBox.appendChild(p);
    }
    
    // Insert the full text at once
    p.textContent = text;

    // Dispatch input event to trigger any listeners
    const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true,
    });
    messageBox.dispatchEvent(inputEvent);

    // Optional: Add a small delay to make it seem more natural
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return Promise.resolve('Pasting complete');
}

// Load the live log script
function loadLiveLogScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('livelog.js');
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load live log script'));
        document.body.appendChild(script);
    });
}

// Function to check if we're on LinkedIn messaging page
function isMessagingPage() {
    return window.location.href.startsWith('https://www.linkedin.com/messaging/');
}


// ✅ Your participant click handler
const msgList = document.querySelector('.scaffold-layout__list.msg__list');

if (msgList && !msgList.classList.contains('listener-attached')) {
    msgList.classList.add('listener-attached');

    msgList.addEventListener('click', function(e) {
        const participantItem = e.target.closest('li');

        if (participantItem) {
            const nameHeading = participantItem.querySelector('h3.msg-conversation-listitem__participant-names');
            if (nameHeading) {
                const nameSpan = nameHeading.querySelector('span.truncate');
                if (nameSpan) {
                    const name = nameSpan.innerText.trim();
                    if (name && !name.toLowerCase().includes("status is offline")) {
                        console.log("Participant clicked::", name);
                    }
                }
            }
        }
    });
}

main();

// Modify your existing MutationObserver to handle this
let lastUrl = window.location.href;
new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
        const wasOnMessagingPage = lastUrl.startsWith('https://www.linkedin.com/messaging/');
        const isNowOnMessagingPage = window.location.href.startsWith('https://www.linkedin.com/messaging/');
        lastUrl = window.location.href;
        
        if (isNowOnMessagingPage) {
            // Live log will be recreated when main() runs again
        } else {
            removeLiveLogElements(); // Remove live log when navigating away
        }
    }
}).observe(document, {subtree: true, childList: true});

