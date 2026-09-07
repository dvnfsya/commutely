import type { SafetyScoreData } from "./types";

export function SafetyScoreExplanation({ safety }: { safety: SafetyScoreData }) {
  return <section aria-labelledby="score-explanation-title" className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-4">
    <h3 id="score-explanation-title" className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">Tentang score ini</h3>
    <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">Safety Score menggambarkan konteks keamanan berdasarkan indikator spasial seperti penerangan, Nighttime Light, pos polisi, retail 24 jam, dan validasi survei lapangan. Nilai <strong>{safety.score}</strong> pada prototype ini adalah data dummy.</p>
    <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">Score pada produk final dihitung melalui analisis spasial berbobot. AI hanya dapat menjelaskan hasilnya, bukan menghitung atau menentukan nilainya.</p>
  </section>;
}
