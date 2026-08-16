import Link from 'next/link';
import { DummyTournament } from '../lib/DummyData';

export default function TournamentCard({ tournament }: { tournament: DummyTournament }) {
  const formattedDate = new Date(tournament.start_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group flex flex-col justify-between rounded-lg border border-black/10 bg-[#1C192F] p-5 transition duration-300 hover:border-black/25"
    >
      <div>
        <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
          {tournament.tournament_type}
        </span>
        <h3 className="mb-1 font-semibold text-white group-hover:underline">{tournament.tournament_name}</h3>
        <p className="text-sm text-white/60">{tournament.location}</p>
      </div>
      <p className="mt-4 text-sm text-white/50">{formattedDate}</p>
    </Link>
  );
}