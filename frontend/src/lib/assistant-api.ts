const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

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
