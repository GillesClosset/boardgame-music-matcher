'use client';

import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthConfig } from '@/lib/auth-config';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = React.useState(() => new QueryClient());
  
  // Configure Supabase auth
  useAuthConfig();
  
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
} 