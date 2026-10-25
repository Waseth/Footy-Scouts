"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR;
const MAX_YEAR = CURRENT_YEAR + 5;
const YEAR_OPTIONS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => {
  const y = MAX_YEAR - i;
  return { value: String(y), label: String(y) };
});
const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({ value: String(i), label: name }));

export default function ThemedDatePicker({
  id,
  value,
  onChange,
  placeholder = "Select a date",
  minDate,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  useClickOutside(wrapperRef, () => setOpen(false));

  const selectedDate = value ? new Date(`${value.split("T")[0]}T00:00:00`) : null;
  const [viewDate, setViewDate] = useState(
    selectedDate || new Date(CURRENT_YEAR, new Date().getMonth(), 1)
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const formatDisplay = (date) =>
    date
      ? date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  const toISODate = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const handlePick = (day) => {
    if (!day) return;
    const iso = toISODate(year, month, day);
    if (minDate && iso < minDate) return;
    onChange({ target: { id, value: iso } });
    setOpen(false);
  };

  const changeMonth = (delta) => setViewDate(new Date(year, month + delta, 1));
  const handleMonthSelect = (v) => setViewDate(new Date(year, Number(v), 1));
  const handleYearSelect = (v) => setViewDate(new Date(Number(v), month, 1));

  const isSelected = (day) =>
    selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month &&
    selectedDate.getDate() === day;

  const isDisabled = (day) => {
    if (!day) return true;
    if (!minDate) return false;
    return toISODate(year, month, day) < minDate;
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center rounded-md border py-2.5 pl-10 pr-3 text-left text-sm outline-none transition ${
          open ? "border-[#D4AF6A]/60" : "border-white/15 hover:border-white/25"
        } bg-white/5`}
      >
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <span className={value ? "text-white" : "text-white/40"}>
          {value ? formatDisplay(selectedDate) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-80 rounded-lg border border-white/10 bg-[#242030] p-4 shadow-lg shadow-black/40">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="shrink-0 rounded-lg border border-white/10 p-1.5 text-white/60 transition hover:border-white/20 hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <CustomSelect
              value={String(month)}
              onChange={handleMonthSelect}
              options={MONTH_OPTIONS}
              className="flex-[1.4]"
            />
            <CustomSelect
              value={String(year)}
              onChange={handleYearSelect}
              options={YEAR_OPTIONS}
              className="flex-1"
            />

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="shrink-0 rounded-lg border border-white/10 p-1.5 text-white/60 transition hover:border-white/20 hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-white/40">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const disabled = isDisabled(day);
              return (
                <button
                  type="button"
                  key={i}
                  disabled={!day || disabled}
                  onClick={() => handlePick(day)}
                  className={`aspect-square rounded text-sm transition-colors ${
                    !day
                      ? "cursor-default"
                      : disabled
                      ? "cursor-not-allowed text-white/20"
                      : isSelected(day)
                      ? "bg-[#D4AF6A] font-medium text-[#1C1928]"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  {day || ""}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}