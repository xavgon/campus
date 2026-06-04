export const AuthFormSkeleton = () => (
  <div
    className="campus-panel w-full max-w-md animate-pulse p-7 sm:p-8"
    aria-busy="true"
    aria-label="A carregar formulário"
  >
    <div className="mb-6 h-8 w-1/2 rounded-none bg-white/10" />
    <div className="mb-8 h-4 w-full rounded-none bg-white/10" />
    <div className="space-y-4">
      <div className="h-14 rounded-none bg-white/10" />
      <div className="h-14 rounded-none bg-white/10" />
      <div className="h-12 rounded-none bg-campus-primary/20" />
    </div>
  </div>
);
