'use client'
import { notFound } from "next/navigation";
import { getScoutById } from "@/lib/profileData";
import ScoutProfileView from "@/components/profile/ScoutProfileView";
import { useParams } from "next/navigation";
export default function ScoutProfilePage({ params }) {
  const { id } = useParams();
  const scout = getScoutById(id);
  if (!scout) notFound();

  return <ScoutProfileView scout={scout} />;
}