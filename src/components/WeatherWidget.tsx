import { useState, useEffect } from "react";
import { CloudSun, Thermometer, Wind, Droplets, MapPin, AlertTriangle } from "lucide-react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  windSpeed: number;
  humidity: number;
  city: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWeather();
  }, []);

  const getWeather = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;

      // Open-Meteo API (free, no key needed)
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      );
      const data = await res.json();
      const current = data.current;

      // Reverse geocode city name
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
      );
      const geoData = await geoRes.json();
      const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Dein Standort";

      const wmoToDescription = (code: number) => {
        if (code === 0) return "Klar";
        if (code <= 3) return "Teilweise bewölkt";
        if (code <= 48) return "Nebelig";
        if (code <= 57) return "Nieselregen";
        if (code <= 67) return "Regen";
        if (code <= 77) return "Schnee";
        if (code <= 82) return "Regenschauer";
        if (code <= 86) return "Schneeschauer";
        if (code <= 99) return "Gewitter";
        return "Unbekannt";
      };

      setWeather({
        temp: Math.round(current.temperature_2m),
        description: wmoToDescription(current.weather_code),
        icon: current.weather_code <= 3 ? "☀️" : current.weather_code <= 48 ? "🌫️" : current.weather_code <= 67 ? "🌧️" : current.weather_code <= 77 ? "❄️" : current.weather_code <= 86 ? "🌨️" : "⛈️",
        windSpeed: Math.round(current.wind_speed_10m),
        humidity: current.relative_humidity_2m,
        city,
      });
    } catch {
      setError("Standort nicht verfügbar");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border animate-pulse">
        <div className="h-16 bg-secondary/30 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CloudSun size={18} />
          <span className="text-sm">{error}</span>
        </div>
        <button onClick={getWeather} className="text-xs text-primary hover:underline mt-2">Erneut versuchen</button>
      </div>
    );
  }

  if (!weather) return null;

  const isStormWarning = weather.windSpeed > 50;

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-start gap-4">
        <span className="text-4xl">{weather.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-foreground">{weather.temp}°C</p>
            <span className="text-sm text-muted-foreground">{weather.description}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{weather.city}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Wind size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{weather.humidity}%</span>
            </div>
          </div>
        </div>
      </div>
      {isStormWarning && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
          <AlertTriangle size={14} /> Sturmwarnung – Vorsicht beim Ausreiten!
        </div>
      )}
    </div>
  );
}
