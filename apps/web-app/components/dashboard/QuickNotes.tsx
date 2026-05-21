"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useNotes } from "@/hooks/useNotes";

export default function QuickNotes() {
  const { notes: storeNotes, updateNotes } = useNotes();

  const [value, setValue] = useState("");

  // Sync local text with store when it is loaded from database
  useEffect(() => {
    queueMicrotask(() => setValue(storeNotes || ""));
  }, [storeNotes]);

  // Debounce saving notes to backend (1 second)
  useEffect(() => {
    if (value === storeNotes) return;

    const timer = setTimeout(() => {
      updateNotes(value);
    }, 1000);

    return () => clearTimeout(timer);
  }, [value, storeNotes, updateNotes]);

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-100 mb-3">
        Quick Notes
      </h3>
      <Textarea
        placeholder="Jot down thoughts or reminders..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-slate-800/80 border-slate-700 rounded-xl text-sm text-slate-300 resize-none min-h-20 focus:border-pace-accent"
      />
    </div>
  );
}
