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
    setLastSearchedCity,
    getLastSearchedCity
} from './shared.js';

document.addEventListener('DOMContentLoaded', function() {
    const pageTransition = document.getElementById('page-transition');
    const cityInput = document.getElementById('city-input');
    const searchForm = document.getElementById('search-form');
    const weatherCard = document.getElementById('weather-card');
    const themeToggle = document.getElementById('theme-toggle-btn');
    const geolocationBtn = document.getElementById('geolocation-btn');
    const unitToggleBtn = document.getElementById('unit-toggle-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');

    let temperatureChart, weatherConditionsChart, temperatureLineChart;
    let currentUnit = localStorage.getItem('temperatureUnit') || 'metric';
    let forecastData = [];
    let currentWeatherData = null;
    let currentCityName = '';

    // Set initial unit toggle button text
    unitToggleBtn.textContent = currentUnit === 'metric' ? '°C / °F' : '°F / °C';

    // Page transition animation
    setTimeout(() => {
        pageTransition.classList.remove('fade-enter');
        pageTransition.classList.add('fade-enter-active');
    }, 10);

    // Load last searched city
    const lastSearchedCity = getLastSearchedCity();
    if (lastSearchedCity) {
        cityInput.value = lastSearchedCity;
        getWeatherData(lastSearchedCity);
    }

    function isValidCityName(city) {
        return /^[a-zA-Z\s-]+$/.test(city);
    }

    // Set initial theme
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    updateThemeIcon(themeToggle);

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city && isValidCityName(city)) {
            getWeatherData(city);
        } else {
            showError(errorMessage, weatherCard, "Please enter a valid city name.");
        }
    });

    themeToggle.addEventListener('click', toggleTheme);

    geolocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    getWeatherDataByCoords(latitude, longitude);
                },
                error => {
                    let errorMsg;
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg = "Geolocation request denied. Please enable location services.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMsg = "Location information unavailable. Please try again.";
                            break;
                        case error.TIMEOUT:
                            errorMsg = "Location request timed out. Please try again.";
                            break;
                        default:
                            errorMsg = "An unknown error occurred while requesting location.";
                            break;
                    }
                    showError(errorMessage, weatherCard, errorMsg);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            showError(errorMessage, weatherCard, 'Geolocation is not supported by your browser');
        }
    });

    unitToggleBtn.addEventListener('click', function() {
        currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
        localStorage.setItem('temperatureUnit', currentUnit);
        unitToggleBtn.textContent = currentUnit === 'metric' ? '°C / °F' : '°F / °C';
        updateTemperatureDisplay();
    });

    async function getWeatherData(city) {
        showLoading(loadingSpinner);
        try {
            const data = await fetchWeatherData(city);
            currentWeatherData = data.list[0];
            currentCityName = data.city.name;
            setLastSearchedCity(currentCityName);
            displayWeather(currentWeatherData, currentCityName);
            processForecastData(data.list);
            updateCharts();
            weatherCard.classList.remove('hidden');
            errorMessage.classList.add('hidden');
        } catch (error) {
            showError(errorMessage, weatherCard, error.message);
        } finally {
            hideLoading(loadingSpinner);
        }
    }

    async function getWeatherDataByCoords(lat, lon) {
        showLoading(loadingSpinner);
        try {
            const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
            if (!response.ok) {
                throw new Error('Unable to fetch location data');
            }
            const [locationData] = await response.json();
            if (locationData) {
                const city = locationData.name;
                cityInput.value = city;
                getWeatherData(city);
            } else {
                throw new Error('No location found for these coordinates');
            }
        } catch (error) {
            showError(errorMessage, weatherCard, error.message);
            hideLoading(loadingSpinner);
        }
    }

    function displayWeather(data, cityName) {
        const { main, weather, wind } = data;
        const cityNameElement = document.getElementById('city-name');
        const weatherDescriptionElement = document.getElementById('weather-description');
        const temperatureElement = document.getElementById('temperature');
        const feelsLikeElement = document.getElementById('feels-like');
        const humidityElement = document.getElementById('humidity');
        const windSpeedElement = document.getElementById('wind-speed');
        const weatherTitleElement = document.getElementById('weather-title');

        if (cityNameElement) cityNameElement.textContent = cityName;
        if (weatherDescriptionElement) weatherDescriptionElement.textContent = weather[0].description;
        if (temperatureElement) temperatureElement.textContent = `${convertTemperature(main.temp, currentUnit).toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
        if (feelsLikeElement) feelsLikeElement.textContent = `${convertTemperature(main.feels_like, currentUnit).toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
        if (humidityElement) humidityElement.textContent = `${main.humidity}%`;
        if (windSpeedElement) windSpeedElement.textContent = `${convertWindSpeed(wind.speed, currentUnit).toFixed(1)} ${getWindSpeedUnit(currentUnit)}`;
        if (weatherTitleElement) weatherTitleElement.textContent = `Current Weather in ${cityName}`;

        const weatherCondition = weather[0].main.toLowerCase();
        weatherCard.style.backgroundImage = `url('images/${weatherCondition}.gif')`;
        weatherCard.style.backgroundSize = 'cover';
        weatherCard.style.backgroundPosition = 'center';
    }

    function processForecastData(data) {
        forecastData = data.filter((item, index) => index % 8 === 0).slice(0, 5);
    }

    function updateCharts() {
        updateTemperatureChart();
        updateWeatherConditionsChart();
        updateTemperatureLineChart();
    }

    function updateTemperatureChart() {
        const ctx = document.getElementById('temperature-chart').getContext('2d');
        if (temperatureChart) {
            temperatureChart.destroy();
        }
        temperatureChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: forecastData.map(day => new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: `Temperature (°${currentUnit === 'metric' ? 'C' : 'F'})`,
                    data: forecastData.map(day => convertTemperature(day.main.temp, currentUnit)),
                    backgroundColor: 'rgba(14, 165, 233, 0.6)',
                    borderColor: 'rgba(14, 165, 233, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    delay: (context) => context.dataIndex * 100
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: '5-Day Temperature Forecast'
                    }
                }
            }
        });
    }

    function updateWeatherConditionsChart() {
        const ctx = document.getElementById('weather-conditions-chart').getContext('2d');
        const weatherConditions = forecastData.map(day => day.weather[0].main);
        const conditionCounts = weatherConditions.reduce((acc, condition) => {
            acc[condition] = (acc[condition] || 0) + 1;
            return acc;
        }, {});

        if (weatherConditionsChart) {
            weatherConditionsChart.destroy();
        }
        weatherConditionsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(conditionCounts),
                datasets: [{
                    data: Object.values(conditionCounts),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    delay: (context) => context.dataIndex * 100
                },
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: 'Weather Conditions Distribution'
                    }
                }
            }
        });
    }

    function updateTemperatureLineChart() {
        const ctx = document.getElementById('temperature-line-chart').getContext('2d');
        if (temperatureLineChart) {
            temperatureLineChart.destroy();
        }
        temperatureLineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: forecastData.map(day => new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: `Temperature (°${currentUnit === 'metric' ? 'C' : 'F'})`,
                    data: forecastData.map(day => convertTemperature(day.main.temp, currentUnit)),
                    borderColor: 'rgba(14, 165, 233, 1)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    y: {
                        duration: 2000,
                        easing: 'easeOutBounce'
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: '5-Day Temperature Trend'
                    }
                }
            }
        });
    }

    function updateTemperatureDisplay() {
        if (currentWeatherData) {
            displayWeather(currentWeatherData, currentCityName);
            updateCharts();
        }
    }

    function updateChartsTheme() {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text');
        [temperatureChart, weatherConditionsChart, temperatureLineChart].forEach(chart => {
            if (chart) {
                chart.options.plugins.legend.labels.color = textColor;
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.y.ticks.color = textColor;
                chart.update();
            }
        });
    }
    
    document.getElementById('sort-asc').addEventListener('click', () => sortTemperatures('asc'));
    document.getElementById('sort-desc').addEventListener('click', () => sortTemperatures('desc'));
    document.getElementById('filter-rain').addEventListener('click', filterRainyDays);
    document.getElementById('highest-temp').addEventListener('click', showHighestTemperature);

    function sortTemperatures(order) {
        forecastData.sort((a, b) => order === 'asc' ? a.main.temp - b.main.temp : b.main.temp - a.main.temp);
        updateCharts();
    }

    function filterRainyDays() {
        const rainyDays = forecastData.filter(day => day.weather[0].main.toLowerCase().includes('rain'));
        if (rainyDays.length > 0) {
            forecastData = rainyDays;
            updateCharts();
        } else {
            alert('No rainy days in the forecast.');
        }
    }

    function showHighestTemperature() {
        const highestTemp = Math.max(...forecastData.map(day => day.main.temp));
        const highestTempDay = forecastData.find(day => day.main.temp === highestTemp);
        alert(`Highest temperature: ${convertTemperature(highestTemp, currentUnit).toFixed(1)}°${currentUnit === 'metric' ? 'C' : 'F'} on ${new Date(highestTempDay.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}`);
    }

    updateThemeIcon(themeToggle);
}); 