// app/confirm-reference/ConfirmReferencePage.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ConfirmReferencePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(
          `/api/company/references/confirm?token=${token}`
        );

        if (!res.ok) {
          throw new Error("Invalid token");
        }

        setStatus("success");
      } catch {
        setStatus("error");
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
        {status === "loading" && (
          <p className="text-gray-600">Confirming reference...</p>
        )}

        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold text-green-600">
              Reference confirmed
            </h1>
            <p className="mt-2 text-gray-600">
              Thank you for confirming. You may now close this page.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-red-600">
              Invalid or expired link
            </h1>
            <p className="mt-2 text-gray-600">
              This confirmation link is no longer valid.
            </p>
          </>
        )}
      </div>
    </div>
  );
}