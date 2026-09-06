export default function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-white/8 py-2.5 text-sm last:border-b-0">
      <span className="text-white/50">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}