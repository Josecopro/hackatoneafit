import type { Metadata } from 'next';
import PqrsListView from '@/modules/admin-pqrs/PqrsListView';

export const metadata: Metadata = {
  title: 'Administracion PQRSD - Listado',
};

export default function AdminPqrsListPage() {
  return <PqrsListView />;
}
