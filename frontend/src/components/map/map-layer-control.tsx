import { cn } from "../ui/cn";
import {
  DATA_LAYER_IDS,
  dataLayerDefinitions,
  type DataLayerId,
} from "./map-layer-data";

export type MapLayerControlState = Record<DataLayerId | "stations", boolean>;

export function MapLayerControl({
  visibility,
  onToggle,
  className,
}: {
  visibility: MapLayerControlState;
  onToggle: (layerId: DataLayerId | "stations") => void;
  className?: string;
}) {
  const layers = [
    {
      id: "stations" as const,
      label: "Stasiun",
      description: "Marker stasiun KRL",
    },
    ...DATA_LAYER_IDS.map((id) => ({
      id,
      ...dataLayerDefinitions[id],
    })),
  ];

  const activeCount = layers.filter(
    (layer) => visibility[layer.id],
  ).length;

  return (
    <details className={cn("absolute left-3 top-3 z-10", className)}>
      <summary
        className="flex size-12 cursor-pointer list-none items-center justify-center rounded-[var(--radius-md)] border border-white/70 bg-white/95 text-[var(--color-ink)] shadow-[var(--shadow-card)] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] [&::-webkit-details-marker]:hidden"
        aria-label="Buka layer peta"
        title="Layers"
      >
        <span
          className="relative flex size-7 items-center justify-center"
          aria-hidden="true"
        >
          {/* Land Layers Icon */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-7"
          >
            {/* Layer paling atas */}
            <path
              d="M16 4L27 10.5L16 17L5 10.5L16 4Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* Layer tengah */}
            <path
              d="M5 15L16 21.5L27 15"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Layer bawah */}
            <path
              d="M5 20L16 26.5L27 20"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Active layer count */}
          {activeCount > 0 && (
            <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold leading-none text-white">
              {activeCount}
            </span>
          )}
        </span>
      </summary>

      <div className="mt-2 w-[min(19rem,calc(100vw-1.5rem))] overflow-hidden rounded-[var(--radius-md)] border border-white/70 bg-white/95 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
          <span className="text-sm font-bold text-[var(--color-ink)]">
            Layers
          </span>

          <span className="rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs text-[var(--color-primary-strong)]">
            {activeCount} aktif
          </span>
        </div>

        <div className="max-h-[min(52dvh,24rem)] overflow-y-auto p-2">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              role="switch"
              aria-checked={visibility[layer.id]}
              onClick={() => onToggle(layer.id)}
              className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] p-3 text-left hover:bg-[var(--color-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition",
                  visibility[layer.id]
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-line)]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white shadow transition",
                    visibility[layer.id]
                      ? "left-4"
                      : "left-0.5",
                  )}
                />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--color-ink)]">
                  {layer.label}
                </span>

                <span className="block text-xs leading-4 text-[var(--color-muted)]">
                  {layer.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}