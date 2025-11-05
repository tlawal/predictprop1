'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  ClockIcon,
  Squares2X2Icon,
  PuzzlePieceIcon,
  TicketIcon,
  UsersIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ArrowDownTrayIcon,
  PlayCircleIcon,
  EnvelopeIcon,
  PhotoIcon,
  UserPlusIcon,
  MegaphoneIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

export const sidebarItems = [
  { name: 'Home', href: '/admin', icon: HomeIcon },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
  { name: 'Contracts', href: '/admin/contracts', icon: DocumentTextIcon },
  { name: 'Pending Enables', href: '/admin/pending-enables', icon: ClockIcon },
  { name: 'Product Categories', href: '/admin/product-categories', icon: Squares2X2Icon },
  { name: 'Plans', href: '/admin/plans', icon: PuzzlePieceIcon },
  { name: 'Add-Ons', href: '/admin/add-ons', icon: TicketIcon },
  { name: 'Discount Codes', href: '/admin/discount-codes', icon: TicketIcon },
  { name: 'Customers', href: '/admin/customers', icon: UsersIcon },
  { name: 'Affiliates', href: '/admin/affiliates', icon: UserGroupIcon },
  { name: 'Affiliate Payouts', href: '/admin/affiliates/payouts', icon: BanknotesIcon },
  { name: 'Prop Accounts', href: '/admin/prop-accounts', icon: BriefcaseIcon },
  { name: 'Risk', href: '/admin/risk', icon: ShieldCheckIcon },
  { name: 'Risk Triggers', href: '/admin/risk-triggers', icon: ExclamationTriangleIcon },
  { name: 'Payouts/Withdrawals', href: '/admin/payouts-withdrawals', icon: CurrencyDollarIcon },
  { name: 'Payments', href: '/admin/payments', icon: CurrencyDollarIcon },
  { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
  { name: 'FAQ', href: '/admin/faq', icon: QuestionMarkCircleIcon },
  { name: 'Downloads', href: '/admin/downloads', icon: ArrowDownTrayIcon },
  { name: 'Videos', href: '/admin/videos', icon: PlayCircleIcon },
  { name: 'Emails', href: '/admin/emails', icon: EnvelopeIcon },
  { name: 'Images', href: '/admin/images', icon: PhotoIcon },
  { name: 'Manage Users', href: '/admin/manage-users', icon: UserPlusIcon },
  { name: 'Announcements', href: '/admin/announcements', icon: MegaphoneIcon }
];

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function Sidebar({ className = '', onNavigate }) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleNavigate = (href) => {
    router.push(href);
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={cn(
        'flex w-64 flex-col gap-4 bg-gray-800 p-6 text-gray-300 dark:bg-gray-900',
        className
      )}
    >
      <div className="text-lg font-semibold text-white">PolyProp Admin</div>
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => handleNavigate(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-md p-2 text-left transition-colors',
                active ? 'bg-gray-700 text-white' : 'hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
