export default function Checkbox({
  label,
  checked,
  id,
  onChange,
  className = "",
  disabled = false,
}) {
  return (
    <label
      className={`flex items-center gap-3 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        // NOTE: accent-color uses the same gold placeholder as InputField
        className={`h-4 w-4 rounded border-white/20 bg-white/5 accent-[#D4AF6A] focus:ring-0 focus:outline-none ${className}`}
      />
      {label && <span className="text-sm font-medium text-white/80">{label}</span>}
    </label>
  );
}
