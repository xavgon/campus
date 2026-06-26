import { BookIcon } from '@/shared/components/ui/icons';
import type { NavIconKey } from '@/shared/navigation/navConfig';

interface NavIconProps {
  name: NavIconKey;
  size?: number;
}

export const NavIcon = ({ name, size }: NavIconProps) => {
  switch (name) {
    case 'book':
      return <BookIcon size={size} />;
    default:
      return null;
  }
};
