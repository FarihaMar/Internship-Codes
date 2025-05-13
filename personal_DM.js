class PersonalDMMessageButtons {
    constructor() {
        this.checkAndInject();
        this.observeUrlChanges();
    }

    // Detect when URL changes (LinkedIn uses SPA navigation)
    observeUrlChanges() {
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                if (window.location.pathname.startsWith('/messaging/')) {
                    this.checkAndInject();
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Try to find the message input and inject the button
    checkAndInject() {
        const interval = setInterval(() => {
            const messageBox = document.querySelector('[contenteditable="true"]');

            if (messageBox && !document.getElementById('insert-template-btn')) {
                const button = document.createElement('button');
                button.id = 'insert-template-btn';
                button.innerText = '💬 AI Template';
                button.style.margin = '8px';
                button.style.padding = '6px 10px';
                button.style.fontSize = '14px';
                button.style.border = '1px solid #0073b1';
                button.style.borderRadius = '4px';
                button.style.backgroundColor = '#eef3f8';
                button.style.cursor = 'pointer';

                button.addEventListener('click', () => {
                    this.insertTemplate(messageBox);
                });

                // Try to find a good place to inject the button
                const toolbar = messageBox.closest('[class*="msg-form"]');
                if (toolbar) {
                    toolbar.appendChild(button);
                    clearInterval(interval);
                }
            }
        }, 1000);
    }

    // Insert predefined message
    insertTemplate(messageBox) {
        const message = "Hi [Name], great to connect with you! Looking forward to learning more about your work.";
        messageBox.focus();
        document.execCommand('insertText', false, message);
    }
}

// Initialize only when on LinkedIn messaging page
if (window.location.hostname.includes('linkedin.com') && window.location.pathname.startsWith('/messaging/')) {
    window.addEventListener('load', () => {
        new PersonalDMMessageButtons();
    });
}
