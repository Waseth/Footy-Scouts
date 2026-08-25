"use client";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/50";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#D4AF6A]/60 focus:bg-white/8";

export default function ContactForm() {
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
            placeholder="Jane"
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
            placeholder="Doe"
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
          placeholder="jane@example.com"
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
        <select
          id="role"
          name="role"
          defaultValue=""
          className={`${inputClass} appearance-none`}
        >
          <option value="" disabled className="bg-[#242030]">
            Select one
          </option>
          <option value="player" className="bg-[#242030]">
            Player
          </option>
          <option value="scout" className="bg-[#242030]">
            Scout / Agent
          </option>
          <option value="club" className="bg-[#242030]">
            Club / Academy
          </option>
          <option value="other" className="bg-[#242030]">
            Other
          </option>
        </select>
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
        className="w-full rounded-xl bg-white py-4 text-sm font-semibold uppercase tracking-[0.14em] text-dark shadow-1 transition hover:bg-gray-2 hover:text-body-color focus:outline-none focus:ring-2 focus:ring-[#D4AF6A] focus:ring-offset-2 focus:ring-offset-[#1C1928]"
      >
        Send message
      </button>

      <p className="text-center text-xs text-white/35">
        We typically respond within 2 business days.
      </p>
    </form>
  );
}