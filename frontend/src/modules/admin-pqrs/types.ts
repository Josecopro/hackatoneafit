export type PqrsPriority = 'Alta' | 'Media' | 'Baja';

export type PqrsStatus = 'Radicada' | 'En revision' | 'Respondida';

export interface PqrsAttachment {
  name: string;
  path: string;
  mimeType: string;
  size: number;
  url?: string;
  urlError?: string;
}

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
  attachments: PqrsAttachment[];
}
