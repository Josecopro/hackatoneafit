import type { Metadata } from 'next';
import LoginView from '@/modules/admin-pqrs/LoginView';

export const metadata: Metadata = {
  title: 'Administracion PQRSD - Login',
};

export default function AdminLoginPage() {
  return <LoginView />;
}
