(function () {
    // --- Global Variables and Initial State ---
    let totalWaterOz = 0; // Track water in ounces
    let lastDrinkTime = 'Never';

    // --- Weather Widget Configuration (using weather.gov API) ---
    const station1 = 'KDMA';
    const station2 = 'QHVA3';

    // Function to dynamically load Font Awesome CSS from CDN
    function loadFontAwesome() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        if (!document.querySelector('link[href*="font-awesome"]')) {
            document.head.appendChild(link);
        }
    }
    loadFontAwesome();

    /**
     * Fetches weather properties for a given station ID.
     * @param {string} stationId - The ID of the weather station.
     * @returns {Promise<object>} - A promise that resolves to the weather properties.
     */
    async function fetchStationProps(stationId) {
        const url = `https://api.weather.gov/stations/${stationId}/observations/latest`;
        console.log(`Attempting to fetch from: ${url}`); // DEBUG: Log URL
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'MyRiseCourse/1.0 (your.email@example.com)' // IMPORTANT: Replace with your actual email
                }
            });
            console.log(`Fetch response status for ${stationId}: ${response.status}`); // DEBUG: Log response status
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP Error for ${stationId}: ${response.status} - ${response.statusText}`, errorText);
                throw new Error(`Failed to fetch data from weather.gov for ${stationId}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log(`Successfully fetched data for ${stationId}:`, data);
            return data.properties;
        } catch (error) {
            console.error(`Network or fetch error for ${stationId}:`, error);
            throw error;
        }
    }

    /**
     * Sets the content of an element with an icon.
     * @param {HTMLElement} element - The HTML element to update.
     * @param {string} iconClass - The Font Awesome icon class (e.g., "fa-wind").
     * @param {string} textContent - The text content to display.
     */
    function setElementContentWithIcon(element, iconClass, textContent) {
        element.innerHTML = `<i class="fas ${iconClass}"></i> ${textContent}`;
    }

    /**
     * Creates a warning element with specified formatting and reason.
     * @param {string} reasonText - The reason for the warning (e.g., "High winds").
     * @param {string} mainWarning - The main warning text.
     * @param {string} [hikersShouldContentHtml] - Optional HTML for the "Hikers should:" section (e.g., <ul><li>...</li></ul>).
     * @returns {HTMLElement} - The created warning div.
     */
    function createWarning(reasonText, mainWarning, hikersShouldContentHtml = '') {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'weather-warning';

        let content = `<p><strong>⚠️ ${reasonText}:</strong> ${mainWarning}</p>`;
        if (hikersShouldContentHtml) {
            content += `<p><strong>Hikers should:</strong></p>${hikersShouldContentHtml}`;
        }
        warningDiv.innerHTML = content;
        return warningDiv;
    }

    /**
     * Fetches and displays current weather conditions and generates warnings for the custom widget.
     */
    async function getWeather() {
        const weatherModal = document.getElementById('weatherModal');
        if (!weatherModal) {
            console.error("Weather modal not found when trying to getWeather().");
            return;
        }

        const warningsContainer = weatherModal.querySelector("#warnings-container");
        const mainTemp = weatherModal.querySelector("#main-temp");
        const descriptionText = weatherModal.querySelector("#description-text");
        const weatherMainIcon = weatherModal.querySelector("#weather-main-icon");
        const windSpeedEl = weatherModal.querySelector("#wind-speed");
        const humidityEl = weatherModal.querySelector("#humidity");
        const barometerEl = weatherModal.querySelector("#barometer");

        // Set loading state
        if (warningsContainer) warningsContainer.innerHTML = '';
        if (mainTemp) mainTemp.textContent = "Loading...";
        if (descriptionText) descriptionText.textContent = "";

        if (weatherMainIcon) {
            weatherMainIcon.src = "https://placehold.co/60x60/CCCCCC/666666?text=Loading";
            weatherMainIcon.alt = "Loading weather icon";
            weatherMainIcon.style.display = 'block';
        }

        if (windSpeedEl) setElementContentWithIcon(windSpeedEl, "fa-wind", "N/A");
        if (humidityEl) setElementContentWithIcon(humidityEl, "fa-tint", "N/A");
        if (barometerEl) setElementContentWithIcon(barometerEl, "fa-gauge-high", "N/A");


        try {
            const primaryProps = await fetchStationProps(station1);
            console.log("Weather.gov API Response (Primary Station Properties):", primaryProps);

            let tempC = primaryProps.temperature?.value;
            let humidity = primaryProps.relativeHumidity?.value;
            let windSpeed = primaryProps.windSpeed?.value;
            let barometricPressure = primaryProps.barometricPressure?.value;
            let heatIndexC = primaryProps.heatIndex?.value;

            if (tempC === null || humidity === null || windSpeed === null || barometricPressure === null) {
                console.warn("Primary station missing critical values. Fetching fallback data...");
                const fallbackProps = await fetchStationProps(station2);
                console.log("Weather.gov API Response (Fallback Station Properties):", fallbackProps);

                if (tempC === null) tempC = fallbackProps.temperature?.value;
                if (humidity === null) humidity = fallbackProps.relativeHumidity?.value;
                if (windSpeed === null) windSpeed = fallbackProps.windSpeed?.value;
                if (barometricPressure === null) barometricPressure = fallbackProps.barometricPressure?.value;
                if (heatIndexC === null) heatIndexC = fallbackProps.heatIndex?.value;
            }

            const tempF = tempC !== null && tempC !== undefined ? (tempC * 9 / 5) + 32 : null;
            const windSpeedMph = windSpeed !== null && windSpeed !== undefined ? (windSpeed * 2.23694).toFixed(0) : null;

            if (mainTemp) mainTemp.textContent = tempF !== null ? `${tempF}°F` : `N/A`;

            const descriptionTextValue = primaryProps.textDescription || "Conditions unknown";
            if (descriptionText) descriptionText.textContent = descriptionTextValue;

            if (weatherMainIcon) {
                const iconUrl = primaryProps.icon;
                if (iconUrl) {
                    weatherMainIcon.src = iconUrl;
                    weatherMainIcon.alt = primaryProps.textDescription || "Weather icon";
                    weatherMainIcon.style.display = 'block';
                    weatherMainIcon.onerror = () => {
                        weatherMainIcon.src = "https://placehold.co/60x60/FF0000/FFFFFF?text=Icon+Error";
                        weatherMainIcon.alt = "Error loading weather icon";
                        console.error("Failed to load weather icon from URL:", iconUrl);
                    };
                    console.log("Weather icon URL:", iconUrl);
                } else {
                    weatherMainIcon.src = "https://placehold.co/60x60/CCCCCC/666666?text=N/A";
                    weatherMainIcon.alt = "No weather icon available";
                    weatherMainIcon.style.display = 'block';
                }
            }

            if (windSpeedEl) setElementContentWithIcon(windSpeedEl, "fa-wind",
                windSpeedMph !== null ? `${windSpeedMph} mph` : `N/A`);

            if (humidityEl) setElementContentWithIcon(humidityEl, "fa-tint",
                humidity !== null ? `${humidity.toFixed(0)}%` : `N/A`);

            const barometricPressureInHg = barometricPressure !== null && barometricPressure !== undefined ? (barometricPressure * 0.0002953) : null;
            if (barometerEl) setElementContentWithIcon(barometerEl, "fa-gauge-high",
                barometricPressureInHg !== null ? `${barometricPressureInHg.toFixed(2)} inHg` : `N/A`);

            if (warningsContainer) {
                let hasWarnings = false;

                if (tempF !== null && tempF >= 77) {
                    hasWarnings = true;
                    const heatWarningHtml = `
                        <ul>
                          <li>Take frequent shade breaks</li>
                          <li>Reduce pace</li>
                          <li>Carry extra water</li>
                          <li>Consider turning back early</li>
                        </ul>
                    `;
                    const heatWarning = createWarning(
                        "High temperature",
                        "Heat exhaustion and dehydration risk are very high.",
                        heatWarningHtml
                    );
                    warningsContainer.appendChild(heatWarning);
                }

                if (humidity !== null && humidity <= 30) {
                    hasWarnings = true;
                    const humidityWarningHtml = `
                        <ul>
                          <li>Drink water early and often</li>
                          <li>Set hydration timers or milestone</li>
                          <li>Pair water with electrolytes</li>
                          <li>Cover skin and use a hat or bandana</li>
                        </ul>
                    `;
                    const humidityWarning = createWarning(
                        "Low humidity",
                        "Sweat evaporates quickly, leading to rapid dehydration.",
                        humidityWarningHtml
                    );
                    warningsContainer.appendChild(humidityWarning);
                }

                if (windSpeedMph !== null && parseInt(windSpeedMph) >= 20) {
                    hasWarnings = true;
                    const windWarningHtml = `
                        <ul>
                          <li>Drink water early and often</li>
                          <li>Set hydration timers or milestone</li>
                          <li>Pair water with electrolytes</li>
                          <li>Cover skin and use a hat or bandana</li>
                        </ul>
                    `;
                    const windWarning = createWarning(
                        "High winds",
                        "Speeds up evaporation and increases water needs.",
                        windWarningHtml
                    );
                    warningsContainer.appendChild(windWarning);
                }

                if (primaryProps.pressureTrend) {
                    const trend = primaryProps.pressureTrend.value;
                    let barometerWarningMainText = '';
                    let barometerReasonText = '';
                    let barometerHikersShouldHtml = '';

                    if (trend === "steady") {
                        // No warning for steady, just informational
                    } else if (trend === "rising" || trend === "falling") {
                        hasWarnings = true;
                        barometerReasonText = "Unsteady barometer";
                        barometerWarningMainText = `An unsteady reading means there's a weather shift coming.`;
                        barometerHikersShouldHtml = `
                            <ul>
                              <li>Consider turning back early.</li>
                            </ul>
                        `;
                    }
                    if (barometerWarningMainText) {
                        const barometerWarning = createWarning(barometerReasonText, barometerWarningMainText, barometerHikersShouldHtml);
                        warningsContainer.appendChild(barometerWarning);
                    }
                }

                if (!hasWarnings && warningsContainer.innerHTML === '') {
                    const noWarningMessage = createWarning(
                        "All clear!",
                        "Looks like the weather's just fine! Enjoy your hike!",
                        ''
                    );
                    warningsContainer.appendChild(noWarningMessage);
                }
            }

        } catch (error) {
            console.error("Error fetching weather data:", error);
            if (descriptionText) descriptionText.textContent = "Unable to load weather.";
            if (mainTemp) mainTemp.textContent = "N/A";
            if (weatherMainIcon) {
                weatherMainIcon.src = "https://placehold.co/60x60/FF0000/FFFFFF?text=Error";
                weatherMainIcon.alt = "Error loading weather icon";
                weatherMainIcon.style.display = 'block';
            }
            if (warningsContainer) warningsContainer.innerHTML = '';
            const errorMessage = createWarning(
                "Error",
                "Failed to load weather data. Please try again later.",
                ''
            );
            if (warningsContainer) warningsContainer.appendChild(errorMessage);
        }
    }

    /**
     * Displays a custom alert message as a modal (replaces browser's alert()).
     * This uses the same modal structure as the main modals for consistency.
     * @param {string} message - The message to display.
     */
    function alertMessage(message) {
        let modalOverlay = document.getElementById('custom-alert-modal-overlay');
        let modalContent = document.getElementById('custom-alert-modal-content');
        let modalMessage = document.getElementById('custom-alert-message');

        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'custom-alert-modal-overlay';
            modalOverlay.className = 'modal';
            document.body.appendChild(modalOverlay);

            modalContent = document.createElement('div');
            modalContent.id = 'custom-alert-modal-content';
            modalContent.className = 'modal-content';
            modalOverlay.appendChild(modalContent);

            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.innerHTML = '&times;';
            closeButton.onclick = () => modalOverlay.style.display = 'none';
            modalContent.appendChild(closeButton);

            modalMessage = document.createElement('p');
            modalMessage.id = 'custom-alert-message';
            modalContent.appendChild(modalMessage);

            modalOverlay.addEventListener('click', (event) => {
                if (event.target === modalOverlay) {
                    modalOverlay.style.display = 'none';
                }
            });
        }
        modalMessage.innerText = message;
        modalOverlay.style.display = 'flex';
    }

    /**
     * Updates the displayed water intake statistics.
     * Formats the last drink time to HH:MM AM/PM.
     */
    const updateWaterStatsDisplay = () => {
        const totalWaterDisplay = document.getElementById('totalWaterDisplay');
        const lastDrinkDisplay = document.getElementById('lastDrinkDisplay');

        if (totalWaterDisplay) totalWaterDisplay.textContent = `${totalWaterOz.toFixed(1)} oz`;
        if (lastDrinkDisplay) {
            if (lastDrinkTime !== 'Never') {
                lastDrinkDisplay.textContent = new Date(lastDrinkTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s*(a\.m\.|p\.m\.)/i, (match) => match.replace(/\./g, ''));
            } else {
                lastDrinkDisplay.textContent = 'Never';
            }
        }
    };

    /**
     * Attaches event listeners for the water action button's hold logic.
     * @param {HTMLElement} waterActionButton
     * @param {HTMLElement} intakeFeedback
     */
    function attachWaterActionButtonLogic(waterActionButton, intakeFeedback) {
        let holdTimeout;
        let messageTimeout5s;
        let messageTimeout10s;
        const holdDuration = 15000;
        const intakeAmountOz = 0.1;
        let feedbackTimeout;
        const originalButtonText = "HOLD WHILE DRINKING WATER";

        waterActionButton.addEventListener('mousedown', (event) => {
            event.preventDefault();
            waterActionButton.classList.add('is-holding');
            waterActionButton.querySelector('span').textContent = originalButtonText;
            clearTimeout(feedbackTimeout);
            clearTimeout(messageTimeout5s);
            clearTimeout(messageTimeout10s);
            intakeFeedback.classList.remove('show');

            messageTimeout5s = setTimeout(() => {
                waterActionButton.querySelector('span').textContent = "KEEP GOING!";
            }, 5000);

            messageTimeout10s = setTimeout(() => {
                waterActionButton.querySelector('span').textContent = "ALMOST THERE!";
            }, 10000);

            holdTimeout = setTimeout(() => {
                totalWaterOz += intakeAmountOz;
                lastDrinkTime = new Date();
                updateWaterStatsDisplay();

                intakeFeedback.innerHTML = `<i class="fas fa-arrow-up mr-1"></i>+${intakeAmountOz.toFixed(1)}oz`;
                intakeFeedback.classList.add('show');
                feedbackTimeout = setTimeout(() => {
                    intakeFeedback.classList.remove('show');
                }, 5000);

                waterActionButton.classList.remove('is-holding');
                waterActionButton.querySelector('span').textContent = originalButtonText;
            }, holdDuration);
        });

        const releaseHold = (event) => {
            if (event) event.preventDefault();
            clearTimeout(holdTimeout);
            clearTimeout(messageTimeout5s);
            clearTimeout(messageTimeout10s);
            waterActionButton.classList.remove('is-holding');
            waterActionButton.querySelector('span').textContent = originalButtonText;
        };

        waterActionButton.addEventListener('mouseup', releaseHold);
        waterActionButton.addEventListener('mouseleave', releaseHold);
        waterActionButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            waterActionButton.classList.add('is-holding');
            waterActionButton.querySelector('span').textContent = originalButtonText;
            clearTimeout(feedbackTimeout);
            clearTimeout(messageTimeout5s);
            clearTimeout(messageTimeout10s);
            intakeFeedback.classList.remove('show');

            messageTimeout5s = setTimeout(() => {
                waterActionButton.querySelector('span').textContent = "KEEP GOING!";
            }, 5000);

            messageTimeout10s = setTimeout(() => {
                waterActionButton.querySelector('span').textContent = "ALMOST THERE!";
            }, 10000);

            holdTimeout = setTimeout(() => {
                totalWaterOz += intakeAmountOz;
                lastDrinkTime = new Date();
                updateWaterStatsDisplay();

                intakeFeedback.innerHTML = `<i class="fas fa-arrow-up mr-1"></i>+${intakeAmountOz.toFixed(1)}oz`;
                intakeFeedback.classList.add('show');
                feedbackTimeout = setTimeout(() => {
                    intakeFeedback.classList.remove('show');
                }, 5000);

                waterActionButton.classList.remove('is-holding');
                waterActionButton.querySelector('span').textContent = originalButtonText;
            }, holdDuration);
        });
        waterActionButton.addEventListener('touchend', releaseHold);
        waterActionButton.addEventListener('touchcancel', releaseHold);
    }

    // --- Modal Creation Functions ---

    /**
     * Creates and appends the Water modal to the document body.
     */
    function createWaterModal() {
        if (document.getElementById('waterModal')) return;

        const waterModal = document.createElement('div');
        waterModal.id = 'waterModal';
        waterModal.className = 'modal';
        waterModal.innerHTML = `
            <div class="modal-content">
                <button class="close-button">&times;</button>
                <h2>Your Water Intake</h2>
                <div class="text-lg mb-4 stats-line">
                    <span><b class="font-bold">Total:</b> <span id="totalWaterDisplay">0.0 oz</span>
                    <span id="intakeFeedback" class="intake-feedback">
                        <i class="fas fa-arrow-up mr-1"></i>+0.1oz
                    </span></span>
                    <span><b class="font-bold">Last drink:</b> <span id="lastDrinkDisplay">Never</span></span>
                </div>
                <button type="button" class="box" id="waterActionButton">
                    <span>HOLD WHILE DRINKING WATER</span>
                    <i></i>
                </button>
                <p class="text-lg mt-4">You lose almost a quart of water every hour.<br>Stay hydrated!</p>
                <p class="text-sm mt-2">This assumes you drink 0.1 oz every 15 seconds. Real measures may vary, so keep a more accurate record of your water intake using your bottles.</p>
            </div>
        `;
        document.body.appendChild(waterModal);

        const waterActionButton = document.getElementById('waterActionButton');
        const closeWaterModalButton = waterModal.querySelector('.close-button');
        const intakeFeedback = document.getElementById('intakeFeedback');

        closeWaterModalButton.addEventListener('click', () => {
            waterModal.style.display = 'none';
            if (waterActionButton) waterActionButton.classList.remove('is-holding');
            if (intakeFeedback) intakeFeedback.classList.remove('show');
            if (waterActionButton && waterActionButton.querySelector('span')) {
                waterActionButton.querySelector('span').textContent = "HOLD WHILE DRINKING WATER";
            }
        });

        waterModal.addEventListener('click', (event) => {
            if (event.target === waterModal) {
                waterModal.style.display = 'none';
                if (waterActionButton) waterActionButton.classList.remove('is-holding');
                if (intakeFeedback) intakeFeedback.classList.remove('show');
                if (waterActionButton && waterActionButton.querySelector('span')) {
                    waterActionButton.querySelector('span').textContent = "HOLD WHILE DRINKING WATER";
                }
            }
        });

        if (waterActionButton && intakeFeedback) {
            attachWaterActionButtonLogic(waterActionButton, intakeFeedback);
        }
        updateWaterStatsDisplay();
    }

    /**
     * Creates and appends the Weather modal to the document body.
     */
    function createWeatherModal() {
        if (document.getElementById('weatherModal')) return;

        const weatherModal = document.createElement('div');
        weatherModal.id = 'weatherModal';
        weatherModal.className = 'modal';
        weatherModal.innerHTML = `
            <div class="modal-content">
                <button class="close-button">&times;</button>
                <div id="weather-widget">
                    <h2>Weather Report</h2>
                    <div class="main-weather-display">
                        <div class="weather-icon-main">
                            <img id="weather-main-icon" alt="Weather Icon" />
                        </div>
                        <div class="main-weather-info">
                            <div id="main-temp"></div>
                            <div id="description-text"></div>
                        </div>
                    </div>

                    <div class="secondary-observations">
                        <div id="wind-speed"></div>
                        <div id="humidity"></div>
                        <div id="barometer"></div>
                    </div>

                    <div class="divider"></div>

                    <div id="warnings-container"></div>
                </div>
            </div>
        `;
        document.body.appendChild(weatherModal);

        const closeWeatherModalButton = weatherModal.querySelector('.close-button');
        closeWeatherModalButton.addEventListener('click', () => {
            weatherModal.style.display = 'none';
        });
        weatherModal.addEventListener('click', (event) => {
            if (event.target === weatherModal) {
                weatherModal.style.display = 'none';
            }
        });
    }

    /**
     * Creates and appends the Wayfinder modal to the document body.
     */
    function createWayfinderModal() {
        if (document.getElementById('wayfinderModal')) return;

        const wayfinderModal = document.createElement('div');
        wayfinderModal.id = 'wayfinderModal';
        wayfinderModal.className = 'modal';
        wayfinderModal.innerHTML = `
            <div class="modal-content">
                <button class="close-button">&times;</button>
                <h2 class="text-2xl font-bold mb-4">Switch trail?</h2>
                <div class="cards-container">
                    <div class="card" data-trail-name="Sundance Loop" data-lesson-id="1cRvz-NayAzEEiEjd3Lw7r6NBuSo1NOd">
                        <img class="img-icon" src="https://i.ibb.co/xSZZ14nB/sundance.png" alt="Sundance Loop Trail" onerror="this.onerror=null;this.src='https://placehold.co/50x50/d7cfcf/000000?text=IMG';">
                        <div class="textBox">
                            <div class="textContent">
                                <h1 class="h1">Sundance Loop</h1>
                                <span class="span">1 hour</span>
                            </div>
                            <p class="p">Beginner | 2.5 miles | &lt;300ft</p>
                        </div>
                    </div>

                    <div class="card" data-trail-name="Coyote Crush" data-lesson-id="kXGUJcMKOVZL5D-xuK_jwa94zk1dKxqa">
                        <img class="img-icon" src="https://i.ibb.co/WWyqTL3J/coyotecrush.png" alt="Coyote Crush Trail" onerror="this.onerror=null;this.src='https://placehold.co/50x50/d7cfcf/000000?text=IMG';">
                        <div class="textBox">
                            <div class="textContent">
                                <h1 class="h1">Coyote Crush</h1>
                                <span class="span">1.5 hours</span>
                            </div>
                            <p class="p">Family | 3+ miles | &lt;300ft</p>
                        </div>
                    </div>

                    <div class="card" data-trail-name="Hawkspur" data-lesson-id="Jdt1Nwo5OsHomYipfbHgJSs7X0XW7aD-">
                        <img class="img-icon" src="https://i.ibb.co/mF9LSt9V/hawkspur.png" alt="Hawkspur Trail" onerror="this.onerror=null;this.src='https://placehold.co/50x50/d7cfcf/000000?text=IMG';">
                        <div class="textBox">
                            <div class="textContent">
                                <h1 class="h1">Hawkspur</h1>
                                <span class="span">3+ hours</span>
                            </div>
                            <p class="p">Expert | 5+ miles | &gt;1,000ft</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wayfinderModal);

        const closeWayfinderModalButton = wayfinderModal.querySelector('.close-button');
        closeWayfinderModalButton.addEventListener('click', () => {
            wayfinderModal.style.display = 'none';
        });
        wayfinderModal.addEventListener('click', (event) => {
            if (event.target === wayfinderModal) {
                wayfinderModal.style.display = 'none';
            }
        });

        const cards = wayfinderModal.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const lessonId = card.dataset.lessonId;
                if (lessonId) {
                    // Attempt to find and click Rise's internal navigation link for the target lesson.
                    // This is the most reliable way to trigger Rise's internal routing logic.
                    const riseNavLink = document.querySelector(`a[href*="#/lessons/${lessonId}"]`);

                    if (riseNavLink) {
                        riseNavLink.click(); // Simulate a click on Rise's internal navigation link
                        console.log(`Navigating to lesson: ${lessonId} via internal Rise link click.`);
                    } else {
                        console.warn(`Rise tag bar: Could not find internal navigation link for lesson ID: ${lessonId}. Attempting direct hash change as fallback.`);
                        // Fallback: Directly change the URL hash. This might not always trigger
                        // Rise's internal routing completely, but is a backup.
                        window.location.hash = `#/lessons/${lessonId}`;
                    }
                } else {
                    alertMessage("Lesson ID not found for this trail.");
                }
                wayfinderModal.style.display = 'none'; // Close modal after selection
            });
        });
    }

    /**
     * Creates and appends the main FAB button and its options to the document body.
     */
    function createFabButtonAndOptions() {
        if (document.getElementById('fabContainer')) return;

        const fabContainer = document.createElement('div');
        fabContainer.id = 'fabContainer';
        fabContainer.className = 'fab-container';

        const fabOptions = document.createElement('div');
        fabOptions.id = 'fabOptions';
        fabOptions.className = 'fab-options';

        const weatherOption = document.createElement('button');
        weatherOption.id = 'weatherOption';
        weatherOption.className = 'fab-option-button';
        weatherOption.style.backgroundColor = '#D65F02';
        weatherOption.innerHTML = '<i class="fa-solid fa-cloud-sun" style="color: inherit;"></i>';
        fabOptions.appendChild(weatherOption);

        const locationOption = document.createElement('button');
        locationOption.id = 'locationOption';
        locationOption.className = 'fab-option-button';
        locationOption.style.backgroundColor = '#4D4318';
        locationOption.innerHTML = '<i class="fas fa-map-marker-alt" style="color: inherit;"></i>';
        fabOptions.appendChild(locationOption);

        const waterOption = document.createElement('button');
        waterOption.id = 'waterOption';
        waterOption.className = 'fab-option-button';
        waterOption.style.backgroundColor = '#9CBBCE';
        waterOption.innerHTML = '<i class="fas fa-tint" style="color: inherit;"></i>';
        fabOptions.appendChild(waterOption);

        const fabMainButton = document.createElement('button');
        fabMainButton.id = 'fabMainButton';
        fabMainButton.className = 'fab-main-button';
        fabMainButton.innerHTML = '<i class="fas fa-plus" style="color: inherit;"></i>';

        fabContainer.appendChild(fabOptions);
        fabContainer.appendChild(fabMainButton);
        document.body.appendChild(fabContainer);

        attachFabEventListeners(fabMainButton, fabOptions, weatherOption, waterOption, locationOption);
    }

    /**
     * Attaches event listeners to the FAB button and its options.
     * @param {HTMLElement} fabMainButton
     * @param {HTMLElement} fabOptions
     * @param {HTMLElement} weatherOption
     * @param {HTMLElement} waterOption
     * @param {HTMLElement} locationOption
     */
    function attachFabEventListeners(fabMainButton, fabOptions, weatherOption, waterOption, locationOption) {
        fabMainButton.addEventListener('click', () => {
            fabOptions.classList.toggle('active');
            fabMainButton.classList.toggle('active');
        });

        weatherOption.addEventListener('click', () => {
            const weatherModal = document.getElementById('weatherModal');
            weatherModal.style.display = 'flex';
            fabOptions.classList.remove('active');
            fabMainButton.classList.remove('active');
            getWeather();
        });

        waterOption.addEventListener('click', () => {
            document.getElementById('waterModal').style.display = 'flex';
            fabOptions.classList.remove('active');
            fabMainButton.classList.remove('active');
            updateWaterStatsDisplay();
        });

        locationOption.addEventListener('click', () => {
            document.getElementById('wayfinderModal').style.display = 'flex';
            fabOptions.classList.remove('active');
            fabMainButton.classList.remove('active');
        });
    }

    // --- Initialization on DOMContentLoaded ---
    setTimeout(() => {
        createWaterModal();
        createWeatherModal();
        createWayfinderModal();
        createFabButtonAndOptions();
    }, 500);

})();

(function () {
    const blockId = "cmd65zg1f00jc357dyq4nwycz";

    function redrawMightyCards() {
        const block = document.querySelector(`[data-block-id="${blockId}"]`);
        const containerParent = block?.querySelector(".blocks-button--right");
        if (!block || !containerParent || containerParent.querySelector(".mighty-card-row")) return;

        const containers = Array.from(containerParent.querySelectorAll(".blocks-button__container"));
        if (containers.length === 0) return;

        // 🔽 Define your image URLs in order (must match number of cards)
        const cardImages = [
            "https://i.ibb.co/jZRfpR9B/Chat-GPT-Image-Jul-16-2025-01-58-16-PM.png",// Card 1
            "https://i.ibb.co/snF6xtQ/Chat-GPT-Image-Jul-16-2025-02-13-47-PM.png",
            "https://i.ibb.co/twN92fNF/Chat-GPT-Image-Jul-16-2025-02-16-59-PM.png",
        ];

        const rowWrapper = document.createElement("div");
        Object.assign(rowWrapper.style, {
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            paddingLeft: "20px",
            paddingRight: "20px",
            margin: "0 auto",
            gap: "3rem"
        });
        rowWrapper.className = "mighty-card-row";

        containers.forEach((container, i) => {
            container.classList.add("mighty-card");
            container.setAttribute("data-card-index", i);

            Object.assign(container.style, {
                margin: "0",
                background: "#fff",
                borderRadius: "1rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: "0",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
            });

            const img = document.createElement("img");
            Object.assign(img, {
                src: cardImages[i] || cardImages[0], // fallback to first image if missing
                alt: `Card image ${i + 1}`
            });
            Object.assign(img.style, {
                width: "100%",
                borderTopLeftRadius: "1rem",
                borderTopRightRadius: "1rem",
                display: "block"
            });

            const contentWrapper = document.createElement("div");
            Object.assign(contentWrapper.style, {
                padding: "3rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.75rem"
            });

            while (container.firstChild) {
                contentWrapper.appendChild(container.firstChild);
            }

            const description = contentWrapper.querySelector(".blocks-button__description");
            if (description) description.style.paddingInlineEnd = "4rem";

            const button = contentWrapper.querySelector(".blocks-button__button");
            if (button) {
                Object.assign(button.style, {
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "0.45rem 1.25rem",
                    fontSize: "1.5rem",
                    borderRadius: "9999px",
                    textAlign: "center"
                });
            }

            container.innerHTML = "";
            container.appendChild(img);
            container.appendChild(contentWrapper);
            rowWrapper.appendChild(container);
        });

        containerParent.innerHTML = "";
        containerParent.appendChild(rowWrapper);

        applyResponsiveCardStyles();
    }

    // Initial render
    redrawMightyCards();

    // Watch for Rise block reloads
    const observer = new MutationObserver(() => {
        const block = document.querySelector(`[data-block-id="${blockId}"]`);
        const hasCards = block?.querySelectorAll(".blocks-button__container")?.length > 0;
        const hasRow = block?.querySelector(".mighty-card-row");

        if (block && !hasRow && hasCards) {
            redrawMightyCards();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();

(function () {
    // --- CONFIGURATION ---
    // This object will hold the navigation bar configurations for each lesson.
    // The KEY of each entry is the REFERENCE_BLOCK_ID for that specific lesson.
    // The VALUE is the array of TAGS (buttons) for that lesson's navigation bar.
    const LESSON_NAV_CONFIGS = {
        // --- Configuration for Lesson 1 (e.g., "Field Guide") ---
        "cmd6nwd6x009d35bo5rz2985v": [ // <--- REFERENCE_BLOCK_ID for Lesson 1
            { id: "nav-checklist-L1", label: "Gear", blockId: "cmd6nwd6x009d35bo5rz2985v" },
            { id: "nav-trail-hazards-L1", label: "Hazards", blockId: "cmd85civq00yw357estm4ib2k" },
            { id: "nav-health-hazards-L1", label: "Health", blockId: "cmd859vk000v3357e1ttekl2s" },
            { id: "nav-diagnose-L1", label: "Diagnose", blockId: "cmd6qs8dx00si357cnuw9r1pc" },
            { id: "nav-treatment-L1", label: "Treat", blockId: "cmd6qumhq00wq357ce6qll503" },
            { id: "nav-emergency-L1", label: "HELP!", blockId: "cmd8540tx00rh357eck5hxb14" }
        ],

        // --- Configuration for Lesson 2
        "oo4jTIDlKZN2OPv3amkr5UoUtGvtjK20": [ // <--- REFERENCE_BLOCK_ID for Lesson 2
            { id: "nav-checklist-L2", label: "Gear", blockId: "zUnO7mELQHHPa9d7WH77Rpcky94K6_X3" },
            { id: "nav-trail-hazards-L2", label: "Hazards", blockId: "NICUXp6XxNREGVqVw1YuI3MIrKzcZQX5" },
            { id: "nav-health-hazards-L2", label: "Health", blockId: "NCFmH_5iSAe_p2ZiJhXv3qbGjQ4uF00K" },
            { id: "nav-diagnose-L2", label: "Diagnose", blockId: "gk_h2_Q35QIg2UxOcf8ow9hjA81M3-BZ" },
            { id: "nav-treatment-L2", label: "Treat", blockId: "HLFOcGqf0bD912aG_meaiS85wC8QTO8o" },
            { id: "nav-emergency-L2", label: "HELP!", blockId: "_VLy-eG9zilMl-Ibzjo5IS8Y1mjgGAON" }
        ],

        // --- Configuration for Lesson 3
        "-1-M1zzNOakUXqjKMXKRrmy7LppEo-u8": [ // <--- REFERENCE_BLOCK_ID for Lesson 3
            { id: "nav-checklist-L3", label: "Gear", blockId: "MaSge_QCBsAVOdiLdvjM-hULNI9CMKpx" },
            { id: "nav-trail-hazards-L3", label: "Hazards", blockId: "nSyqkv4vIXkqwNL7SKMFw-eFwmXDbGIJ" },
            { id: "nav-health-hazards-L3", label: "Health", blockId: "TlyEpjwknO2BRtkgM5vFxXxHjKQdC4AN" },
            { id: "nav-diagnose-L3", label: "Diagnose", blockId: "B1lHv9AXiOG27h6pQvgfLIaFKGnpEKUH" },
            { id: "nav-treatment-L3", label: "Treat", blockId: "I-0EKA5iHV6Po1I_RTF-86H5CFzXi2y1" },
            { id: "nav-emergency-L3", label: "HELP!", blockId: "zcS1-EsymQceGsa5DUEk9CPgK8g0FqyD" }
        ]
    };

    let currentLessonTags = null; // Variable to store the TAGS array for the currently active lesson

    const createTagBar = () => {
        if (document.getElementById("rise-tag-bar")) {
            console.log("Rise Nav Bar: Bar already exists, skipping creation.");
            return;
        }

        if (!currentLessonTags || currentLessonTags.length === 0) {
            console.warn("Rise Nav Bar: No TAGS configured for the current lesson, cannot create bar. This might happen if a reference block is found but no config exists for it.");
            return;
        }

        console.log("Rise Nav Bar: Creating tag bar.");
        const bar = document.createElement("div");
        bar.id = "rise-tag-bar";
        bar.setAttribute("aria-label", "Lesson Section Navigation");

        // Use currentLessonTags to build the bar
        bar.innerHTML = currentLessonTags.map(
            tag => `<button class="tag-chip" data-block="${tag.blockId}" id="${tag.id}" aria-pressed="false">${tag.label}</button>`
        ).join("");

        document.body.prepend(bar);
        console.log("Rise Nav Bar: Tag bar appended to body.");

        // --- CRITICAL CHECK: Ensure buttons are found and listeners attached ---
        const navButtons = bar.querySelectorAll(".tag-chip");
        console.log(`Rise Nav Bar: Found ${navButtons.length} buttons in the new bar.`);

        if (navButtons.length === 0) {
            console.error("Rise Nav Bar: No tag chips found immediately after bar creation. Click events will not work.");
            return; // Exit if no buttons found to prevent further errors
        }

        navButtons.forEach((btn, index) => {
            btn.addEventListener("click", () => {
                const targetBlockId = btn.getAttribute("data-block");
                const targetElement = document.querySelector(`[data-block-id="${targetBlockId}"]`);

                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                    document.querySelectorAll("#rise-tag-bar .tag-chip").forEach(chip => chip.classList.remove("active"));
                    btn.classList.add("active");
                    console.log(`Rise Nav Bar: Scrolled to block: ${targetBlockId}`);
                } else {
                    console.warn(`Rise Nav Bar: Could not find block with ID: ${targetBlockId}.`);
                }
            });
            console.log(`Rise Nav Bar: Attached click listener to button ${index}: ${btn.id}`);
        });
        console.log("Rise Nav Bar: Click listeners attached to tag chips.");

        setupScrollSpy();
        setupKeyboardNav();
        console.log("Rise Nav Bar: Scroll spy and keyboard nav setup initiated.");
    };

    const removeTagBar = () => {
        const bar = document.getElementById("rise-tag-bar");
        if (bar) {
            console.log("Rise Nav Bar: Removing tag bar.");
            bar.remove();
            if (window._riseNavScrollSpyObserver) {
                window._riseNavScrollSpyObserver.disconnect();
                window._riseNavScrollSpyObserver = null; // Clear the reference
                console.log("Rise Nav Bar: Disconnected and cleared previous scroll spy observer.");
            }
        }
    };

    const setupScrollSpy = () => {
        const bar = document.getElementById("rise-tag-bar");
        if (!bar || !currentLessonTags || currentLessonTags.length === 0) {
            console.log("Rise Nav Bar: Scroll spy aborted, bar or tags not found for current lesson.");
            return;
        }

        if (window._riseNavScrollSpyObserver) {
            window._riseNavScrollSpyObserver.disconnect();
            console.log("Rise Nav Bar: Disconnecting previous scroll spy observer.");
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const activeId = entry.target.getAttribute("data-block-id");
                    document.querySelectorAll(".tag-chip").forEach(btn => {
                        if (btn.getAttribute("data-block") === activeId) {
                            btn.classList.add("active");
                            btn.setAttribute("aria-pressed", "true");
                        } else {
                            btn.classList.remove("active");
                            btn.setAttribute("aria-pressed", "false");
                        }
                    });
                }
            });
        }, {
            rootMargin: "0px 0px -70% 0px",
            threshold: 0
        });

        currentLessonTags.forEach(tag => {
            const el = document.querySelector(`[data-block-id="${tag.blockId}"]`);
            if (el) observer.observe(el);
        });
        console.log("Rise Nav Bar: Scroll spy observer set up.");
        window._riseNavScrollSpyObserver = observer;
    };

    const setupKeyboardNav = () => {
        const bar = document.getElementById("rise-tag-bar");
        if (!bar) {
            console.log("Rise Nav Bar: Keyboard nav aborted, bar not found.");
            return;
        }
        console.log("Rise Nav Bar: Setting up keyboard navigation listener.");

        bar.addEventListener("keydown", (e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
                return;
            }
            e.preventDefault();

            const chips = Array.from(bar.querySelectorAll(".tag-chip"));
            const activeChip = document.activeElement;
            const currentIndex = chips.indexOf(activeChip);

            if (currentIndex === -1) return;

            let nextIndex = 0;
            if (e.key === "ArrowRight") {
                nextIndex = (currentIndex === chips.length - 1) ? 0 : currentIndex + 1;
            } else if (e.key === "ArrowLeft") {
                nextIndex = (currentIndex === 0) ? chips.length - 1 : currentIndex - 1;
            }

            const nextChip = chips[nextIndex];
            if (nextChip) {
                nextChip.focus();
                nextChip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }
        });
        console.log("Rise Nav Bar: Keyboard nav listener attached.");
    };

    console.log("Rise Nav Bar: Setting up main MutationObserver for lesson changes.");
    const waitForLessonContent = new MutationObserver((mutationsList, observer) => {
        console.log("Rise Nav Bar: Main MutationObserver triggered.");

        let detectedReferenceBlockId = null;
        for (const refId in LESSON_NAV_CONFIGS) {
            if (document.querySelector(`[data-block-id="${refId}"]`)) {
                detectedReferenceBlockId = refId;
                break;
            }
        }

        const existingBar = document.getElementById("rise-tag-bar");

        if (detectedReferenceBlockId) {
            console.log(`Rise Nav Bar: Detected reference block ID: ${detectedReferenceBlockId}`);

            const newLessonTags = LESSON_NAV_CONFIGS[detectedReferenceBlockId];

            // Only re-create if the bar doesn't exist OR if the set of tags is different
            // The latter check prevents re-creation if user just scrolls within the same lesson
            // or if another mutation triggers the observer unnecessarily.
            if (!existingBar || JSON.stringify(newLessonTags) !== JSON.stringify(currentLessonTags)) {
                console.log("Rise Nav Bar: Reference block found. Recreating bar due to absence or new tags config.");
                removeTagBar(); // Ensure old one is completely gone first
                currentLessonTags = newLessonTags; // Update current tags
                createTagBar();
            } else {
                console.log("Rise Nav Bar: Reference block found and bar already present with correct config. No action needed.");
            }
        } else {
            // If NO configured reference block is found, ensure the bar is removed
            if (existingBar) {
                console.log("Rise Nav Bar: No configured reference block found and bar IS present. Removing bar.");
                removeTagBar();
            } else {
                console.log("Rise Nav Bar: No configured reference block found and bar NOT present. No action needed.");
            }
            currentLessonTags = null; // Clear tags when not in a configured lesson
        }
    });

    waitForLessonContent.observe(document.body, { childList: true, subtree: true });
    console.log("Rise Nav Bar: Main MutationObserver observing document.body.");

    // Initial check on page load
    let initialDetectedReferenceBlockId = null;
    for (const refId in LESSON_NAV_CONFIGS) {
        if (document.querySelector(`[data-block-id="${refId}"]`)) {
            initialDetectedReferenceBlockId = refId;
            break;
        }
    }

    if (initialDetectedReferenceBlockId) {
        console.log("Rise Nav Bar: Initial check found reference block. Attempting to create bar.");
        currentLessonTags = LESSON_NAV_CONFIGS[initialDetectedReferenceBlockId];
        createTagBar();
    } else {
        console.log("Rise Nav Bar: Initial check found no configured reference block.");
    }
})();

(function () {
    function setCustomFavicon() {
        // ✅ Remove existing favicons
        let existingIcons = document.querySelectorAll("link[rel~='icon']");
        existingIcons.forEach(icon => icon.parentNode.removeChild(icon));

        // ✅ Create a new favicon link
        let favicon = document.createElement("link");
        favicon.rel = "icon";
        favicon.href = "https://i.ibb.co/CpfqvpQn/LOGO-ccp-mark.png"; // Updated to your new image URL

        // ✅ Add the new favicon to the document head
        document.head.appendChild(favicon);
    }

    // ✅ Run immediately and also retry in case Rise loads slowly
    setCustomFavicon();
    setTimeout(setCustomFavicon, 2000);
})();

/**
 * Check out my video (https://youtu.be/8jC7QIv0Gdk) that talks about 
 * how to add anchor links within your Rise course.
 */
(() => {
    const observer = new MutationObserver(() => {
        const unmodifiedLinkSpan = document.querySelector(
            "a[href*='#anchor']:not([data-mighty-anchor-processed])"
        );

        if (unmodifiedLinkSpan) {
            setAnchorScrolling();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    function setAnchorScrolling() {
        const links = document.querySelectorAll(
            "a[href*='#anchor']:not([data-mighty-anchor-processed])"
        );

        for (const link of links) {
            link.setAttribute("data-mighty-anchor-processed", "");
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const anchorId = link.getAttribute("href").replace("#anchor/", "");
                const anchor = document.querySelector(
                    `.anchor-${anchorId}`
                );

                if (anchor) {
                    anchor.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            });
        }
    }

    setAnchorScrolling()
})();