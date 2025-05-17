import { ReactNode } from 'react';
import ClientLayout from '../client-layout';

export const metadata = {
  title: 'Dashboard',
  description: 'Car Wash System Dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
} 