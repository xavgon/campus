import { Link } from 'react-router-dom';
import { ManualAudienceBadge } from '@/features/help/components/ManualAudienceBadge';
import type { ManualSection } from '@/shared/copy/userManual';

interface ManualSectionCardProps {
  section: ManualSection;
}

export const ManualSectionCard = ({ section }: ManualSectionCardProps) => (
  <article
    id={section.id}
    className="campus-panel scroll-mt-24 space-y-4 p-5 sm:p-7"
  >
    <header className="space-y-2 border-b border-campus-border/50 pb-4">
      <div className="flex flex-wrap gap-2">
        {section.audience.map((role) => (
          <ManualAudienceBadge key={role} audience={role} />
        ))}
      </div>
      <h2 className="text-xl font-bold text-campus-foreground sm:text-2xl">{section.title}</h2>
      <p className="text-sm text-campus-accent">{section.summary}</p>
    </header>

    {section.paragraphs.map((paragraph) => (
      <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-campus-accent">
        {paragraph}
      </p>
    ))}

    {section.steps && section.steps.length > 0 && (
      <ol className="space-y-4">
        {section.steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-campus-primary/40 bg-campus-primary/10 text-xs font-bold text-campus-primary">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-bold text-campus-foreground">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-campus-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    )}

    {section.links && section.links.length > 0 && (
      <div className="flex flex-wrap gap-2 border-t border-campus-border/40 pt-4">
        {section.links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-none border border-campus-border/80 px-3 py-1.5 text-xs font-bold text-campus-primary transition hover:border-campus-primary/50 hover:bg-campus-primary/10"
          >
            {link.label} →
          </Link>
        ))}
      </div>
    )}
  </article>
);
