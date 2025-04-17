// This component will be rendered while the page is loading
export default function Loading() {
  // You can add any UI you want here, like a spinner or a skeleton loader
  return (
    <div className="p-4 text-center">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 mx-auto" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-4/6 mx-auto" />
        </div>
      </div>
      <p className="mt-4 text-gray-600">Loading scenario...</p>
    </div>
  );
}
