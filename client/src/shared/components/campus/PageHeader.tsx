interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export const PageHeader = ({ eyebrow, title, description }: PageHeaderProps) => (
  <header className="mb-8">
    {eyebrow && (
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-campus-primary">{eyebrow}</p>
    )}
    <h1
      className={`font-bold tracking-tight text-campus-foreground ${eyebrow ? 'mt-2 text-3xl sm:text-4xl' : 'text-3xl sm:text-4xl'}`}
    >
      {title}
    </h1>
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-campus-accent sm:text-base">
      {description}
    </p>
  </header>
);
