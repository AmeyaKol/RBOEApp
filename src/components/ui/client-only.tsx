'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientOnly Component
 * 
 * This component ensures that its children are only rendered on the client side,
 * preventing hydration mismatches caused by server/client differences.
 * 
 * Usage:
 * <ClientOnly fallback={<div>Loading...</div>}>
 *   <ComponentThatCausesHydrationIssues />
 * </ClientOnly>
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}




