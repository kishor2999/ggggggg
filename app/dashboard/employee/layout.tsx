import { ReactNode } from 'react';

export const metadata = {
  title: 'Employee Dashboard',
  description: 'Employee dashboard for car wash system',
};

export default function EmployeeDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
} 