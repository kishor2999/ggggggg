import { ReactNode } from 'react';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Administration dashboard for car wash system',
};

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
} 