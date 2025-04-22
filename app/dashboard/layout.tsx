import { ReactNode } from 'react';

export const metadata = {
  title: 'Dashboard',
  description: 'Car Wash System Dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
} 