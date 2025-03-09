'use client';

import React from 'react';
import AuthProvider from './auth-provider';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = React.useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
} 