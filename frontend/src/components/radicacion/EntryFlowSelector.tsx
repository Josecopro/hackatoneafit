"use client";

import { useRouter } from 'next/navigation';
import { Building2, Landmark, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { InputField, StepCard } from '@/src/components/forms/sharedFields';

export default function EntryFlowSelector() {
  const router = useRouter();
  const [showNormalReqForm, setShowNormalReqForm] = useState(false);

  const goToAnonymousFlow = () => {
    router.push('/radicacion/anonima');
  };

  const goToNormalFlow = () => {
    router.push('/radicacion/normal');
  };

  const openNormalReqForm = () => {
    setShowNormalReqForm(true);
  };

  return (
    <main className="min-h-screen page-backdrop text-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <Landmark size={14} /> Plataforma oficial
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mt-5 leading-tight">PQRSD Alcaldía de Medellín</h1>
          <p className="text-slate-600 max-w-2xl mt-4 text-lg">
            Seleccione primero si su radicación será anónima o no anónima.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={openNormalReqForm}
            className="text-left bg-white/95 border border-slate-200 rounded-3xl p-7 shadow-[0_22px_50px_-34px_rgba(2,43,19,0.5)] hover:shadow-[0_22px_60px_-30px_rgba(2,43,19,0.55)] transition-all"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-5">
              <Building2 size={22} />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Radicacion de pQRS</h2>
            <p className="text-slate-600 mt-3 mb-2">
              Flujo completo para peticiones y solicitudes con identificación y contacto del solicitante.
            </p>
            <span className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-white font-bold mt-4">
              Radicacion de PQRS
            </span>
          </button>

          <button
            type="button"
            onClick={goToAnonymousFlow}
            className="text-left bg-white/95 border border-slate-200 rounded-3xl p-7 shadow-[0_22px_50px_-34px_rgba(2,43,19,0.5)] hover:shadow-[0_22px_60px_-30px_rgba(2,43,19,0.55)] transition-all"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 mb-5">
              <Lock size={22} />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Radicacion de PQRS anonimas</h2>
            <p className="text-slate-600 mt-3 mb-2">
              Canal reservado para denuncias y reportes sin exponer la identidad del ciudadano.
            </p>
            <span className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-white font-bold mt-4">
              Radicacion de PQRS anonimas
            </span>
          </button>
        </section>

        {showNormalReqForm && (
          <div className="mt-8 animate-fade-in">
            <StepCard
              stepNumber="1"
              title="REQ persona normal (no anonima)"
              subtitle="Para iniciar el requisito diligencie identificación, correo y aceptación de política"
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  goToNormalFlow();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField
                    id="entry_doc_type"
                    name="entry_doc_type"
                    label="Tipo de documento"
                    type="select"
                    options={[
                      { label: 'Cédula de ciudadanía', value: 'cc' },
                      { label: 'Cédula de extranjería', value: 'ce' },
                      { label: 'Tarjeta de identidad', value: 'ti' },
                      { label: 'Pasaporte', value: 'pa' },
                      { label: 'NIT', value: 'nit' },
                    ]}
                    required
                  />
                  <InputField
                    id="entry_doc_number"
                    name="entry_doc_number"
                    label="Número de documento"
                    placeholder="Ingrese su número de documento"
                    required
                  />
                  <InputField
                    id="entry_email"
                    name="entry_email"
                    label="Correo electrónico"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                  <InputField
                    id="entry_confirm_email"
                    name="entry_confirm_email"
                    label="Confirmar correo electrónico"
                    type="email"
                    placeholder="Repita su correo"
                    required
                  />
                </div>

                <div className="mt-5 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="entry_accept_policy"
                      required
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-emerald-900">
                      Acepto los términos, condiciones y políticas de privacidad.
                      {' '}
                      <Link
                        href="/politica-tratamiento-datos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline inline-flex items-center gap-1"
                      >
                        Abrir política de tratamiento de datos
                      </Link>
                    </span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-white font-bold hover:bg-emerald-800"
                  >
                    Continuar con Radicacion de pQRS
                  </button>
                </div>
              </form>
            </StepCard>
          </div>
        )}
      </div>
    </main>
  );
}
