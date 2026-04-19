import { NextResponse } from 'next/server';
import { normalSchema } from '@/src/schema';
import { getSupabaseServerClient } from '@/src/lib/supabaseServer';
import { buildTrackingId } from '@/src/lib/pqrsdTracking';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validData = normalSchema.parse(body);
    const trackingId = buildTrackingId('PQR');
    const supabase = getSupabaseServerClient();

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
      payload: validData,
    });

    if (error) {
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
    const errors =
      typeof error === 'object' &&
      error !== null &&
      'errors' in error &&
      Array.isArray((error as { errors?: unknown[] }).errors)
        ? (error as { errors: unknown[] }).errors
        : [{ message: 'Error de validacion' }];

    return NextResponse.json({ success: false, errors }, { status: 400 });
  }
}
