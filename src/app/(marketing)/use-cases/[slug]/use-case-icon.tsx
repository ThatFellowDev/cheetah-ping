import {
  Globe,
  TrendingDown,
  ShoppingCart,
  Package,
  Cpu,
  Footprints,
  Layers,
  Ticket,
  UtensilsCrossed,
  Home,
  Briefcase,
  GraduationCap,
  BookOpen,
  Plane,
  Eye,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Search,
  Globe2,
  GitBranch,
  FileCode,
  LineChart,
  Gavel,
  Monitor,
  Tag,
  FileText,
  Newspaper,
  Building,
  Users,
  type LucideProps,
} from 'lucide-react';

const iconMap: Record<string, React.FC<LucideProps>> = {
  Globe,
  TrendingDown,
  ShoppingCart,
  Package,
  Cpu,
  Footprints,
  Layers,
  Ticket,
  UtensilsCrossed,
  Home,
  Briefcase,
  GraduationCap,
  BookOpen,
  Plane,
  Eye,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Search,
  Globe2,
  GitBranch,
  FileCode,
  LineChart,
  Gavel,
  Monitor,
  Tag,
  FileText,
  Newspaper,
  Building,
  Users,
};

export function UseCaseIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = iconMap[name] || Globe;
  return <Icon className={className} style={style} />;
}
