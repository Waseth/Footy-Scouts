import Image from "next/image";
export default function AboutIntro() {
  return (
    <section className="bg-[#1C1928] pb-8 pt-20 lg:pb-17.5 lg:pt-30 min-h-screen">
      <div className="container mx-auto px-6 lg:px-16">
        <div className="-mx-4 flex flex-wrap items-center">
          <div className="w-full px-4 lg:w-1/2">
            <div className="mb-12 max-w-135 lg:mb-0">
              <h2 className="mb-5 text-3xl font-bold leading-tight text-white sm:text-[40px] sm:leading-[1.2]">
                Footy Scouts
              </h2>

              <p className="gold-font mb-1 text-base font-extrabold uppercase leading-relaxed">
                Vision
              </p>
              <p className="mb-10 text-base leading-relaxed text-white/60">
                Every talented player deserves to be seen, recognized and given the
                opportunity to succeed regardless of their background or location.
              </p>

              <p className="gold-font mb-1 text-base font-extrabold uppercase leading-relaxed">
                Mission
              </p>
              <p className="mb-10 text-base leading-relaxed text-white/60">
                To uncover hidden football talent, provide credible scouting insights and
                bridge the gap between players, coaches, scouts, and clubs through trusted
                evaluation, storytelling and exposure.
              </p>
            </div>
          </div>

          <div className="w-full px-4 lg:w-1/2">
            <div className="h-full min-h-80">
              {/* Placeholder — swap for your own <Image src="..." /> */}
              <Image
                  src="/logo-modified.png"
                  loading="eager"
                  alt="logo"
                  className="mx-auto mb-3 h-auto w-auto"
                  width={472}
                  height={152}
                />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}