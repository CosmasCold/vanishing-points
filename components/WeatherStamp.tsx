"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSnow, CloudLightning, Sun, Wind, Droplets } from "lucide-react";

interface Props {
  lat: number;
  lon: number;
}

interface Weather {
  temp: number;
  windspeed: number;
  code: number;
}

const CODE_MAP: Record<number, { label: string; icon: React.ReactNode }> = {
  0: { label: "Clear skies", icon: <Sun size={12} /> },
  1: { label: "Partly clear", icon: <Sun size={12} /> },
  2: { label: "Partly cloudy", icon: <Cloud size={12} /> },
  3: { label: "Overcast", icon: <Cloud size={12} /> },
  45: { label: "Fog", icon: <Wind size={12} /> },
  48: { label: "Depositing rime fog", icon: <Wind size={12} /> },
  51: { label: "Light drizzle", icon: <Droplets size={12} /> },
  53: { label: "Drizzle", icon: <Droplets size={12} /> },
  55: { label: "Heavy drizzle", icon: <Droplets size={12} /> },
  61: { label: "Light rain", icon: <CloudRain size={12} /> },
  63: { label: "Rain", icon: <CloudRain size={12} /> },
  65: { label: "Heavy rain", icon: <CloudRain size={12} /> },
  71: { label: "Light snow", icon: <CloudSnow size={12} /> },
  73: { label: "Snow", icon: <CloudSnow size={12} /> },
  75: { label: "Heavy snow", icon: <CloudSnow size={12} /> },
  95: { label: "Thunderstorm", icon: <CloudLightning size={12} /> },
  96: { label: "Thunderstorm with hail", icon: <CloudLightning size={12} /> },
  99: { label: "Severe thunderstorm", icon: <CloudLightning size={12} /> },
};

function describeWeather(code: number) {
  const exact = CODE_MAP[code];
  if (exact) return exact;

  if (code >= 51 && code <= 67) return CODE_MAP[53];
  if (code >= 71 && code <= 77) return CODE_MAP[73];
  if (code >= 80 && code <= 82) return CODE_MAP[63];
  if (code >= 85 && code <= 86) return CODE_MAP[73];
  if (code >= 95 && code <= 99) return CODE_MAP[95];

  return { label: "Unknown conditions", icon: <Cloud size={12} /> };
}

export default function WeatherStamp({ lat, lon }: Props) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const cw = data.current_weather;
        if (cw) {
          setWeather({
            temp: cw.temperature,
            windspeed: cw.windspeed,
            code: cw.weathercode,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  if (loading) {
    return (
      <span className="text-[10px] font-mono text-[#9a8a72] animate-pulse">
        Scanning skies...
      </span>
    );
  }

  if (!weather) return null;

  const desc = describeWeather(weather.code);

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#7a6e5e]">
      {desc.icon}
      {Math.round(weather.temp)}°C, {desc.label.toLowerCase()}, wind {Math.round(weather.windspeed)} km/h
    </span>
  );
}