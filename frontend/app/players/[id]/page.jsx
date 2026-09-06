'use client'
import { notFound } from "next/navigation";
import { getPlayerById } from "@/lib/profileData";
import PlayerProfileView from "@/components/profile/PlayerProfileView";
import { useParams } from "next/navigation";
export default function PlayerProfilePage({ params }) {
  const { id } = useParams();
  const player = getPlayerById(id);
  if (!player) notFound();

  return <PlayerProfileView player={player} />;
}