import { fetchStations } from "./station-info-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function normalized(value: string) {
  return ` ${value.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, " ").trim()} `;
}

export async function stationForQuestion(question: string, selectedStationId: string | null, signal: AbortSignal) {
  const terms = normalized(question);
  try {
    const stations = await fetchStations(signal);
    const explicit = stations.find((station) => {
      const name = normalized(station.name ?? "").replace(/^ stasiun /, " ");
      return name.trim().length >= 3 && terms.includes(name);
    });
    return explicit?.id ?? selectedStationId;
  } catch {
    return selectedStationId;
  }
}

export async function askAssistant(question: string, stationId: string | null, signal: AbortSignal): Promise<string> {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/v1/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, context: {}, station_id: stationId }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(40000)]),
  });
  if (!response.ok) throw new Error("Assistant belum dapat menjawab. Silakan coba lagi.");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("answer" in data) || typeof data.answer !== "string" || !data.answer.trim()) {
    throw new Error("Jawaban belum tersedia. Silakan coba lagi.");
  }
  return data.answer;
}
