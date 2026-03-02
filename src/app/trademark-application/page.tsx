import { Suspense } from "react";
import { TrademarkApplicationForm } from "@/features/trademark-application";

export default function TrademarkApplicationPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div>Loading...</div>}>
        <TrademarkApplicationForm />
      </Suspense>
    </div>
  );
}
