'use client';

import React, { ReactNode } from 'react';
import { AuthProvider as AuthContextProvider } from '@/hooks/useAuth';

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
} 