export type PqrsPriority = 'Alta' | 'Media' | 'Baja';

export type PqrsStatus = 'Radicada' | 'En revision' | 'Respondida';

export interface PqrsRecord {
  id: string;
  ticket: string;
  citizenName: string;
  subject: string;
  description: string;
  draftResponse: string;
  requiresHumanReview: boolean;
  reviewReason: string;
  directedTo: string;
  status: PqrsStatus;
  priority: PqrsPriority;
  createdAt: string;
  businessDaysElapsed: number;
  businessDaysLimit: number;
  sentimentScore: number;
  lastResponseAt?: string;
}
