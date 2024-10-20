export const apiKey = '211234567bd755484f4e7ab6778eea1f';

export async function fetchWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('City not found');
    }
    return await response.json();
}

export function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    const themeToggle = document.getElementById('theme-toggle-btn');
    updateThemeIcon(themeToggle);
}

export function updateThemeIcon(themeToggle) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDarkMode ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
}

export function showLoading(loadingSpinner) {
    loadingSpinner.classList.remove('hidden');
}

export function hideLoading(loadingSpinner) {
    loadingSpinner.classList.add('hidden');
}

export function showError(errorMessage, weatherCard, message) {
    console.error('Error:', message);
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    if (weatherCard) {
        weatherCard.classList.add('hidden');
    }
}

export function convertTemperature(temp, unit) {
    if (unit === 'imperial') {
        return (temp * 9/5) + 32;
    }
    return temp;
}

export function getWindSpeedUnit(unit) {
    return unit === 'metric' ? 'm/s' : 'mph';
}

export function convertWindSpeed(speed, unit) {
    return unit === 'metric' ? speed : speed * 2.237;
}

export function setLastSearchedCity(city) {
    localStorage.setItem('lastSearchedCity', city);
}

export function getLastSearchedCity() {
    return localStorage.getItem('lastSearchedCity');
}