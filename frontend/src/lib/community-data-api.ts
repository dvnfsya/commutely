import type { Feature, FeatureCollection, Point } from "geojson";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
type SurveyProperties = Record<string, unknown>;
export type CommunityData = FeatureCollection<Point, SurveyProperties>;

function isPointFeature(value: unknown): value is Feature<Point, SurveyProperties> {
  if (!value || typeof value !== "object") return false;
  const feature = value as Record<string, unknown>;
  if (feature.type !== "Feature" || !feature.geometry || typeof feature.geometry !== "object") return false;
  const geometry = feature.geometry as Record<string, unknown>;
  const coordinates = geometry.coordinates;
  return geometry.type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2
    && coordinates.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
    && Math.abs(coordinates[0]) <= 180 && Math.abs(coordinates[1]) <= 90
    && !!feature.properties && typeof feature.properties === "object" && !Array.isArray(feature.properties);
}

export async function fetchCommunityData(signal: AbortSignal): Promise<CommunityData> {
  const params = new URLSearchParams({ project_id: "6a9ed0e2753cb27abeaa6aeb", layer_id: "6aa5380a753cb27abe772c59" });
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/api/v1/mapid/layer?${params}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(35000)]),
  });
  if (!response.ok) throw new Error("Community Data belum dapat dimuat.");
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("features" in payload)
    || !Array.isArray(payload.features) || !payload.features.every(isPointFeature)) {
    throw new Error("Format Community Data tidak valid.");
  }
  return { type: "FeatureCollection", features: payload.features };
}

export function communityPopup(properties: SurveyProperties): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = "max-height:320px;overflow:auto;overflow-wrap:anywhere";
  for (const [tag, key, fallback] of [
    ["strong", "data__activities__title", "Community Data"],
    ["p", "data__activities__description", "Deskripsi tidak tersedia."],
    ["p", "data__activities__created_at", "Tanggal tidak tersedia."],
  ]) {
    const element = document.createElement(tag);
    element.textContent = typeof properties[key] === "string" && properties[key].trim() ? properties[key] : fallback;
    container.append(element);
  }
  const mediaUrls: string[] = [];
  for (let index = 1; index <= 6; index++) {
    const value = properties[`data__activities__medias__${String(index).padStart(3, "0")}`];
    if (typeof value !== "string" || !value.trim()) continue;
    try {
      const url = new URL(value);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) continue;
      mediaUrls.push(url.href);
    } catch { /* Skip invalid media URLs. */ }
  }
  if (mediaUrls.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Media survei tidak tersedia";
    container.append(empty);
    return container;
  }

  const link = document.createElement("a");
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Lihat media survei";
  link.style.cssText = "display:block;color:#2563eb;text-decoration:underline";
  const preview = document.createElement("div");
  link.append(preview);
  const indicator = document.createElement("span");
  indicator.setAttribute("aria-live", "polite");
  let currentIndex = 0;
  const showMedia = () => {
    link.href = mediaUrls[currentIndex];
    const image = document.createElement("img");
    image.alt = `Media survei ${currentIndex + 1} dari ${mediaUrls.length}`;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.style.cssText = "display:block;max-width:100%;height:180px;object-fit:contain;margin-top:8px";
    image.onerror = () => { image.alt = "Gambar tidak dapat dimuat. Buka tautan media survei."; };
    image.src = mediaUrls[currentIndex];
    preview.replaceChildren(image);
    indicator.textContent = `${currentIndex + 1} / ${mediaUrls.length}`;
  };
  container.append(link);
  if (mediaUrls.length > 1) {
    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px";
    const navigation = (label: string, direction: number) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.setAttribute("aria-label", `Media ${label.toLowerCase()}`);
      button.style.cssText = "min-height:36px;padding:4px 8px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer";
      button.onclick = () => {
        currentIndex = (currentIndex + direction + mediaUrls.length) % mediaUrls.length;
        showMedia();
      };
      return button;
    };
    controls.append(navigation("Sebelumnya", -1), indicator, navigation("Berikutnya", 1));
    container.append(controls);
  }
  showMedia();
  return container;
}
