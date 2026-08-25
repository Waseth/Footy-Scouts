import GridShape from "@/components/common/GridShape";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#1C1928]">
      <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
        {children}

        {/* Brand panel — hidden on mobile, mirrors the original template's right-side panel */}
        <div className="hidden w-full items-center bg-[#242030] lg:grid lg:w-1/2">
          <div className="relative flex items-center justify-center">
            <GridShape />
            <div className="flex max-w-xs flex-col items-center px-6 text-center">
              <Link href="/" className="mb-4 block">
                <Image
                  src="/logo-modified.png"
                  loading="eager"
                  alt="logo"
                  className="mx-auto mb-3 h-auto w-auto"
                  width={472}
                  height={152}
                />
                <h1 className="text-4xl font-bold text-white">
                  Footy Scouts
                </h1>
              </Link>
              <p className="gold-font text-base">
                From grassroots to the professionals — get discovered.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
