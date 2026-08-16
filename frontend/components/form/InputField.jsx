export default function Input({
  type = "text",
  id,
  name,
  placeholder,
  value,
  defaultValue,
  onChange,
  className = "",
  disabled = false,
  error = false,
}) {
  let base =
    "h-12 w-full rounded-md border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/40";

  if (disabled) {
    base += " cursor-not-allowed border-white/10 text-white/40";
  } else if (error) {
    base += " border-red-500/60 focus:border-red-500 focus:bg-white/8";
  } else {
    // NOTE: swap #D4AF6A for your exact gold-font hex to match 1:1
    base += " border-white/15 focus:border-[#D4AF6A]/60 focus:bg-white/8";
  }

  return (
    <input
      type={type}
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      className={`${base} ${className}`}
    />
  );
}
