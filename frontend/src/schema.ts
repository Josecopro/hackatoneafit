import { z } from 'zod';

const personDocMap: Record<string, string[]> = {
  natural: ['cc', 'ce', 'ti', 'pa'],
  juridica: ['nit'],
  nna: ['ti'],
  ente_publico: [],
};

const baseDocumentNumberSchema = z
  .string()
  .max(20, 'Número muy largo')
  .regex(/^[0-9a-zA-Z]*$/, 'Documento inválido');

const optionalEmailSchema = z.union([z.literal(''), z.string().email('Dirección de correo inválida')]);
const optionalPhoneSchema = z.union([
  z.literal(''),
  z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(15, 'El teléfono es muy largo')
    .regex(/^[0-9\s\-\+]+$/, 'Número de teléfono inválido'),
]);

export const normalSchema = z
  .object({
    person_type: z.enum(['natural', 'juridica', 'nna', 'ente_publico'], {
      errorMap: () => ({ message: 'Seleccione un tipo de persona' }),
    }),
    doc_type: z.string().optional().default(''),
    doc_number: baseDocumentNumberSchema.optional().default(''),
    email: z.string().email('Dirección de correo electrónico inválida'),
    confirm_email: z.string().email('Confirme un correo válido'),
    accept_policy: z.boolean().refine((val) => val === true, {
      message: 'Debe aceptar la política de tratamiento de datos',
    }),
    full_name: z.string().min(3, 'Ingrese nombres y apellidos').max(120),
    gender: z.string().min(1, 'Seleccione un género'),
    department: z.string().min(2, 'Ingrese el departamento').max(80),
    city: z.string().min(2, 'Ingrese la ciudad').max(80),
    address: z.string().min(5, 'Ingrese una dirección válida').max(120),
    subject: z.string().min(5, 'El asunto debe ser más descriptivo').max(150),
    phone: z
      .string()
      .min(7, 'El teléfono debe tener al menos 7 dígitos')
      .max(15, 'El teléfono es muy largo')
      .regex(/^[0-9\s\-\+]+$/, 'Número de teléfono inválido'),
    incident_address: z.string().min(5, 'Ingrese la dirección del hecho').max(150),
    preferential_attention: z.boolean().optional(),
    information_request: z.boolean().optional(),
    notifications: z.boolean().optional(),
    description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(2000),
    verification_check: z.boolean().refine((val) => val === true, {
      message: 'Debe marcar el campo de verificación',
    }),
    accept_terms: z.boolean().refine((val) => val === true, {
      message: 'Debe aceptar los términos y condiciones',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.email !== data.confirm_email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Los correos no coinciden',
        path: ['confirm_email'],
      });
    }

    const allowedDocs = personDocMap[data.person_type];
    const requiresDocument = allowedDocs.length > 0;

    if (requiresDocument) {
      if (!data.doc_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Seleccione un tipo de documento',
          path: ['doc_type'],
        });
      } else if (!allowedDocs.includes(data.doc_type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tipo de documento no permitido para este tipo de persona',
          path: ['doc_type'],
        });
      }

      if (!data.doc_number || data.doc_number.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El número de documento es requerido',
          path: ['doc_number'],
        });
      }
    }
  });

export const anonymousSchema = z.object({
  email: optionalEmailSchema.optional(),
  phone: optionalPhoneSchema.optional(),
  subject: z.string().min(5, 'El asunto debe ser más descriptivo').max(150),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(2000),
  incident_address: z.string().min(5, 'Ingrese la dirección del hecho').max(150),
  authorize_information: z.boolean().refine((val) => val === true, {
    message: 'Debe autorizar el uso de la información para continuar',
  }),
  accept_terms: z.boolean().refine((val) => val === true, {
    message: 'Debe aceptar los términos y condiciones',
  }),
});
