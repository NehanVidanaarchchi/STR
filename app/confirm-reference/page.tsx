// app/confirm-reference/page.tsx
import { Suspense } from "react";
import ConfirmReferencePage from "./ConfirmReferencePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmReferencePage />
    </Suspense>
  );
}