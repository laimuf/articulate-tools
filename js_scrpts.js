(function () {
    const tryClickContinueButton = () => {
        // This selector targets the button directly, regardless of its parent block ID.
        const continueButton = document.querySelector('button[data-continue-btn]');

        if (continueButton) {
            continueButton.click();
            console.log('Successfully clicked the Continue button.'); // For debugging
            return true;
        }
        return false;
    };

    window.addEventListener("message", (event) => {
        if (event.data === "trigger-continue-button") {
            // 1. Try clicking immediately
            if (tryClickContinueButton()) return;

            // 2. If the button is not immediately found (due to Rise loading), use MutationObserver
            const observer = new MutationObserver((mutationsList, observer) => {
                if (tryClickContinueButton()) {
                    // Stop observing once the button is successfully clicked
                    observer.disconnect();
                }
            });

            // Observe the entire document body for element changes
            observer.observe(document.body, { childList: true, subtree: true });
        }
    });
})();