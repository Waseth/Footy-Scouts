export default function Button({
  children,
  type = "button",
  size = "md",
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
}) {
  const sizeClasses = {
    sm: "px-5 py-3 text-sm",
    md: "px-7 py-3.5 text-base",
  };

  const variantClasses = {
    primary:
      "bg-[#D4AF6A] text-[#1C1928] font-semibold hover:bg-[#c9a45f]",
    outline:
      "bg-transparent border border-[#D4AF6A] text-[#D4AF6A] hover:bg-[#D4AF6A] hover:text-[#1C1928]",
    gold:
      "bg-[#D4AF6A] text-[#1C1928] font-semibold hover:bg-[#c9a45f]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-md font-medium transition duration-300 ease-in-out cursor-pointer ${sizeClasses[size]} ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}