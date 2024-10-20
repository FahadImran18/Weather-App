# Weather Dashboard

This project is a responsive and interactive weather dashboard application that allows users to search for weather information by city name. It features a modern design with dark mode support, unit conversion, and detailed weather visualizations.

## Features

- Search weather by city name
- Display current weather conditions including temperature, feels like temperature, humidity, and wind speed
- Toggle between Celsius and Fahrenheit
- Dark mode support
- Geolocation support to get weather for the user's current location
- Responsive design for mobile and desktop
- Interactive charts for temperature forecast and weather conditions
- Weather condition-based background images
- Data filtering and sorting options

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+)
- OpenWeatherMap API for weather data
- Remix Icon for icons

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/weather-dashboard.git
   ```

2. Navigate to the project directory:
   ```
   cd weather-dashboard
   ```

3. Open `index.html` in your web browser to view the application.

## Usage

1. Enter a city name in the search bar and press Enter or click the search button.
2. Click the "Use location" button to get weather for your current location (requires geolocation permission).
3. Toggle between Celsius and Fahrenheit using the temperature unit button.
4. Switch between light and dark mode using the theme toggle button.
5. Navigate to the Tables page to view detailed weather forecast and use the chatbot for weather-related queries.

## API Key

This project uses the OpenWeatherMap API. You need to sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/api) and replace the placeholder API key in the `shared.js` file:

```javascript
const apiKey = 'YOUR_API_KEY_HERE';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).