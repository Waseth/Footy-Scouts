"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

export default function Accordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-base font-medium text-white">{title}</span>
        <ChevronRight
          size={18}
          className={`text-white/40 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && <div className="pb-4 text-sm leading-7 text-white/60">{children}</div>}
    </div>
  );
}