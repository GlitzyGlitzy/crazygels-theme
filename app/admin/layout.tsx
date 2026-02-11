import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Crazy Gels',
  description: 'Internal admin tools for Crazy Gels',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
