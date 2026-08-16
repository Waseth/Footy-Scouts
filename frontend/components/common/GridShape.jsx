// Self-contained replacement for the template's grid-01.svg image asset —
// avoids depending on a file that may not exist in your public/ folder.
// Two soft radial glows + a faint dot grid, tuned for the #1C1928 background.
export default function GridShape() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #D4AF6A 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-32 -left-24 h-[380px] w-[380px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #D4AF6A 0%, transparent 70%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #FFFFFF 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
