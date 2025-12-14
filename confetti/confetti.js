(function () {
    let confettiLoaded = false;

    function loadConfetti(callback) {
        if (confettiLoaded && window.confetti) {
            callback();
            return;
        }

        if (window.confetti) {
            confettiLoaded = true;
            callback();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';

        script.onload = function () {
            confettiLoaded = true;
            callback();
        }

            ;

        script.onerror = function () {
            console.error('Failed to load canvas-confetti library');
        }

            ;
        document.head.appendChild(script);
    }

    function fireConfetti() {
        const triggerConfetti = () => {
            // Check for reduced motion preference
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (prefersReducedMotion) {
                console.log('Confetti disabled due to user motion preferences');
                return;
            }

            if (typeof confetti === 'function') {
                window.confetti({
                    "particleCount": 100,
                    "spread": 70,
                    "startVelocity": 45,
                    "gravity": 0.8,
                    "scalar": 1,
                    "colors": ["#e7f4ea",
                        "#118c2f",
                        "#ffffff"
                    ],
                    "shapes": ["square",
                        "circle"

                    ],
                    "origin": {
                        "x": 0.5,
                        "y": 0.5
                    }
                });
            }
        }

            ;

        loadConfetti(triggerConfetti);
    }

    function attachConfettiEvents() {
        const blockId = 'cmizwc2ie00mg3b7ii9yajg5q'.trim();

        if (!blockId) {
            console.error('Block ID cannot be empty');
            return false;
        }

        const targetBlock = document.querySelector('[data-block-id="' + blockId + '"]');

        if (!targetBlock) {
            return false;
        }

        const buttons = targetBlock.querySelectorAll('button');

        if (buttons.length === 0) {
            console.warn('No buttons found in Rise block:', blockId);
            return false;
        }

        buttons.forEach(button => {
            if (button.hasAttribute('data-confetti-attached')) {
                return;
            }

            button.setAttribute('data-confetti-attached', 'true');

            button.addEventListener('click', function () {
                fireConfetti();
            });
        });

        console.log('Confetti attached to', buttons.length, 'button(s) in Rise block:', blockId);
        return true;
    }

    // Wait for the target block to appear using MutationObserver
    const observer = new MutationObserver(() => {
        if (attachConfettiEvents()) {
            observer.disconnect();
        }
    });

    // Try to attach immediately in case the block is already loaded
    if (!attachConfettiEvents()) {

        // If immediate attachment failed, start observing
        observer.observe(document.body, {
            childList: true, subtree: true
        });
    }
})();