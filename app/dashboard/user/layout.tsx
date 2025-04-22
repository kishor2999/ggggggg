import { ReactNode } from 'react';

export const metadata = {
  title: 'Customer Dashboard',
  description: 'Customer dashboard for car wash system',
};

export default function UserDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
} 