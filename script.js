// ===== Weather App — script.js =====
// Uses Open-Meteo (free, no API key) for weather + geocoding.
// Docs: https://open-meteo.com/en/docs

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

// Default location: Karachi, Pakistan
const DEFAULT_LOCATION = {
  name: "Karachi",
  country: "Pakistan",
  latitude: 24.8608,
  longitude: 67.0104,
};

// ----- DOM references -----
const searchInput = document.querySelector(".search-bar");
const searchButton = document.querySelector(".search-button");

const locationEl = document.querySelector(".location-date p:nth-child(1)");
const dateEl = document.querySelector(".location-date p:nth-child(2)");
const tempNumEl = document.querySelector(".temp-num");
const mainWeatherIcon = document.querySelector(".weather-discription .weather-icon");
const mainWeatherDesc = document.querySelector(".weather-discription p");

const humidityValueEl = document.querySelector(".humidity p:last-child");
const windValueEl = document.querySelector(".wind p:last-child");
const precipValueEl = document.querySelector(".precip p:last-child");

const forecastDays = document.querySelectorAll(".forecast-day");

// ----- WMO weather code -> description + emoji -----
// Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
const WEATHER_CODES = {
  0: { desc: "Clear Sky", emoji: "☀️" },
  1: { desc: "Mainly Clear", emoji: "🌤️" },
  2: { desc: "Partly Cloudy", emoji: "⛅" },
  3: { desc: "Overcast", emoji: "☁️" },
  45: { desc: "Fog", emoji: "🌫️" },
  48: { desc: "Rime Fog", emoji: "🌫️" },
  51: { desc: "Light Drizzle", emoji: "🌦️" },
  53: { desc: "Drizzle", emoji: "🌦️" },
  55: { desc: "Dense Drizzle", emoji: "🌦️" },
  56: { desc: "Freezing Drizzle", emoji: "🌧️" },
  57: { desc: "Freezing Drizzle", emoji: "🌧️" },
  61: { desc: "Light Rain", emoji: "🌧️" },
  63: { desc: "Rain", emoji: "🌧️" },
  65: { desc: "Heavy Rain", emoji: "🌧️" },
  66: { desc: "Freezing Rain", emoji: "🌧️" },
  67: { desc: "Freezing Rain", emoji: "🌧️" },
  71: { desc: "Light Snow", emoji: "❄️" },
  73: { desc: "Snow", emoji: "❄️" },
  75: { desc: "Heavy Snow", emoji: "❄️" },
  77: { desc: "Snow Grains", emoji: "❄️" },
  80: { desc: "Rain Showers", emoji: "🌦️" },
  81: { desc: "Rain Showers", emoji: "🌦️" },
  82: { desc: "Violent Showers", emoji: "🌧️" },
  85: { desc: "Snow Showers", emoji: "🌨️" },
  86: { desc: "Snow Showers", emoji: "🌨️" },
  95: { desc: "Thunderstorm", emoji: "⛈️" },
  96: { desc: "Thunderstorm w/ Hail", emoji: "⛈️" },
  99: { desc: "Thunderstorm w/ Hail", emoji: "⛈️" },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { desc: "Unknown", emoji: "❓" };
}

// Turns an emoji into a data-URI SVG so it can be used as <img src="">
// (keeps everything self-contained, no external icon files needed)
function emojiToDataUri(emoji) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <text x="50" y="60" font-size="70" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function formatDate(dateObj) {
  return dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDayAbbrev(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// ----- Render fetched data into the DOM -----
function updateWeatherUI(data, locationLabel) {
  const current = data.current;
  const daily = data.daily;
  const info = getWeatherInfo(current.weather_code);

  // Header
  locationEl.textContent = locationLabel;
  dateEl.textContent = formatDate(new Date());

  // Primary
  tempNumEl.textContent = `${Math.round(current.temperature_2m)}° C`;
  mainWeatherIcon.src = emojiToDataUri(info.emoji);
  mainWeatherIcon.alt = info.desc;
  mainWeatherDesc.textContent = info.desc;

  // Secondary
  humidityValueEl.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  windValueEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  const todayPrecipProb = daily.precipitation_probability_max?.[0] ?? 0;
  precipValueEl.textContent = `${Math.round(todayPrecipProb)}%`;

  // 5-day forecast: skip index 0 (today), show next 5 days
  forecastDays.forEach((dayCard, i) => {
    const dailyIndex = i + 1; // 1..5
    const dayNameEl = dayCard.querySelector("p:first-child");
    const iconEl = dayCard.querySelector("img");
    const tempEl = dayCard.querySelector("p:last-child");

    if (!daily.time[dailyIndex]) return;

    const dayCode = daily.weather_code[dailyIndex];
    const dayInfo = getWeatherInfo(dayCode);
    const dayTemp = Math.round(daily.temperature_2m_max[dailyIndex]);

    dayNameEl.textContent = formatDayAbbrev(daily.time[dailyIndex]);
    iconEl.src = emojiToDataUri(dayInfo.emoji);
    iconEl.alt = dayInfo.desc;
    tempEl.textContent = `${dayTemp}°C`;
  });
}

// ----- Fetch weather for given coordinates -----
async function fetchWeather(latitude, longitude, locationLabel) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,precipitation_probability_max",
    timezone: "auto",
    forecast_days: 6,
  });

  try {
    const response = await fetch(`${FORECAST_URL}?${params}`);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const data = await response.json();
    updateWeatherUI(data, locationLabel);
  } catch (err) {
    console.error("Failed to fetch weather:", err);
    alert("Couldn't load weather data. Please check your connection and try again.");
  }
}

// ----- Geocode a city name typed by the user -----
async function fetchCityCoordinates(cityName) {
  const params = new URLSearchParams({
    name: cityName,
    count: 1,
    language: "en",
    format: "json",
  });

  try {
    const response = await fetch(`${GEOCODE_URL}?${params}`);
    if (!response.ok) throw new Error(`Geocoding API error: ${response.status}`);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      alert(`Couldn't find "${cityName}". Please check the spelling and try again.`);
      return null;
    }

    const result = data.results[0];
    return {
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch (err) {
    console.error("Failed to fetch city coordinates:", err);
    alert("Couldn't search for that city right now. Please try again.");
    return null;
  }
}

// ----- Search handler -----
async function handleSearch() {
  const cityName = searchInput.value.trim();
  if (!cityName) return;

  const location = await fetchCityCoordinates(cityName);
  if (!location) return;

  const label = location.country
    ? `${location.name}, ${location.country}`
    : location.name;

  await fetchWeather(location.latitude, location.longitude, label);
  searchInput.value = "";
}

searchButton.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

// ----- Load default (Karachi) weather on page open -----
window.addEventListener("DOMContentLoaded", () => {
  fetchWeather(
    DEFAULT_LOCATION.latitude,
    DEFAULT_LOCATION.longitude,
    `${DEFAULT_LOCATION.name}, ${DEFAULT_LOCATION.country}`
  );
});