import Link from 'next/link';
import Image from 'next/image';
import { DummyPlayer } from '../lib/DummyData';

export default function PlayerCard({ player }: { player: DummyPlayer }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="group rounded-lg border border-white/10 bg-white/5 p-5 text-left transition duration-300 hover:border-white/25 hover:bg-white/8"
    >
      <div className="mb-4 flex items-center gap-4">
        <Image
          src={player.profile_picture_url}
          alt={player.full_name}
          width={56}
          height={56}
          className="rounded-full"
        />
        <div>
          <h3 className="font-semibold text-white group-hover:underline">{player.full_name}</h3>
          <p className="text-sm text-white/60">{player.position} · {player.nationality}</p>
        </div>
      </div>
      <p className="text-sm text-white/70">{player.current_team}</p>
      <p className="mt-1 text-sm text-white/50">Age {player.age}</p>
    </Link>
  );
}