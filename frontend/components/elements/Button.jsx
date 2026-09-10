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
      "bg-white text-dark shadow-1 hover:bg-gray-2 hover:text-body-color",
    outline:
      "bg-white/12 text-white hover:bg-white hover:text-dark",
    gold:
      "bg-[#D4AF6A] text-[#1C1928] font-semibold hover:bg-[#c9a45f] shadow-1",
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