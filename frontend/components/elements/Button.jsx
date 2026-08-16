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

  // primary/outline mirror the "Register Now" / "Find out more" buttons on the homepage hero
  const variantClasses = {
    primary:
      "bg-white text-dark shadow-1 hover:bg-gray-2 hover:text-body-color",
    outline:
      "bg-white/12 text-white hover:bg-white hover:text-dark",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-md font-medium transition duration-300 ease-in-out ${sizeClasses[size]} ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
