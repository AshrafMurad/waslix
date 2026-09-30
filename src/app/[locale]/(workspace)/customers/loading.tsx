export default function CustomersLoading() {
  return (
    <div aria-hidden="true" className="waslix-page">
      <div className="space-y-2">
        <div className="bg-raised h-3 w-24 animate-pulse rounded" />
        <div className="bg-raised h-8 w-56 animate-pulse rounded" />
        <div className="bg-raised h-4 w-full max-w-2xl animate-pulse rounded" />
      </div>
      <div className="bg-surface border-border/80 overflow-hidden rounded-lg border">
        <div className="grid gap-3 border-b p-4 md:grid-cols-5">
          <div className="bg-raised h-10 animate-pulse rounded-md md:col-span-2" />
          <div className="bg-raised hidden h-10 animate-pulse rounded-md md:block" />
          <div className="bg-raised hidden h-10 animate-pulse rounded-md md:block" />
          <div className="bg-raised hidden h-10 animate-pulse rounded-md md:block" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="grid gap-3 p-4 md:grid-cols-6">
              <div className="bg-raised h-10 animate-pulse rounded-md md:col-span-2" />
              <div className="bg-raised h-10 animate-pulse rounded-md" />
              <div className="bg-raised hidden h-10 animate-pulse rounded-md md:block" />
              <div className="bg-raised hidden h-10 animate-pulse rounded-md md:block" />
              <div className="bg-raised hidden h-10 animate-pulse rounded-md md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
