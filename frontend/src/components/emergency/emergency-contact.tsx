"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function EmergencyContact() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const modal = open ? (
    <div
      className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER POPUP */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Emergency Contact
          </h2>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-600 transition hover:bg-gray-200"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* CONTACT */}
        <div className="space-y-4">
          {/* JAKARTA SIAGA */}
          <a
            href="tel:112"
            className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 transition hover:bg-red-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-xl text-white">
                🚨
              </div>

              <div>
                <p className="font-bold text-gray-900">
                  Jakarta Siaga 112
                </p>

                <p className="text-sm text-gray-500">
                  Layanan Panggilan Darurat
                </p>
              </div>
            </div>

            <span className="font-bold text-red-600">
              Call
            </span>
          </a>

          {/* SIAP */}
          <a
            href="tel:1500813"
            className="flex items-center justify-between rounded-2xl border border-pink-100 bg-pink-50 p-4 transition hover:bg-pink-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xl text-white">
                ☎
              </div>

              <div>
                <p className="font-bold text-gray-900">
                  SIAP 1500813
                </p>

                <p className="text-sm text-gray-500">
                  Dishub DKI Jakarta
                </p>
              </div>
            </div>

            <span className="font-bold text-pink-600">
              Call
            </span>
          </a>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* BUTTON DI HEADER */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-pink-700"
      >
        <span>☎</span>
        <span>Emergency Contact</span>
      </button>

      {/* RENDER MODAL LANGSUNG KE BODY */}
      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}