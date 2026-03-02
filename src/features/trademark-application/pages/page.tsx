import { Suspense } from "react";
import { TrademarkApplicationForm } from "../_components/TrademarkApplicationForm";

export default function TrademarkApplicationPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div>Loading...</div>}>
        <TrademarkApplicationForm />
      </Suspense>
    </div>
  );
}
