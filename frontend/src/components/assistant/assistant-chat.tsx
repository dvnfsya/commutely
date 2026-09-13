"use client";

import { useEffect, useId, useRef, useState } from "react";
import { askAssistant } from "../../lib/assistant-api";
import { Button } from "../ui/button";

const FAQ = [
  "Apa itu Safety Score?",
  "Bagaimana cara membaca Safety Score?",
  "Apa yang dimaksud kondisi Aman?",
  "Bagaimana Commute.ly membantu perjalanan malam?",
  "Apa saja data yang digunakan?",
  "Bagaimana cara melihat informasi stasiun?",
];
type Message = { role: "user" | "assistant"; text: string };

export function AssistantChat({ stationId, robotImageSrc = process.env.NEXT_PUBLIC_ASSISTANT_ROBOT_SRC }: {
  stationId: string | null;
  /** Public path to the user-provided robot asset. */
  robotImageSrc?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    conversation.current?.scrollTo({ top: conversation.current.scrollHeight });
  }, [messages, pending, error, open]);

  const close = () => { setOpen(false); launcher.current?.focus(); };
  const submit = async (value: string) => {
    const text = value.trim();
    if (!text || text.length > 2000 || controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setQuestion("");
    setError(null);
    setPending(true);
    setMessages((current) => [...current, { role: "user", text }]);
    try {
      const answer = await askAssistant(text, stationId, request.signal);
      if (!request.signal.aborted) setMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch {
      if (!request.signal.aborted) {
        setError("Assistant belum dapat menjawab. Pertanyaan dikembalikan ke kolom pesan untuk dicoba lagi.");
        setQuestion(text);
      }
    } finally {
      controller.current = null;
      if (!request.signal.aborted) setPending(false);
    }
  };

  return <div className="absolute bottom-3 left-3 z-30" onKeyDown={(event) => {
    if (event.key === "Escape" && open) { event.stopPropagation(); close(); }
  }}>
    {open && <section id={panelId} role="dialog" aria-label="Commute.ly Assistant"
      className="absolute bottom-16 left-0 flex max-h-[min(32rem,calc(70dvh-5.5rem))] w-[min(25rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)] lg:w-[min(25rem,calc(100vw-32rem))]">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-line)] bg-[var(--color-primary-soft)] px-4 py-3">
        <div><h2 className="text-sm font-bold text-[var(--color-primary-strong)]">Commute.ly Assistant</h2><p className="text-xs text-[var(--color-muted)]">Tanya tentang perjalananmu</p></div>
        <Button variant="ghost" size="icon" aria-label="Tutup Commute.ly Assistant" onClick={close}>×</Button>
      </header>
      <div ref={conversation} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
        {messages.length === 0 && <div className="space-y-2"><p className="text-sm text-[var(--color-muted)]">Ada yang ingin kamu tanyakan?</p>{FAQ.map((faq) =>
          <Button key={faq} variant="secondary" size="sm" className="h-auto w-full justify-start whitespace-normal py-2 text-left" onClick={() => void submit(faq)} disabled={pending}>{faq}</Button>,
        )}</div>}
        <div role="log" aria-label="Percakapan dengan Assistant" aria-live="polite" className="space-y-3">
          {messages.map((message, index) => <div key={index} className={`max-w-[95%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "ml-auto bg-[var(--color-primary-soft)] text-[var(--color-ink)]" : "mr-auto bg-blue-50 text-slate-800"}`}>
            <span className="mb-1 block text-xs font-semibold">{message.role === "user" ? "Kamu" : "Assistant"}</span>{message.text}
          </div>)}
        </div>
        {pending && <p role="status" className="text-sm text-[var(--color-muted)]">Assistant sedang menyiapkan jawaban…</p>}
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-2 text-sm text-rose-800">{error}</p>}
      </div>
      <form className="flex shrink-0 items-end gap-2 border-t border-[var(--color-line)] p-3" onSubmit={(event) => { event.preventDefault(); void submit(question); }}>
        <textarea ref={input} aria-label="Pertanyaan untuk Assistant" placeholder="Tulis pertanyaanmu…" rows={2} maxLength={2000} value={question} disabled={pending}
          className="min-w-0 flex-1 resize-none rounded-xl border border-[var(--color-line)] p-2 text-sm text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-60"
          onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(question); }
          }} />
        <Button type="submit" size="sm" disabled={pending || !question.trim()}>Kirim</Button>
      </form>
    </section>}
    <button ref={launcher} type="button" aria-label="Buka Commute.ly Assistant" aria-expanded={open} aria-controls={panelId}
      onClick={() => open ? close() : setOpen(true)}
      className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-[var(--color-line)] bg-white p-1.5 text-xs font-bold text-[var(--color-primary-strong)] shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
      {robotImageSrc && !imageFailed ? <img src={robotImageSrc} alt="" className="size-full object-contain" onError={() => setImageFailed(true)} /> : "Tanya"}
    </button>
  </div>;
}
