// No partners yet — render a fixed set of placeholder slots.
// Swap each block for <a href="..."><img src="..." alt="..." /></a> once you have real logos.
const PLACEHOLDER_COUNT = 8;

export default function PartnersGrid() {
  return (
    <section className="bg-[#1C1928] py-20 min-h-screen lg:pb-30">
      <div className="container mx-auto px-6">
        <h2 className="mb-10 text-center text-2xl font-bold text-white sm:text-3xl">
          Our Partners
        </h2>
        <div className="-mx-4 flex flex-wrap items-center justify-center gap-8 xl:gap-11">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex h-25 w-45 items-center justify-center rounded-[15px] border-2 border-dashed border-white/15 bg-white/[0.03] text-xs font-medium uppercase tracking-wide text-white/30"
            >
              Partner Logo
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}