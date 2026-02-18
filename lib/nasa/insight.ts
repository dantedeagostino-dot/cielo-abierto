const INSIGHT_BASE_URL = 'https://api.nasa.gov/insight_weather/';

export interface MarsWeather {
    sol: string;
    season: string;
    min_temp: number;
    max_temp: number;
    pressure: number;
    wind_speed: number;
}

export async function getMarsWeather(): Promise<MarsWeather[]> {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

    // ver=1.0, feedtype=json
    const response = await fetch(`${INSIGHT_BASE_URL}?api_key=${apiKey}&feedtype=json&ver=1.0`, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch InSight weather: ${response.statusText}`);
    }

    const data = await response.json();
    const solKeys = data.sol_keys;

    return solKeys.map((sol: string) => {
        const solData = data[sol];
        return {
            sol: sol,
            season: solData.Season,
            min_temp: solData.AT?.mn,
            max_temp: solData.AT?.mx,
            pressure: solData.PRE?.av,
            wind_speed: solData.HWS?.av,
        };
    });
}
