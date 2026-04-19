import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginView from '@/modules/admin-pqrs/LoginView';

export const metadata: Metadata = {
  title: 'Administracion PQRSD - Login',
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
