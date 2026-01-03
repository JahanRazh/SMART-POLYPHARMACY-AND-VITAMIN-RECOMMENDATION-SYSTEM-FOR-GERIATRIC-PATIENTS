// app/not-found.tsx
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center text-center min-h-screen p-6 bg-white">
      {/* 404 illustration */}
      <Image
        src="/images/NotFound.png"       // path relative to public/
        alt="Page not found"
        width={400}
        height={400}
        className="mb-8"
      />

      {/* Message */}
      <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">
        The page you’re looking for doesn’t exist.
      </p>

      <Link
        href="/"
        className="mt-6 inline-block text-teal-600 hover:text-teal-700 font-medium"
      >
        ← Back to Home
      </Link>
    </main>
  );
}
