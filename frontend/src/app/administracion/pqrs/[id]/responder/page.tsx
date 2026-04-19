import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PqrsReplyView from '@/modules/admin-pqrs/PqrsReplyView';
import { getPqrsById } from '@/modules/admin-pqrs/utils';

export const dynamic = 'force-dynamic';

type AdminPqrsReplyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Administracion PQRSD - Responder',
};

export default async function AdminPqrsReplyPage({ params }: AdminPqrsReplyPageProps) {
  const { id } = await params;
  const record = await getPqrsById(id);

  if (!record) {
    notFound();
  }

  return <PqrsReplyView record={record} />;
}
