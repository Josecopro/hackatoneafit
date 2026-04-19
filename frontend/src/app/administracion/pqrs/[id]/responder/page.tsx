import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PqrsReplyView from '@/modules/admin-pqrs/PqrsReplyView';
import { getPqrsById } from '@/modules/admin-pqrs/utils';

type AdminPqrsReplyPageProps = {
  params: {
    id: string;
  };
};

export const metadata: Metadata = {
  title: 'Administracion PQRSD - Responder',
};

export default function AdminPqrsReplyPage({ params }: AdminPqrsReplyPageProps) {
  const record = getPqrsById(params.id);

  if (!record) {
    notFound();
  }

  return <PqrsReplyView record={record} />;
}
