import { NextResponse } from 'next/server';
import { normalSchema } from '@/schema';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { buildTrackingId } from '@/lib/pqrsdTracking';
import {
  assertValidAttachments,
  cleanupUploadedAttachments,
  normalizeIncomingFiles,
  uploadAttachments,
} from '@/lib/pqrsdAttachments';

export async function POST(request: Request) {
  let uploadedAttachments: Awaited<ReturnType<typeof uploadAttachments>> = [];

  try {
    const formData = await request.formData();
    const payloadRaw = formData.get('payload');

    if (typeof payloadRaw !== 'string') {
      return NextResponse.json(
        { success: false, errors: [{ message: 'No se encontro el payload de la solicitud.' }] },
        { status: 400 },
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(payloadRaw);
    } catch {
      return NextResponse.json(
        { success: false, errors: [{ message: 'El payload no tiene un formato JSON valido.' }] },
        { status: 400 },
      );
    }

    const attachments = normalizeIncomingFiles(formData.getAll('attachments'));
    assertValidAttachments(attachments);

    const validData = normalSchema.parse({
      ...(payload as Record<string, unknown>),
      attachments_count: attachments.length,
    });

    const trackingId = buildTrackingId('PQR');
    const supabase = getSupabaseServerClient();

    uploadedAttachments = await uploadAttachments({
      supabase,
      requestType: 'normal',
      trackingId,
      files: attachments,
    });

    const { error } = await supabase.from('pqrsd_requests').insert({
      tracking_id: trackingId,
      request_type: 'normal',
      status: 'received',
      subject: validData.subject,
      description: validData.description,
      incident_address: validData.incident_address,
      email: validData.email,
      phone: validData.phone,
      person_type: validData.person_type,
      doc_type: validData.doc_type || null,
      doc_number: validData.doc_number || null,
      full_name: validData.full_name,
      department: validData.department,
      city: validData.city,
      address: validData.address,
      attachments_count: validData.attachments_count,
      attachments: uploadedAttachments,
      payload: validData,
    });

    if (error) {
      await cleanupUploadedAttachments(supabase, uploadedAttachments);
      return NextResponse.json(
        { success: false, errors: [{ message: 'No fue posible guardar la solicitud en Supabase.' }] },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PQRSD radicada exitosamente con identidad verificada.',
      trackingId,
    });
  } catch (error: unknown) {
    if (uploadedAttachments.length) {
      const supabase = getSupabaseServerClient();
      await cleanupUploadedAttachments(supabase, uploadedAttachments);
    }

    const errors =
      typeof error === 'object' &&
      error !== null &&
      'errors' in error &&
      Array.isArray((error as { errors?: unknown[] }).errors)
        ? (error as { errors: unknown[] }).errors
        : [{ message: error instanceof Error ? error.message : 'Error de validacion' }];

    return NextResponse.json({ success: false, errors }, { status: 400 });
  }
}
