'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PlayerSearchBar({ defaultValue = '', className = '' }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = query.trim();
        router.push(trimmed ? `/players?search=${encodeURIComponent(trimmed)}` : '/players');
      }}
      className={`flex w-full max-w-140 flex-col gap-3 sm:flex-row ${className}`}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, position, or nationality..."
        className="w-full rounded-md border border-white/15 bg-white/5 px-5 py-3.5 text-base text-white placeholder:text-white/40 outline-none transition focus:border-[#D4AF6A]/60 focus:bg-white/8"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-[#1C1928] px-7 py-3.5 text-base font-medium text-[#D4AF6A] border border-[#D4AF6A]/30 transition duration-300 ease-in-out hover:bg-[#D4AF6A] hover:text-[#1C1928] cursor-pointer"
      >
        Search
      </button>
    </form>
  );
}