import { useLayoutEffect, useRef, useState } from 'react';

interface NavIndicatorStyle {
  left: number;
  width: number;
  ready: boolean;
}

export const useNavIndicator = (
  pathname: string,
  isLoading: boolean,
  isAuthenticated: boolean,
) => {
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<NavIndicatorStyle>({
    left: 0,
    width: 0,
    ready: false,
  });

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const update = () => {
      const active = nav.querySelector<HTMLElement>('.campus-nav-link--active');
      if (!active) {
        setIndicator((prev) => ({ ...prev, ready: false }));
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      setIndicator({
        left: activeRect.left - navRect.left,
        width: activeRect.width,
        ready: true,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(nav);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [pathname, isLoading, isAuthenticated]);

  return { navRef, indicator };
};
