// WMO Weather interpretation codes → emoji + label
// https://open-meteo.com/en/docs#weathervariables
const WMO_CODES: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "☀️", label: "Clear" },
  1: { emoji: "🌤️", label: "Mostly clear" },
  2: { emoji: "⛅", label: "Partly cloudy" },
  3: { emoji: "☁️", label: "Overcast" },
  45: { emoji: "🌫️", label: "Fog" },
  48: { emoji: "🌫️", label: "Rime fog" },
  51: { emoji: "🌦️", label: "Light drizzle" },
  53: { emoji: "🌦️", label: "Drizzle" },
  55: { emoji: "🌦️", label: "Heavy drizzle" },
  56: { emoji: "🌧️", label: "Freezing drizzle" },
  57: { emoji: "🌧️", label: "Heavy freezing drizzle" },
  61: { emoji: "🌧️", label: "Light rain" },
  63: { emoji: "🌧️", label: "Rain" },
  65: { emoji: "🌧️", label: "Heavy rain" },
  66: { emoji: "🌧️", label: "Freezing rain" },
  67: { emoji: "🌧️", label: "Heavy freezing rain" },
  71: { emoji: "🌨️", label: "Light snow" },
  73: { emoji: "🌨️", label: "Snow" },
  75: { emoji: "❄️", label: "Heavy snow" },
  77: { emoji: "🌨️", label: "Snow grains" },
  80: { emoji: "🌦️", label: "Light showers" },
  81: { emoji: "🌧️", label: "Showers" },
  82: { emoji: "🌧️", label: "Heavy showers" },
  85: { emoji: "🌨️", label: "Light snow showers" },
  86: { emoji: "🌨️", label: "Snow showers" },
  95: { emoji: "⛈️", label: "Thunderstorm" },
  96: { emoji: "⛈️", label: "Thunderstorm with hail" },
  99: { emoji: "⛈️", label: "Thunderstorm with heavy hail" },
};

// Night variants for clear/partly cloudy
const NIGHT_OVERRIDES: Record<number, string> = {
  0: "🌙",
  1: "🌙",
};

export interface WeatherData {
  temperatureC: number;
  temperatureF: number;
  weatherCode: number;
  isDay: boolean;
  emoji: string;
  label: string;
}

export function getWeatherEmoji(code: number, isDay: boolean): string {
  if (!isDay && NIGHT_OVERRIDES[code]) return NIGHT_OVERRIDES[code];
  return WMO_CODES[code]?.emoji ?? "🌡️";
}

export function getWeatherLabel(code: number): string {
  return WMO_CODES[code]?.label ?? "Unknown";
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

export function formatTemp(c: number, unit: "C" | "F"): string {
  if (unit === "F") return `${celsiusToFahrenheit(c)}°F`;
  return `${Math.round(c)}°C`;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
}

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: OpenMeteoResponse = await res.json();
    if (!data.current) return null;

    const tempC = data.current.temperature_2m ?? 0;
    const code = data.current.weather_code ?? 0;
    const isDay = (data.current.is_day ?? 1) === 1;

    return {
      temperatureC: Math.round(tempC),
      temperatureF: celsiusToFahrenheit(tempC),
      weatherCode: code,
      isDay,
      emoji: getWeatherEmoji(code, isDay),
      label: getWeatherLabel(code),
    };
  } catch {
    return null;
  }
}
