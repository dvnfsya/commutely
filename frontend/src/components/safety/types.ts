import type { StatusTone } from "../ui/status-indicator";

export type SafetyLevel = "safe" | "caution" | "risk";

export type SafetyIndicator = {
  id: string;
  name: string;
  description: string;
  status: string;
  tone: StatusTone;
};

export type SafetyScoreData = {
  score: number;
  label: string;
  tone: StatusTone;
  updatedAt: string;
  highlights: string[];
  indicators: SafetyIndicator[];
};
