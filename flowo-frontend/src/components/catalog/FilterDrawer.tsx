export default function FilterDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex">
      <div className="w-64 bg-white p-4 shadow-lg">
        <h3 className="font-semibold text-slate-800">Filters</h3>
        {/* add real filters here */}
        <button className="mt-4 text-sm text-green-700" onClick={onClose}>Close</button>
      </div>
      <div className="flex-1 bg-black/30" onClick={onClose} />
    </div>
  );
}
