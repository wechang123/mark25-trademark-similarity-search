import { Suspense } from "react";
import { TrademarkApplicationSuccess } from "../../_components/TrademarkApplicationSuccess";

export default function TrademarkApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div>Loading...</div>}>
        <TrademarkApplicationSuccess />
      </Suspense>
    </div>
  );
}
