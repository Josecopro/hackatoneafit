export type Option = {
  label: string;
  value: string;
};

export const PERSON_OPTIONS: Option[] = [
  { label: 'Natural', value: 'natural' },
  { label: 'Juridica', value: 'juridica' },
  { label: 'Niños, niñas y adolescentes', value: 'nna' },
  { label: 'Ente publico', value: 'ente_publico' },
];

export const DOC_OPTIONS_BY_PERSON: Record<string, Option[]> = {
  natural: [
    { label: 'Cédula de ciudadanía', value: 'cc' },
    { label: 'Cédula de extranjería', value: 'ce' },
    { label: 'Tarjeta de identidad', value: 'ti' },
    { label: 'Pasaporte', value: 'pa' },
    { label: 'NIT', value: 'nit' },
  ],
  juridica: [{ label: 'NIT', value: 'nit' }],
  nna: [{ label: 'Tarjeta de identidad', value: 'ti' }],
  ente_publico: [],
};

export const GENDER_OPTIONS: Option[] = [
  { label: 'Femenino', value: 'femenino' },
  { label: 'Masculino', value: 'masculino' },
  { label: 'No binario', value: 'no_binario' },
  { label: 'Prefiero no responder', value: 'no_responde' },
];
