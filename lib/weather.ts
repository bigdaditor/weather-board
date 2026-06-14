const weatherLabels: Record<number, string> = {
  0: "맑음", 1: "맑음", 2: "흐림", 3: "흐림", 45: "흐림", 48: "흐림",
  51: "비", 53: "비", 55: "비", 61: "비", 63: "비", 65: "비", 80: "비", 81: "비", 82: "비",
  71: "눈", 73: "눈", 75: "눈", 77: "눈", 85: "눈", 86: "눈",
};

export async function getWeatherForDate(date: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 5);
  const host = new Date(date) < cutoff ? "archive-api.open-meteo.com/v1/archive" : "api.open-meteo.com/v1/forecast";
  const response = await fetch(`https://${host}?latitude=37.5665&longitude=126.9780&start_date=${date}&end_date=${date}&daily=weather_code,temperature_2m_max&timezone=Asia%2FSeoul`);
  if (!response.ok) {
    throw new Error(`Weather API returned ${response.status}`);
  }

  const data = await response.json() as {
    daily?: { weather_code?: number[]; temperature_2m_max?: number[] };
  };
  const weatherCode = data.daily?.weather_code?.[0];
  const temperature = data.daily?.temperature_2m_max?.[0];

  if (weatherCode === undefined || temperature === undefined || !weatherLabels[weatherCode]) {
    throw new Error("Weather API returned no daily weather data");
  }

  return { label: weatherLabels[weatherCode], temperature: Math.round(temperature) };
}
