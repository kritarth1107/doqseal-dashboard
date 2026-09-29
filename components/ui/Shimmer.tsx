export function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} aria-hidden="true" />;
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          aria-hidden="true"
        >
          <div className="flex items-start justify-between mb-4">
            <Shimmer className="h-9 w-9 rounded-xl" />
            <Shimmer className="h-5 w-14 rounded-full" />
          </div>
          <Shimmer className="h-3 w-28 rounded" />
          <Shimmer className="h-7 w-16 rounded mt-3" />
        </div>
      ))}
    </>
  );
}

const CHART_HEIGHTS = ["h-16", "h-28", "h-12", "h-36", "h-24", "h-10", "h-32"];

export function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-3 h-52 w-full ${className}`} aria-hidden="true">
      {CHART_HEIGHTS.map((height, index) => (
        <div key={index} className="flex-1 flex flex-col items-center justify-end gap-3">
          <Shimmer className={`w-full rounded-t-lg ${height}`} />
          <Shimmer className="h-2.5 w-7 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-100" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-4 px-6 py-4">
          <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
          <Shimmer className="h-3.5 w-40 rounded" />
          <Shimmer className="h-3.5 w-20 rounded hidden sm:block" />
          <Shimmer className="h-3.5 flex-1 rounded hidden md:block" />
          <Shimmer className="h-3.5 w-16 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({
  rows = 5,
  framed = true,
}: {
  rows?: number;
  framed?: boolean;
}) {
  const body = (
    <div className={framed ? "divide-y divide-gray-100" : "space-y-3"} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 p-5">
          <Shimmer className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Shimmer className="h-4 w-1/3 rounded" />
            <Shimmer className="h-3 w-1/2 rounded" />
          </div>
          <Shimmer className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );

  if (!framed) {
    return (
      <div aria-busy="true" aria-label="Loading">
        {body}
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
      aria-busy="true"
      aria-label="Loading"
    >
      {body}
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <Shimmer className="h-10 w-10 rounded-xl" />
            <Shimmer className="h-5 w-16 rounded-full" />
          </div>
          <Shimmer className="h-4 w-2/3 rounded" />
          <Shimmer className="h-3 w-full rounded mt-3" />
          <Shimmer className="h-3 w-4/5 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

export function StackedCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <Shimmer className="h-5 w-40 rounded" />
            <Shimmer className="h-6 w-20 rounded-full" />
          </div>
          <Shimmer className="h-3 w-full rounded" />
          <Shimmer className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="max-w-xl space-y-5" aria-busy="true" aria-label="Loading">
      <Shimmer className="h-7 w-48 rounded" />
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Shimmer className="h-3 w-24 rounded" />
          <Shimmer className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-6 flex gap-4"
      aria-busy="true"
      aria-label="Loading"
    >
      <Shimmer className="h-16 w-16 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Shimmer className="h-5 w-40 rounded" />
        <Shimmer className="h-3 w-64 max-w-full rounded" />
        <Shimmer className="h-3 w-48 rounded" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div
      className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <Shimmer className="h-4 w-24 rounded" />
        <Shimmer className="h-8 w-72 max-w-full rounded" />
        <Shimmer className="h-4 w-96 max-w-full rounded" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <Shimmer className="h-48 w-full rounded-xl" />
            <Shimmer className="h-4 w-full rounded" />
            <Shimmer className="h-4 w-5/6 rounded" />
            <Shimmer className="h-4 w-2/3 rounded" />
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
            <Shimmer className="h-5 w-32 rounded" />
            <Shimmer className="h-10 w-full rounded-lg" />
            <Shimmer className="h-10 w-full rounded-lg" />
            <Shimmer className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudioSkeleton() {
  return (
    <div className="flex h-full min-h-[24rem] bg-[#f8fafc] p-4 sm:p-6 gap-4" aria-busy="true" aria-label="Loading">
      <Shimmer className="flex-1 rounded-xl min-h-[20rem]" />
      <div className="hidden md:flex w-72 shrink-0 flex-col gap-3">
        <Shimmer className="h-10 w-full rounded-lg" />
        <Shimmer className="h-28 w-full rounded-xl" />
        <Shimmer className="h-28 w-full rounded-xl" />
        <Shimmer className="h-10 w-full rounded-lg mt-auto" />
      </div>
    </div>
  );
}
