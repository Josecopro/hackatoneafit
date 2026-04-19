import type { Metadata } from 'next';
import PqrsListView from '@/modules/admin-pqrs/PqrsListView';
import { getPqrsOldestFirst } from '@/modules/admin-pqrs/utils';

export const metadata: Metadata = {
  title: 'Administracion PQRSD - Listado',
};

export default async function AdminPqrsListPage() {
  const records = await getPqrsOldestFirst();
  return <PqrsListView records={records} />;
}
