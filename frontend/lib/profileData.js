// Mirrors Player.to_dict() / Scout.to_dict() shape, extended with the fields
// those methods return that the earlier landing-page dummy data left out
// (biography, gender, school, show_contact, agency_name, etc).

const avatar = (name, bg) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=512&bold=true`;

export const dummyPlayers = [
  {
    id: 'p1',
    full_name: 'Brian Otieno',
    nationality: 'Kenya',
    gender: 'Male',
    date_of_birth: '2007-03-22',
    position: 'Striker',
    current_team: 'Nairobi United FC',
    school: 'Lenana School',
    biography:
      'Brian is a pace-driven striker who broke into the Nairobi United first team at 17. Known for his movement in behind defensive lines and a clinical left foot, he has represented Kenya at U-20 level and is looking to make the step up to a full professional academy.',
    profile_picture_url: avatar('Brian Otieno', '2E2A3D'),
    show_contact: true,
    contact_number: '+254 712 345 678',
    email: 'brian.otieno@example.com',
    is_featured: true,
  },
  {
    id: 'p2',
    full_name: 'Amina Yusuf',
    nationality: 'Kenya',
    gender: 'Female',
    date_of_birth: '2009-07-11',
    position: 'Midfielder',
    current_team: 'Mombasa Queens',
    school: 'Coast Girls High School',
    biography:
      'Amina is a technically gifted central midfielder with strong game intelligence for her age. She captains her school team and has been shortlisted for the regional talent identification camp.',
    profile_picture_url: avatar('Amina Yusuf', '3A2F4D'),
    show_contact: false,
    contact_number: '+254 733 111 222',
    email: 'amina.yusuf@example.com',
    is_featured: false,
  },
];

export const dummyScouts = [
  {
    id: 's1',
    scout_name: 'Peter Mwangi',
    scout_type: 'AGENCY',
    agency_name: 'Prime Talent Sports',
    country: 'Kenya',
    city: 'Nairobi',
    biography:
      'Peter has spent over a decade identifying and developing talent across East Africa, working closely with academies to place players in trial programmes abroad. He leads recruitment for Prime Talent Sports\' East African desk.',
    profile_picture_url: avatar('Peter Mwangi', '2E2A3D'),
    is_verified: true,
    show_contact: false,
    contact_number: '+254 700 222 333',
    email: 'peter.mwangi@example.com',
  },
  {
    id: 's2',
    scout_name: 'Elena Torres',
    scout_type: 'INDIVIDUAL',
    agency_name: null,
    country: 'Spain',
    city: 'Madrid',
    biography:
      'Elena is an independent scout specializing in identifying attacking talent from emerging football markets, with a focus on players aged 16-21.',
    profile_picture_url: avatar('Elena Torres', '3A2F4D'),
    is_verified: true,
    show_contact: true,
    contact_number: '+34 600 111 222',
    email: 'elena.torres@example.com',
  },
];

export function getPlayerById(id) {
  return dummyPlayers.find((p) => p.id === id) ?? null;
}

export function getScoutById(id) {
  return dummyScouts.find((s) => s.id === id) ?? null;
}

export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const born = new Date(dateOfBirth);
  let age = today.getFullYear() - born.getFullYear();
  const m = today.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
  return age;
}

export function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}