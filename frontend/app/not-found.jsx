import Link from "next/link";
import Image from "next/image";
import GridShape from "@/components/common/GridShape";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#1C1928] p-6">
      <GridShape />

      <div className="mx-auto w-full max-w-md text-center">
        {/* Placeholder logo — swap this block for your actual logo/mark */}
        <Image
          src="/logo.jpeg"
          alt="logo"
          className="mx-auto mb-3 h-auto w-auto"
          width={472}
          height={152}
        />

        <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Page not found</h1>
        <p className="mb-8 text-base text-white/60">
          We can&apos;t find the page you&apos;re looking for. It may have moved, or the link might be off.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-center text-base font-medium text-black shadow-1 transition duration-300 ease-in-out hover:bg-gray-2 hover:text-body-color my-1"
        >
          Back to Home
        </Link>
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-sm text-white/40">
        &copy; {new Date().getFullYear()} Footy Scouts
      </p>
    </div>
  );
}
