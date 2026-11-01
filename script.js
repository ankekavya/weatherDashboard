// ==========================================
// SKYCAST WEATHER DASHBOARD 2.0
// Powered by Open-Meteo API
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // --------------------------------------
    // 1. GET HTML ELEMENTS
    // --------------------------------------

    const $ = function (id) {
        return document.getElementById(id);
    };

    const searchForm = $("searchForm");
    const cityInput = $("cityInput");
    const searchButton = $("searchButton");
    const locationButton = $("locationButton");
    const unitToggle = $("unitToggle");
    const statusMessage = $("statusMessage");

    let temperatureUnit = "celsius";
    let currentWeatherData = null;
    let activeLocation = null;


    // --------------------------------------
    // 2. SPECIAL LOCATION COORDINATES
    // --------------------------------------

    // These coordinates preserve your original
    // Pulivendula and HSR Layout functionality.

    const specialLocations = {

        "pulivendula": {
            name: "Pulivendula",
            country: "India",
            latitude: 14.41944,
            longitude: 78.22500
        },

        "pulivendla": {
            name: "Pulivendula",
            country: "India",
            latitude: 14.41944,
            longitude: 78.22500
        },

        "hsr layout": {
            name: "HSR Layout, Bengaluru",
            country: "India",
            latitude: 12.91162,
            longitude: 77.63886
        },

        "hsr layout, bengaluru": {
            name: "HSR Layout, Bengaluru",
            country: "India",
            latitude: 12.91162,
            longitude: 77.63886
        },

        "hsr layout, bangalore": {
            name: "HSR Layout, Bengaluru",
            country: "India",
            latitude: 12.91162,
            longitude: 77.63886
        }

    };


    // --------------------------------------
    // 3. STATUS MESSAGE
    // --------------------------------------

    function showStatus(message, type = "") {

        statusMessage.textContent = message;

        statusMessage.className = "status-message";

        if (type) {
            statusMessage.classList.add(type);
        }

    }


    // --------------------------------------
    // 4. WEATHER CONDITION INFORMATION
    // --------------------------------------

    function getWeatherInfo(code, isDay = true) {

        const weatherConditions = {

            0: {
                condition: "Clear Sky",
                icon: isDay ? "☀️" : "🌙"
            },

            1: {
                condition: "Mostly Clear",
                icon: isDay ? "🌤️" : "🌙"
            },

            2: {
                condition: "Partly Cloudy",
                icon: "⛅"
            },

            3: {
                condition: "Overcast",
                icon: "☁️"
            },

            45: {
                condition: "Foggy",
                icon: "🌫️"
            },

            48: {
                condition: "Depositing Rime Fog",
                icon: "🌫️"
            },

            51: {
                condition: "Light Drizzle",
                icon: "🌦️"
            },

            53: {
                condition: "Moderate Drizzle",
                icon: "🌦️"
            },

            55: {
                condition: "Heavy Drizzle",
                icon: "🌧️"
            },

            56: {
                condition: "Freezing Drizzle",
                icon: "🌧️"
            },

            57: {
                condition: "Heavy Freezing Drizzle",
                icon: "🌧️"
            },

            61: {
                condition: "Light Rain",
                icon: "🌦️"
            },

            63: {
                condition: "Moderate Rain",
                icon: "🌧️"
            },

            65: {
                condition: "Heavy Rain",
                icon: "🌧️"
            },

            66: {
                condition: "Freezing Rain",
                icon: "🌧️"
            },

            67: {
                condition: "Heavy Freezing Rain",
                icon: "🌧️"
            },

            71: {
                condition: "Light Snow",
                icon: "🌨️"
            },

            73: {
                condition: "Moderate Snow",
                icon: "❄️"
            },

            75: {
                condition: "Heavy Snow",
                icon: "❄️"
            },

            77: {
                condition: "Snow Grains",
                icon: "❄️"
            },

            80: {
                condition: "Light Rain Showers",
                icon: "🌦️"
            },

            81: {
                condition: "Moderate Rain Showers",
                icon: "🌧️"
            },

            82: {
                condition: "Violent Rain Showers",
                icon: "⛈️"
            },

            85: {
                condition: "Light Snow Showers",
                icon: "🌨️"
            },

            86: {
                condition: "Heavy Snow Showers",
                icon: "❄️"
            },

            95: {
                condition: "Thunderstorm",
                icon: "⛈️"
            },

            96: {
                condition: "Thunderstorm with Hail",
                icon: "⛈️"
            },

            99: {
                condition: "Heavy Thunderstorm with Hail",
                icon: "⛈️"
            }

        };

        return weatherConditions[code] || {
            condition: "Unknown Weather",
            icon: "🌡️"
        };

    }


    // --------------------------------------
    // 5. TEMPERATURE CONVERSION
    // --------------------------------------

    function formatTemperature(value) {

        if (value === null || value === undefined ||
            !Number.isFinite(Number(value))) {

            return "--°";

        }

        let temperature = Number(value);

        if (temperatureUnit === "fahrenheit") {

            temperature = (temperature * 9 / 5) + 32;

        }

        return Math.round(temperature) + "°";

    }


    // --------------------------------------
    // 6. FORMAT DATE AND TIME
    // --------------------------------------

    function formatDate(dateString) {

        const date = new Date(dateString + "T12:00:00");

        return date.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "short"
        });

    }


    function formatHour(timeString) {

        const parts = timeString.split("T");

        if (!parts[1]) return timeString;

        const [hours, minutes] = parts[1].split(":");

        let hour = Number(hours);

        const period = hour >= 12 ? "PM" : "AM";

        hour = hour % 12 || 12;

        return hour + ":" + minutes + " " + period;

    }


    function formatSunTime(timeString) {

        if (!timeString) return "--:--";

        return formatHour(timeString);

    }


    // --------------------------------------
    // 7. FIND CITY USING GEOCODING API
    // --------------------------------------

    async function findLocation(city) {

        const normalizedCity = city
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        // Check custom locations first.

        if (specialLocations[normalizedCity]) {

            return specialLocations[normalizedCity];

        }


        // Search Open-Meteo Geocoding API.

        const geocodingURL =
            "https://geocoding-api.open-meteo.com/v1/search?" +
            "name=" + encodeURIComponent(city) +
            "&count=10&language=en&format=json";


        const response = await fetch(geocodingURL);

        if (!response.ok) {

            throw new Error("Unable to search for this location.");

        }


        const data = await response.json();

        if (!data.results || data.results.length === 0) {

            throw new Error(
                "City not found! Please check the spelling."
            );

        }


        // Prefer an exact city-name match.

        const searchName = normalizedCity.split(",")[0].trim();

        const exactMatches = data.results.filter(function (place) {

            return place.name.toLowerCase() === searchName;

        });

        // Prefer Indian results when names are duplicated.

        const location =
            exactMatches.find(function (place) {
                return place.country_code === "IN";
            }) ||
            exactMatches[0] ||
            data.results.find(function (place) {
                return place.country_code === "IN";
            }) ||
            data.results[0];


        return {

            name: location.name,

            country: location.country || "Unknown",

            latitude: location.latitude,

            longitude: location.longitude,

            timezone: location.timezone

        };

    }


    // --------------------------------------
    // 8. GET WEATHER FROM OPEN-METEO API
    // --------------------------------------

    async function fetchWeather(location) {

        const parameters = new URLSearchParams({

            latitude: location.latitude,

            longitude: location.longitude,

            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "weather_code",
                "pressure_msl",
                "wind_speed_10m"
            ].join(","),

            hourly: [
                "temperature_2m",
                "weather_code",
                "precipitation_probability",
                "visibility",
                "uv_index"
            ].join(","),

            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "sunrise",
                "sunset",
                "uv_index_max",
                "precipitation_probability_max",
                "wind_speed_10m_max"
            ].join(","),

            forecast_days: "7",

            timezone: "auto",

            wind_speed_unit: "kmh"

        });


        const weatherURL =
            "https://api.open-meteo.com/v1/forecast?" +
            parameters.toString();


        const response = await fetch(weatherURL);

        if (!response.ok) {

            throw new Error("Unable to retrieve weather information.");

        }


        const data = await response.json();

        if (!data.current || !data.hourly || !data.daily) {

            throw new Error("Weather data is incomplete.");

        }

        return data;

    }


    // --------------------------------------
    // 9. LOAD CITY WEATHER
    // --------------------------------------

    async function loadCity(city) {

        if (!city.trim()) {

            showStatus("Please enter a city name.", "error");

            return;

        }

        searchButton.disabled = true;

        searchButton.textContent = "Loading...";

        showStatus("Searching for " + city + "...");


        try {

            const location = await findLocation(city);

            await loadWeather(location);

        } catch (error) {

            showStatus(error.message, "error");

        } finally {

            searchButton.disabled = false;

            searchButton.textContent = "Search";

        }

    }


    // --------------------------------------
    // 10. LOAD WEATHER USING COORDINATES
    // --------------------------------------

    async function loadWeather(location) {

        showStatus("Fetching live weather information...");

        try {

            const weatherData = await fetchWeather(location);

            activeLocation = location;

            currentWeatherData = weatherData;

            displayWeather(weatherData, location);

            showStatus(
                "Weather updated successfully for " + location.name + ".",
                "success"
            );

        } catch (error) {

            showStatus(error.message, "error");

        }

    }


    // --------------------------------------
    // 11. DISPLAY ALL WEATHER INFORMATION
    // --------------------------------------

    function displayWeather(data, location) {

        const current = data.current;

        const hourly = data.hourly;

        const daily = data.daily;


        // CITY DETAILS

        $("cityName").textContent = location.name;

        $("countryName").textContent = location.country;

        $("currentDate").textContent =
            formatDate(current.time.split("T")[0]);


        // WEATHER CONDITION

        const weatherInfo = getWeatherInfo(
            current.weather_code,
            current.is_day === 1
        );


        // CURRENT TEMPERATURE

        $("temperature").textContent =
            formatTemperature(current.temperature_2m);


        $("weatherCondition").textContent =
            weatherInfo.condition;


        $("weatherIcon").textContent =
            weatherInfo.icon;


        $("feelsLike").textContent =
            "Feels like " +
            formatTemperature(current.apparent_temperature);


        // HIGH AND LOW

        $("tempHigh").textContent =
            formatTemperature(daily.temperature_2m_max[0]);


        $("tempLow").textContent =
            formatTemperature(daily.temperature_2m_min[0]);


        // WEATHER SUMMARY

        $("weatherSummary").textContent =
            "Current conditions in " + location.name;


        $("lastUpdated").textContent =
            "Updated " + formatHour(current.time);


        // OTHER WEATHER DETAILS

        $("humidity").textContent =
            current.relative_humidity_2m + "%";


        $("windSpeed").textContent =
            Math.round(current.wind_speed_10m);


        $("windUnit").textContent =
            "km/h";


        $("pressure").textContent =
            Math.round(current.pressure_msl);


        $("highlightFeelsLike").textContent =
            formatTemperature(current.apparent_temperature);


        // Find the closest available hourly values.

        const hourIndex = getCurrentHourIndex(
            hourly.time,
            current.time
        );


        const visibilityValue =
            hourly.visibility[hourIndex];

        if (visibilityValue !== undefined &&
            visibilityValue !== null) {

            $("visibility").textContent =
                (visibilityValue / 1000).toFixed(1) + " km";

        } else {

            $("visibility").textContent = "--";

        }


        // UV INDEX

        const uvValue = hourly.uv_index[hourIndex];

        $("uvIndex").textContent =
            uvValue !== undefined && uvValue !== null
                ? Number(uvValue).toFixed(1)
                : "--";


        $("uvDescription").textContent =
            getUVDescription(uvValue);


        // FORECASTS

        displayHourlyForecast(hourly, current.time);

        displayWeeklyForecast(daily);


        // SUNRISE AND SUNSET

        $("sunrise").textContent =
            formatSunTime(daily.sunrise[0]);


        $("sunset").textContent =
            formatSunTime(daily.sunset[0]);

    }


    // --------------------------------------
    // 12. FIND CURRENT HOURLY INDEX
    // --------------------------------------

    function getCurrentHourIndex(times, currentTime) {

        const index = times.findIndex(function (time) {

            return time >= currentTime;

        });

        return index >= 0 ? index : 0;

    }


    // --------------------------------------
    // 13. UV INDEX DESCRIPTION
    // --------------------------------------

    function getUVDescription(value) {

        if (value === undefined || value === null) {
            return "UV information unavailable";
        }

        if (value < 3) return "Low intensity";

        if (value < 6) return "Moderate intensity";

        if (value < 8) return "High intensity";

        if (value < 11) return "Very high intensity";

        return "Extreme intensity";

    }


    // --------------------------------------
    // 14. HOURLY FORECAST
    // --------------------------------------

    function displayHourlyForecast(hourly, currentTime) {

        const hourlyContainer = $("hourlyForecast");

        hourlyContainer.innerHTML = "";


        const startIndex = getCurrentHourIndex(
            hourly.time,
            currentTime
        );


        // Display the next 24 hourly entries.

        for (let i = startIndex;
             i < Math.min(startIndex + 24, hourly.time.length);
             i++) {

            const time = hourly.time[i];

            const temperature = hourly.temperature_2m[i];

            const weatherCode = hourly.weather_code[i];

            const precipitation =
                hourly.precipitation_probability[i];

            const hour = Number(time.split("T")[1].split(":")[0]);

            const isDay = hour >= 6 && hour < 18;

            const weather = getWeatherInfo(weatherCode, isDay);


            const card = document.createElement("div");

            card.className = "hour-card";


            const timeLabel =
                i === startIndex ? "Now" : formatHour(time);


            card.innerHTML = `

                <span class="hour-time">
                    ${timeLabel}
                </span>

                <span class="hour-icon">
                    ${weather.icon}
                </span>

                <span class="hour-temp">
                    ${formatTemperature(temperature)}
                </span>

                <span class="hour-rain">
                    💧 ${precipitation ?? "--"}%
                </span>

            `;


            hourlyContainer.appendChild(card);

        }

    }


    // --------------------------------------
    // 15. WEEKLY FORECAST
    // --------------------------------------

    function displayWeeklyForecast(daily) {

        const weeklyContainer = $("weeklyForecast");

        weeklyContainer.innerHTML = "";


        for (let i = 0; i < daily.time.length; i++) {

            const date = daily.time[i];

            const weatherCode = daily.weather_code[i];

            const maximum = daily.temperature_2m_max[i];

            const minimum = daily.temperature_2m_min[i];

            const rainProbability =
                daily.precipitation_probability_max[i];

            const wind = daily.wind_speed_10m_max[i];

            const weather = getWeatherInfo(weatherCode);


            const dayName =
                i === 0 ? "Today" : formatDate(date).split(",")[0];


            const card = document.createElement("div");

            card.className = "day-card";


            card.innerHTML = `

                <span class="day-name">
                    ${dayName}
                </span>

                <span class="day-icon">
                    ${weather.icon}
                </span>

                <span class="day-condition">
                    ${weather.condition}
                    · Rain ${rainProbability ?? "--"}%
                    · Wind ${Math.round(wind)} km/h
                </span>

                <span class="day-high">
                    ${formatTemperature(maximum)}
                </span>

                <span class="day-low">
                    ${formatTemperature(minimum)}
                </span>

            `;


            weeklyContainer.appendChild(card);

        }

    }


    // --------------------------------------
    // 16. CELSIUS / FAHRENHEIT TOGGLE
    // --------------------------------------

    function updateTemperatureDisplay() {

        if (!currentWeatherData || !activeLocation) return;

        displayWeather(currentWeatherData, activeLocation);

        unitToggle.textContent =
            temperatureUnit === "celsius"
                ? "°C | °F"
                : "°F | °C";

        unitToggle.title =
            temperatureUnit === "celsius"
                ? "Currently Celsius. Click for Fahrenheit."
                : "Currently Fahrenheit. Click for Celsius.";

    }


    unitToggle.addEventListener("click", function () {

        temperatureUnit =
            temperatureUnit === "celsius"
                ? "fahrenheit"
                : "celsius";

        updateTemperatureDisplay();

    });


    // --------------------------------------
    // 17. SEARCH FORM
    // --------------------------------------

    searchForm.addEventListener("submit", function (event) {

        event.preventDefault();

        loadCity(cityInput.value.trim());

    });


    // --------------------------------------
    // 18. QUICK LOCATION BUTTONS
    // --------------------------------------

    document.querySelectorAll(".city-chip").forEach(
        function (button) {

            button.addEventListener("click", function () {

                const city = button.dataset.city;

                cityInput.value = city;

                loadCity(city);

            });

        }
    );


    // --------------------------------------
    // 19. MY CURRENT LOCATION
    // --------------------------------------

    locationButton.addEventListener("click", function () {

        if (!navigator.geolocation) {

            showStatus(
                "Your browser does not support location services.",
                "error"
            );

            return;

        }


        locationButton.disabled = true;

        locationButton.textContent = "Getting location...";

        showStatus("Requesting your current location...");


        navigator.geolocation.getCurrentPosition(

            async function (position) {

                const latitude = position.coords.latitude;

                const longitude = position.coords.longitude;


                const location = {

                    name: "Your Location",

                    country: "GPS location",

                    latitude: latitude,

                    longitude: longitude

                };


                await loadWeather(location);

                locationButton.disabled = false;

                locationButton.innerHTML = "<span>◎</span> My Location";

            },


            function (error) {

                let message = "Unable to access your location.";

                if (error.code === 1) {

                    message =
                        "Location permission denied. Please allow location access.";

                } else if (error.code === 2) {

                    message =
                        "Your current location could not be determined.";

                } else if (error.code === 3) {

                    message =
                        "Location request timed out. Please try again.";

                }


                showStatus(message, "error");

                locationButton.disabled = false;

                locationButton.innerHTML = "<span>◎</span> My Location";

            },

            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
            }

        );

    });


    // --------------------------------------
    // 20. CURRENT YEAR
    // --------------------------------------

    $("currentYear").textContent =
        new Date().getFullYear();


    // --------------------------------------
    // 21. DEFAULT CITY ON PAGE LOAD
    // --------------------------------------

    loadCity("Bengaluru");


});