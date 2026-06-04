import { FEATURES } from '@/shared/styles/brand';

export const FeatureList = () => (
  <ul className="mt-8 grid gap-3 sm:grid-cols-1">
    {FEATURES.map((feature, index) => (
      <li
        key={feature.title}
        className="campus-feature-card campus-page-enter"
        style={{ animationDelay: `${0.08 + index * 0.07}s` }}
      >
        <p className="text-sm font-semibold text-campus-primary">{feature.title}</p>
        <p className="mt-1 text-sm text-campus-accent">{feature.description}</p>
      </li>
    ))}
  </ul>
);
