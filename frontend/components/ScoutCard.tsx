import Link from 'next/link';
import Image from 'next/image';
import { DummyScout } from '../lib/DummyData';

export default function ScoutCard({ scout }: { scout: DummyScout }) {
  return (
    <Link
      href={`/scouts/${scout.id}`}
      className="group rounded-lg border border-white/10 bg-white/5 p-5 text-left transition duration-300 hover:border-white/25 hover:bg-white/8"
    >
      <div className="mb-4 flex items-center gap-4">
        <Image
          src={scout.profile_picture_url}
          alt={scout.scout_name}
          width={56}
          height={56}
          className="rounded-full"
        />
        <div>
          <h3 className="font-semibold text-white group-hover:underline">{scout.scout_name}</h3>
          <p className="text-sm text-white/60">
            {scout.scout_type === 'AGENCY' ? scout.agency_name : 'Independent Scout'}
          </p>
        </div>
        {scout.is_verified && (
          <span className="ml-auto shrink-0 rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-white/70">
            Verified
          </span>
        )}
      </div>
      <p className="text-sm text-white/50">{scout.city}, {scout.country}</p>
    </Link>
  );
}