export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-xs mt-3">Loading...</p>
      </div>
    </div>
  );
}
