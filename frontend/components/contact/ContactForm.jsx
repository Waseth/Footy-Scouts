"use client";

import CustomSelect from "@/components/CustomSelect";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/50";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#D4AF6A]/60 focus:bg-white/8";

export default function ContactForm() {
  const roleOptions = [
    { value: "player", label: "Player" },
    { value: "scout", label: "Scout / Agent" },
    { value: "club", label: "Club / Academy" },
    { value: "other", label: "Other" },
  ];

  return (
    <form
      action="#"
      method="POST"
      className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first-name" className={labelClass}>
            First name
          </label>
          <input
            type="text"
            id="first-name"
            name="first-name"
            required
            placeholder="Vincent"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="last-name" className={labelClass}>
            Last name
          </label>
          <input
            type="text"
            id="last-name"
            name="last-name"
            required
            placeholder="Kuamba"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="player@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="role" className={labelClass}>
          I am a{" "}
          <span className="normal-case font-normal tracking-normal text-white/30">
            (optional)
          </span>
        </label>
        <CustomSelect
          value=""
          onChange={() => {}}
          options={roleOptions}
          placeholder="Select one"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          placeholder="Tell us how we can help..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-[#D4AF6A] py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#1C1928] shadow-1 transition hover:bg-[#D4AF6A]/90 focus:outline-none focus:ring-2 focus:ring-[#D4AF6A] focus:ring-offset-2 focus:ring-offset-[#1C1928]"
      >
        Send message
      </button>

      <p className="text-center text-xs text-white/35">
        We typically respond within 2 business days.
      </p>
    </form>
  );
}