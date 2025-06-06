document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = "eb1c8d917d29c2821e3e18861fd22266";

    const cityInput = document.getElementById('city-input');
    const searchButton = document.getElementById('search-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageElement = document.getElementById('error-message');
    const weatherDisplayContainer = document.querySelector('.weather-dashboard');

    const currentDatetimeElement = document.getElementById('current-datetime');
    const currentTemperatureElement = document.getElementById('current-temperature');
    const currentWeatherIcon = document.getElementById('current-weather-icon');
    const currentDescriptionElement = document.getElementById('current-description');
    const currentHumidityElement = document.getElementById('current-humidity');
    const currentWindSpeedElement = document.getElementById('current-wind-speed');

    const forecastCardsGrid = document.getElementById('forecast-cards-grid');

    const graphDot = document.querySelector('.temperature-graph-placeholder .dot');
    const graphTempLabel = document.querySelector('.temperature-graph-placeholder .temp-label');

    const tempToggle = document.getElementById('temp-toggle');
    let currentTemperatureFahrenheit = null;
    let currentTemperatureCelsius = null;
    let currentUnitIsFahrenheit = true;

    function toggleLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
            errorMessageElement.classList.add('hidden');
            searchButton.disabled = true;
            cityInput.disabled = true;
            document.querySelector('.current-weather-details').classList.add('hidden');
            document.querySelector('.forecast-container').classList.add('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
            searchButton.disabled = false;
            cityInput.disabled = false;
            if (errorMessageElement.classList.contains('hidden')) {
                document.querySelector('.current-weather-details').classList.remove('hidden');
                document.querySelector('.forecast-container').classList.remove('hidden');
            }
        }
    }

    function displayError(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.classList.remove('hidden');
        document.querySelector('.current-weather-details').classList.add('hidden');
        document.querySelector('.forecast-container').classList.add('hidden');
    }

    function clearDisplay() {
        errorMessageElement.classList.add('hidden');
        document.querySelector('.current-weather-details').classList.add('hidden');
        document.querySelector('.forecast-container').classList.add('hidden');
        forecastCardsGrid.innerHTML = '';
        currentTemperatureFahrenheit = null;
        currentTemperatureCelsius = null;
    }

    function formatDateTime(timestamp) {
        const date = new Date(timestamp * 1000);
        const options = {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        return date.toLocaleString('en-US', options).replace(/, (\d{4})/, ' , $1');
    }

    function formatForecastDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleString('en-US', options);
    }

    function fahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * 5 / 9;
    }

    async function fetchWeatherData(city) {
        clearDisplay();
        toggleLoading(true);

        try {
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=imperial`;
            const currentResponse = await fetch(currentWeatherUrl);
            if (!currentResponse.ok) {
                const errorData = await currentResponse.json();
                throw new Error(errorData.message || `HTTP error! Status: ${currentResponse.status}`);
            }
            const currentData = await currentResponse.json();

            currentTemperatureFahrenheit = Math.round(currentData.main.temp);
            currentTemperatureCelsius = Math.round(fahrenheitToCelsius(currentData.main.temp));

            displayCurrentWeather(currentData, currentUnitIsFahrenheit);

            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=imperial`;
            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) {
                const errorData = await forecastResponse.json();
                throw new Error(errorData.message || `HTTP error! Status: ${forecastResponse.status}`);
            }
            const forecastData = await forecastResponse.json();
            displayForecast(forecastData);

            weatherDisplayContainer.classList.add('fade-in');

        } catch (error) {
            if (error.message.includes("404")) {
                displayError(`City "${city}" not found. Please check the spelling and try again.`);
            } else if (error.message.includes("401")) {
                displayError("Invalid API key. Please ensure your OpenWeatherMap API key is correct and activated. New keys can take a few hours to become active.");
            } else {
                displayError(`Could not retrieve weather data: ${error.message}. Please check your internet connection or try again.`);
            }
        } finally {
            toggleLoading(false);
            if (errorMessageElement.classList.contains('hidden')) {
                document.querySelector('.current-weather-details').classList.remove('hidden');
                document.querySelector('.forecast-container').classList.remove('hidden');
            }
        }
    }

    function displayCurrentWeather(data, isFahrenheit) {
        currentDatetimeElement.textContent = formatDateTime(data.dt);
        const tempToDisplay = isFahrenheit ? currentTemperatureFahrenheit : currentTemperatureCelsius;
        const unitSymbol = isFahrenheit ? '°F' : '°C';

        currentTemperatureElement.textContent = `${tempToDisplay}${unitSymbol}`;
        currentWeatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        currentWeatherIcon.alt = data.weather[0].description;
        currentDescriptionElement.textContent = data.weather[0].description;
        currentHumidityElement.textContent = data.main.humidity;
        currentWindSpeedElement.textContent = (data.wind.speed * 2.237).toFixed(1);

        graphTempLabel.textContent = `${tempToDisplay}${unitSymbol}`;
    }

    function displayForecast(data) {
        forecastCardsGrid.innerHTML = '';

        const dailyForecasts = [];
        const uniqueDates = new Set();

        for (const item of data.list) {
            const date = new Date(item.dt * 1000);
            const dateString = date.toLocaleDateString();
            if (!uniqueDates.has(dateString) && date.getHours() >= 12 && date.getHours() <= 15) {
                dailyForecasts.push(item);
                uniqueDates.add(dateString);
            }
            if (dailyForecasts.length >= 5) break;
        }

        if (dailyForecasts.length < 5) {
            const fallbackDailyForecasts = [];
            const fallbackUniqueDates = new Set();
            for (const item of data.list) {
                const date = new Date(item.dt * 1000);
                const dateString = date.toLocaleDateString();
                if (!fallbackUniqueDates.has(dateString)) {
                    fallbackDailyForecasts.push(item);
                    fallbackUniqueDates.add(dateString);
                }
                if (fallbackDailyForecasts.length >= 5) break;
            }
            dailyForecasts.length = 0;
            dailyForecasts.push(...fallbackDailyForecasts);
        }

        dailyForecasts.slice(0, 5).forEach((item, index) => {
            const date = new Date(item.dt * 1000);
            const isToday = date.toDateString() === new Date().toDateString();
            const dayLabel = isToday ? 'Today' : formatForecastDate(item.dt);

            const tempF = Math.round(item.main.temp);
            const tempC = Math.round(fahrenheitToCelsius(item.main.temp));

            const forecastCard = `
                <div class="forecast-card" data-temp-f="${tempF}" data-temp-c="${tempC}">
                    <p class="font-semibold text-gray-700">${dayLabel}</p>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="Weather Icon" class="w-16 h-16">
                    <p class="font-bold text-lg text-blue-600">
                        <span class="forecast-temp-value">${currentUnitIsFahrenheit ? tempF : tempC}</span>
                        <span class="forecast-temp-unit">${currentUnitIsFahrenheit ? '°F' : '°C'}</span>
                    </p>
                    <p class="text-sm text-gray-600">Humidity</p>
                    <p class="font-bold text-lg text-blue-600"><span class="forecast-humidity-value">${Math.round(item.main.humidity)}</span>%</p>
                </div>
            `;
            forecastCardsGrid.insertAdjacentHTML('beforeend', forecastCard);
        });
    }

    searchButton.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
            tempToggle.checked = false;
            currentUnitIsFahrenheit = true;
        } else {
            displayError("Please enter a city name.");
        }
    });

    cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    tempToggle.addEventListener('change', () => {
        currentUnitIsFahrenheit = !tempToggle.checked;

        if (currentTemperatureFahrenheit !== null) {
            const dataPlaceholder = {
                dt: Date.now() / 1000,
                weather: [{ icon: currentWeatherIcon.src.split('/').pop().replace('@2x.png', ''), description: currentWeatherIcon.alt }],
                main: {
                    temp: currentUnitIsFahrenheit ? currentTemperatureFahrenheit : currentTemperatureCelsius,
                    humidity: currentHumidityElement.textContent,
                },
                wind: {
                    speed: currentWindSpeedElement.textContent,
                }
            };
            displayCurrentWeather(dataPlaceholder, currentUnitIsFahrenheit);
        }

        document.querySelectorAll('.forecast-card').forEach(card => {
            const tempValueSpan = card.querySelector('.forecast-temp-value');
            const tempUnitSpan = card.querySelector('.forecast-temp-unit');
            const tempF = parseFloat(card.dataset.tempF);
            const tempC = parseFloat(card.dataset.tempC);

            if (currentUnitIsFahrenheit) {
                tempValueSpan.textContent = tempF;
                tempUnitSpan.textContent = '°F';
            } else {
                tempValueSpan.textContent = tempC;
                tempUnitSpan.textContent = '°C';
            }
        });
    });

    fetchWeatherData("London");
});
