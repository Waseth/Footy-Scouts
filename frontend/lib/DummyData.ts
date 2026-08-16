// Placeholder data shaped to match Player/Tournament/Scout.to_dict() output.
// Swap these arrays for real API calls once the endpoints are ready.

export interface DummyPlayer {
  id: string;
  full_name: string;
  nationality: string;
  age: number;
  position: string;
  current_team: string;
  profile_picture_url: string;
}

export interface DummyTournament {
  id: string;
  tournament_name: string;
  tournament_type: string;
  location: string;
  start_date: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

export interface DummyScout {
  id: string;
  scout_name: string;
  scout_type: 'INDIVIDUAL' | 'AGENCY';
  agency_name: string | null;
  country: string;
  city: string;
  is_verified: boolean;
  profile_picture_url: string;
}

const avatar = (name: string, bg: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=256&bold=true`;

export const dummyPlayers: DummyPlayer[] = [
  { id: 'p1', full_name: 'Brian Otieno', nationality: 'Kenya', age: 19, position: 'Striker', current_team: 'Nairobi United FC', profile_picture_url: avatar('Brian Otieno', '2E2A3D') },
  { id: 'p2', full_name: 'Amina Yusuf', nationality: 'Kenya', age: 17, position: 'Midfielder', current_team: 'Mombasa Queens', profile_picture_url: avatar('Amina Yusuf', '3A2F4D') },
  { id: 'p3', full_name: 'David Kiplagat', nationality: 'Kenya', age: 21, position: 'Centre-back', current_team: 'Rift Valley Academy', profile_picture_url: avatar('David Kiplagat', '2E2A3D') },
  { id: 'p4', full_name: 'Grace Wanjiru', nationality: 'Kenya', age: 18, position: 'Winger', current_team: 'Eldoret Rangers', profile_picture_url: avatar('Grace Wanjiru', '3A2F4D') },
];

export const dummyTournaments: DummyTournament[] = [
  { id: 't1', tournament_name: 'Nairobi Youth 7s Cup', tournament_type: '7-a-side', location: 'Nairobi, Kenya', start_date: '2026-09-12', status: 'UPCOMING' },
  { id: 't2', tournament_name: 'Coastal Talent Showcase', tournament_type: '11-a-side', location: 'Mombasa, Kenya', start_date: '2026-10-03', status: 'UPCOMING' },
  { id: 't3', tournament_name: 'Rift Valley 5s Invitational', tournament_type: '5-a-side', location: 'Eldoret, Kenya', start_date: '2026-10-20', status: 'UPCOMING' },
];

export const dummyScouts: DummyScout[] = [
  { id: 's1', scout_name: 'Peter Mwangi', scout_type: 'AGENCY', agency_name: 'Prime Talent Sports', country: 'Kenya', city: 'Nairobi', is_verified: true, profile_picture_url: avatar('Peter Mwangi', '2E2A3D') },
  { id: 's2', scout_name: 'Elena Torres', scout_type: 'INDIVIDUAL', agency_name: null, country: 'Spain', city: 'Madrid', is_verified: true, profile_picture_url: avatar('Elena Torres', '3A2F4D') },
  { id: 's3', scout_name: 'James Odhiambo', scout_type: 'AGENCY', agency_name: 'East Africa Football Partners', country: 'Kenya', city: 'Kisumu', is_verified: false, profile_picture_url: avatar('James Odhiambo', '2E2A3D') },
];