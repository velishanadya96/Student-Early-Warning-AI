export default function Loading() {
  return (
    <div className="space-y-5 p-6">
      <div className="skeleton h-10 w-72 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((x) => <div key={x} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-72 rounded-2xl" />
    </div>
  );
}
