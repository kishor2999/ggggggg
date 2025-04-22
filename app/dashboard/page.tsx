import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

// Define metadata type
type UserMetadata = {
  role?: 'customer' | 'employee' | 'admin';
};

export default async function DashboardPage() {
  const { sessionClaims } = await auth();
  
  // Get user role from session claims
  const metadata = sessionClaims?.metadata as UserMetadata || {};
  const role = metadata.role;
  
  // Redirect based on role
  switch (role) {
    case 'admin':
      redirect('/dashboard/admin');
    case 'employee':
      redirect('/dashboard/employee');
    case 'customer':
      redirect('/dashboard/user');
    default:
      // Fallback for users without a role
      redirect('/dashboard/user');
  }
} 