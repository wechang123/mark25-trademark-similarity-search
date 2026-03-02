export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
        <p className="text-neutral-600 text-lg">
          상표 출원 서비스를 준비하고 있습니다...
        </p>
      </div>
    </div>
  );
}
