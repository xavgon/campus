export const DashboardSkeleton = () => (
  <div className="campus-page-enter space-y-8 animate-pulse" aria-busy="true" aria-label="A carregar dashboard">
    <div className="campus-panel h-36 sm:h-32" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="campus-panel h-20" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="campus-panel h-64 lg:col-span-2" />
      <div className="space-y-4">
        <div className="campus-panel h-28" />
        <div className="campus-panel h-28" />
      </div>
    </div>
  </div>
);
