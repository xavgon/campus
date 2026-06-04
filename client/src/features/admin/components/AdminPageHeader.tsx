interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export const AdminPageHeader = ({ eyebrow, title, description }: AdminPageHeaderProps) => (
  <header className="mb-6 border-b border-campus-border/60 pb-5">
    {eyebrow && (
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-campus-primary">{eyebrow}</p>
    )}
    <h1
      className={`font-bold tracking-tight text-campus-foreground ${eyebrow ? 'mt-2 text-2xl sm:text-3xl' : 'text-2xl sm:text-3xl'}`}
    >
      {title}
    </h1>
    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-campus-accent">{description}</p>
  </header>
);
