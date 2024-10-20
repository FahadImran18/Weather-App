import {
    apiKey,
    fetchWeatherData,
    toggleTheme,
    updateThemeIcon,
    showLoading,
    hideLoading,
    showError,
    convertTemperature,
    getWindSpeedUnit,
    convertWindSpeed,
    getLastSearchedCity
} from './shared.js';

document.addEventListener('DOMContentLoaded', function() {
    const pageTransition = document.getElementById('page-transition');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const weatherTable = document.getElementById('weather-table');
    const weatherData = document.getElementById('weather-data');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const firstPageBtn = document.getElementById('first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const lastPageBtn = document.getElementById('last-page');
    const pageInfo = document.getElementById('page-info');
    const themeToggle = document.getElementById('theme-toggle-btn');
    const chatInput = document.getElementById('chat-input');
    const chatSubmit = document.getElementById('chat-submit');
    const chatMessages = document.getElementById('chat-messages');
    const filterSelect = document.getElementById('filter-select');
    const geolocationBtn = document.getElementById('geolocation-btn');
    const unitToggleBtn = document.getElementById('unit-toggle-btn');

    let currentCity = '';
    let forecastData = [];
    let originalForecastData = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    let currentUnit = localStorage.getItem('temperatureUnit') || 'metric';
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    updateThemeIcon(themeToggle);

    // Page transition
    setTimeout(() => {
        pageTransition.classList.remove('fade-enter');
        pageTransition.classList.add('fade-enter-active');
    }, 10);

    const lastSearchedCity = getLastSearchedCity();
    if (lastSearchedCity) {
        searchInput.value = lastSearchedCity;
        getWeatherData(lastSearchedCity);
    }

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const city = searchInput.value.trim();
        if (city) {
            currentCity = city;
            getWeatherData(city);
        }
    });

    themeToggle.addEventListener('click', toggleTheme);

    filterSelect.addEventListener('change', function() {
        applyFilter(this.value);
    });

    geolocationBtn.addEventListener('click', useGeolocation);
    unitToggleBtn.addEventListener('click', toggleTemperatureUnit);

    async function getWeatherData(city) {
        showLoading(loadingSpinner);
        try {
            const data = await fetchWeatherData(city);
            forecastData = data.list;
            originalForecastData = [...forecastData];
            displayWeatherData();
            weatherTable.classList.remove('hidden');
            errorMessage.classList.add('hidden');
        } catch (error) {
            showError(errorMessage, weatherTable, error.message);
        } finally {
            hideLoading(loadingSpinner);
        }
    }

    function displayWeatherData() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = forecastData.slice(startIndex, endIndex);

        weatherData.innerHTML = pageData.map(item => `
            <tr>
                <td>${new Date(item.dt * 1000).toLocaleString()}</td>
                <td>${convertTemperature(item.main.temp, currentUnit).toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'}</td>
                <td>${item.weather[0].description}</td>
                <td>${item.main.humidity}%</td>
                <td>${convertWindSpeed(item.wind.speed, currentUnit).toFixed(1)} ${getWindSpeedUnit(currentUnit)}</td>
            </tr>
        `).join('');

        updatePagination();
    }
    
    function updatePagination() {
        const totalPages = Math.ceil(forecastData.length / itemsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

        firstPageBtn.disabled = currentPage === 1;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        lastPageBtn.disabled = currentPage === totalPages;
    }

    firstPageBtn.addEventListener('click', () => {
        currentPage = 1;
        displayWeatherData();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayWeatherData();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < Math.ceil(forecastData.length / itemsPerPage)) {
            currentPage++;
            displayWeatherData();
        }
    });

    lastPageBtn.addEventListener('click', () => {
        currentPage = Math.ceil(forecastData.length / itemsPerPage);
        displayWeatherData();
    });

    // Chatbot functionality
    chatSubmit.addEventListener('click', handleChatSubmit);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleChatSubmit();
        }
    });

    async function handleChatSubmit() {
        const message = chatInput.value.trim();
        if (message) {
            addChatMessage(message, 'user');
            chatInput.value = '';

            if (isWeatherRelatedQuery(message)) {
                const cityName = extractCityName(message);
                if (cityName && cityName.toLowerCase() !== currentCity.toLowerCase()) {
                    try {
                        await getWeatherData(cityName);
                        currentCity = cityName;
                    } catch (error) {
                        console.error('Error fetching weather:', error);
                        addChatMessage("I apologize, but I'm having trouble retrieving the weather data for that city. Could you please try again or ask about a different city?", 'bot');
                        return;
                    }
                }
                const weatherResponse = await generateAIResponse(message, forecastData);
                addChatMessage(weatherResponse, 'bot');
            } else {
                addChatMessage("I apologize, but I'm specialized in weather-related queries. Is there any specific weather information you'd like to know about a particular city?", 'bot');
            }
        }
    }

    function addChatMessage(message, sender) {
        const messageElement = document.createElement('div');
        
        messageElement.classList.add('chat-message', sender);
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function isWeatherRelatedQuery(message) {
        const weatherKeywords = ['weather', 'temperature', 'forecast', 'rain', 'sunny', 'cloudy', 'wind', 'humidity', 'hot', 'cold', 'warm', 'chilly'];
        return weatherKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    function extractCityName(message) {
        const cityMatch = message.match(/(?:in|for|at)\s+([a-zA-Z\s]+)(?:\s|$)/i);
        return cityMatch ? cityMatch[1].trim() : null;
    }

    async function generateAIResponse(message, weatherData) {
        // This function simulates an AI-like response based on the weather data
        const city = extractCityName(message) || currentCity;
        const currentWeather = weatherData[0];
        const forecast = weatherData.slice(1, 6);

        let response = `Let me provide you with the weather information for ${city}. `;

        response += `Currently, it's ${convertTemperature(currentWeather.main.temp, currentUnit).toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'} with ${currentWeather.weather[0].description}. `;
        
        if (message.toLowerCase().includes('temperature')) {
            const minTemp = Math.min(...forecast.map(f => f.main.temp_min));
            const maxTemp = Math.max(...forecast.map(f => f.main.temp_max));
            response += `The temperature ranges from ${convertTemperature(minTemp, currentUnit).toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'} to ${convertTemperature(maxTemp, currentUnit).toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'} over the next few days. `;
        }

        if (message.toLowerCase().includes('rain') || message.toLowerCase().includes('umbrella')) {
            const rainyDays = forecast.filter(f => f.weather[0].main.toLowerCase().includes('rain')).length;
            response += rainyDays > 0 ? `There's a chance of rain on ${rainyDays} of the next 5 days, so you might want to keep an umbrella handy. ` : `Good news! No rain is expected in the next 5 days. `;
        }

        if (message.toLowerCase().includes('wind')) {
            const avgWindSpeed = (forecast.reduce((sum, f) => sum + f.wind.speed, 0) / forecast.length).toFixed(1);
            response += `The average wind speed for the upcoming days is ${convertWindSpeed(avgWindSpeed, currentUnit).toFixed(1)} ${getWindSpeedUnit(currentUnit)}. `;
        }

        response += `Is there anything specific about the weather in ${city} you'd like to know more about?`;

        return response;
    }

    function applyFilter(filter) {
        forecastData = [...originalForecastData];
        switch (filter) {
            case 'sort-asc':
                forecastData.sort((a, b) => a.main.temp - b.main.temp);
                break;
            case 'sort-desc':
                forecastData.sort((a, b) => b.main.temp - a.main.temp);
                break;
            case 'filter-rain':
                forecastData = forecastData.filter(item => item.weather[0].main.toLowerCase().includes('rain'));
                break;
            case 'highest-temp':
                const highestTemp = Math.max(...forecastData.map(item => item.main.temp));
                forecastData = forecastData.filter(item => item.main.temp === highestTemp);
                break;
        }
        currentPage = 1;
        displayWeatherData();
    }

    function useGeolocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                    const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const city = data[0].name;
                        searchInput.value = city;
                        getWeatherData(city);
                    }
                } catch (error) {
                    console.error("Error fetching city name:", error);
                    showError(errorMessage, weatherTable, "Unable to get your location. Please enter a city name.");
                }
            }, function(error) {
                console.error("Geolocation error:", error);
                showError(errorMessage, weatherTable, "Unable to get your location. Please enter a city name.");
            });
        } else {
            showError(errorMessage, weatherTable, "Geolocation is not supported by your browser. Please enter a city name.");
        }
    }

    function toggleTemperatureUnit() {
        currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
        localStorage.setItem('temperatureUnit', currentUnit);
        unitToggleBtn.textContent = currentUnit === 'metric' ? '°C / °F' : '°F / °C';
        if (forecastData.length > 0) {
            displayWeatherData();
        }
    }

    updateThemeIcon(themeToggle);
});