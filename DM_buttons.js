// ================= DM_buttons.js =================

class DMMessageButtons {
    constructor() {
        this.processedMessageBoxes = new WeakSet();
        this.observer = null;
        this.initObserver();
        this.initStyles();
    }

    initStyles() {
        if (document.getElementById('dm-button-styles')) return;

        const style = document.createElement('style');
        style.id = 'dm-button-styles';
        style.textContent = `
            .dm-buttons-container {
                border: 1px solid #24268d;
                border-radius: 12px;
                padding: 10px;
                margin: 16px 0;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                box-shadow: 0 0 8px rgba(100, 149, 237, 0.2);
                overflow-x: auto;
                background: #ffffff;
                justify-content: flex-start;
            }

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

            .powered-by {
                width: 100%;
                border-top: 1px solid #e5e7eb;
                padding-top: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                font-size: 14px;
                color: #24268d;
            }
        `;
        document.head.appendChild(style);
    }

    createAgentLinkBranding() {
        const powered = document.createElement('div');
        powered.className = 'powered-by';
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

    createLoadingIndicator(button) {
        const originalText = button.textContent;
        button.textContent = 'Generating...';
        button.disabled = true;

        return {
            restore: () => {
                button.textContent = originalText;
                button.disabled = false;
            }
        };
    }

    async injectButtons(messageContainer) {
        if (this.processedMessageBoxes.has(messageContainer)) return;
        this.processedMessageBoxes.add(messageContainer);

        if (messageContainer.querySelector('.dm-buttons-container')) return;

        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'dm-buttons-container';

        const { buttonConfigs = [] } = await new Promise(resolve => {
            chrome.storage.local.get(['buttonConfigs'], resolve);
        });

        if (buttonConfigs.length === 0) return;

        buttonConfigs.forEach(config => {
            const btn = document.createElement('button');
            btn.className = 'dm-template-btn';
            btn.textContent = config.name || config.label || 'Template';
            btn.setAttribute('data-original-text', config.name);

            // Add ripple effect
            btn.addEventListener('click', function(e) {
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

            btn.addEventListener('click', async (e) => {
                if (btn.disabled) return;
                
                const loading = this.createLoadingIndicator(btn);
                
                try {
                    const profileData = await gatherCompleteProfileData();
                    const aiSettings = await getAISettings();

                    const response = await chrome.runtime.sendMessage({
                        action: "generateMessage",
                        profileData,
                        config,
                        aiSettings
                    });

                    if (response?.message) {
                        const messageBox = messageContainer.querySelector('.msg-form__contenteditable[contenteditable="true"]');
                        if (messageBox) {
                            messageBox.innerHTML = '';
                            document.execCommand("insertText", false, response.message);
                            messageBox.dispatchEvent(new Event("input", { bubbles: true }));
                        }
                    }
                } catch (err) {
                    console.error('Error generating AI message:', err);
                } finally {
                    loading.restore();
                }
            });

            buttonWrapper.appendChild(btn);
        });

        buttonWrapper.appendChild(this.createAgentLinkBranding());

        messageContainer.parentNode.insertBefore(buttonWrapper, messageContainer.nextSibling);
    }

    initObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const messageContainer = node.querySelector('.msg-form__msg-content-container') || 
                                               node.closest('.msg-form__msg-content-container');
                        if (messageContainer) {
                            this.injectButtons(messageContainer);
                        }
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Process existing message containers
        document.querySelectorAll('.msg-form__msg-content-container').forEach(container => {
            this.injectButtons(container);
        });
    }
}

// Reused from 1st_DM.js
async function getAISettings() {
    const { aiSettings = {} } = await chrome.storage.local.get(['aiSettings']);
    return aiSettings;
}

// Simplified version of gatherCompleteProfileData from 1st_DM.js
async function gatherCompleteProfileData() {
    return {
        name: document.querySelector('h1')?.innerText.trim() || 'Name not found',
        designation: document.querySelector('.text-body-medium.break-words')?.innerText.trim() || 'Designation not found',
        location: document.querySelector('span.text-body-small.inline.t-black--light.break-words')?.innerText.trim() || 'Location not found',
        about: document.querySelector('#about')?.innerText.trim() || ''
    };
}

// Initialize when on LinkedIn
if (window.location.hostname.includes('linkedin.com')) {
    new DMMessageButtons();
}