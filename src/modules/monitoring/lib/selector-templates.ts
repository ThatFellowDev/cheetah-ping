import {
  ShoppingCart,
  Briefcase,
  Building2,
  CalendarCheck,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface SelectorTemplate {
  selector: string;
  label: string;
  description: string;
  category: string;
  icon: LucideIcon;
}

export const selectorTemplates: SelectorTemplate[] = [
  // E-commerce
  { selector: '.price', label: 'Product price', description: 'Most common price class', category: 'E-commerce', icon: ShoppingCart },
  { selector: '[data-price]', label: 'Price (data attr)', description: 'Price stored in data attribute', category: 'E-commerce', icon: ShoppingCart },
  { selector: '.availability, .stock-status', label: 'Stock status', description: 'In-stock / out-of-stock indicator', category: 'E-commerce', icon: ShoppingCart },

  // Job boards
  { selector: '.job-listing, .job-card', label: 'Job listings', description: 'Job posting cards', category: 'Jobs', icon: Briefcase },
  { selector: '.posting, [data-job-id]', label: 'Job postings', description: 'Individual job entries', category: 'Jobs', icon: Briefcase },

  // Real estate
  { selector: '.listing-price', label: 'Listing price', description: 'Property listing price', category: 'Real estate', icon: Building2 },
  { selector: '.property-card, .listing-card', label: 'Property cards', description: 'Property listing entries', category: 'Real estate', icon: Building2 },

  // Appointments
  { selector: '.appointment-slot, .availability', label: 'Appointment slots', description: 'Available time slots', category: 'Appointments', icon: CalendarCheck },
  { selector: 'table.schedule, .calendar', label: 'Schedule table', description: 'Schedule or calendar content', category: 'Appointments', icon: CalendarCheck },

  // Generic
  { selector: 'main', label: 'Main content', description: 'Primary page content', category: 'Generic', icon: FileText },
  { selector: 'article', label: 'Article', description: 'Article or blog post body', category: 'Generic', icon: FileText },
  { selector: 'h1', label: 'Page title', description: 'Main heading of the page', category: 'Generic', icon: FileText },
];
