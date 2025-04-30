export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="relative">
        {/* Simple loading spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-blue-200">
          <div className="w-full h-full rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 text-sm text-gray-600 text-center animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
