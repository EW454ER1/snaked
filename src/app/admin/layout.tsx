"use client"

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield } from 'lucide-react';

function AdminLoading() {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Shield className="w-12 h-12 text-primary animate-pulse" />
            <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let isAdmin = false;
    try {
      // sessionStorage is only available on the client.
      isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    } catch (e) {
      // This can happen in server environments or if storage is disabled.
      isAdmin = false;
    }

    if (pathname !== '/admin/login' && !isAdmin) {
      router.replace('/admin/login');
    } else {
      setIsVerified(true);
    }
  }, [pathname, router]);

  // While verifying on the client, render a loading state.
  // This ensures the server and client both render the same thing initially.
  if (!isVerified) {
    return <AdminLoading />;
  }

  return <>{children}</>;
}
