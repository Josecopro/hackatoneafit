export type PqrsPriority = 'Alta' | 'Media' | 'Baja';

export type PqrsStatus = 'Radicada' | 'En revision' | 'Respondida';

export interface PqrsRecord {
  id: string;
  ticket: string;
  citizenName: string;
  subject: string;
  description: string;
  directedTo: string;
  status: PqrsStatus;
  priority: PqrsPriority;
  createdAt: string;
  lastResponseAt?: string;
}
