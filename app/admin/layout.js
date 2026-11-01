import AdminShell from '@/components/AdminShell';

export const metadata = {
  title: 'Admin Portal | Moon Light Resort',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
