export const PodcastListSkeleton = () => (
  <div
    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    aria-busy="true"
    aria-label="A carregar episódios"
  >
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="campus-panel animate-pulse overflow-hidden">
        <div className="aspect-[16/10] bg-white/10" />
        <div className="space-y-3 p-5">
          <div className="h-3 w-16 bg-white/10" />
          <div className="h-5 w-full bg-white/10" />
          <div className="h-4 w-4/5 bg-white/10" />
          <div className="h-3 w-24 bg-white/10" />
        </div>
      </div>
    ))}
  </div>
);
