"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Error Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong in the Admin panel!</h2>
      <p className="text-sm font-mono bg-red-50 p-4 rounded-xl text-red-800 break-all">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-6 bg-caramel text-white px-4 py-2 rounded-xl"
      >
        Try again
      </button>
    </div>
  );
}
