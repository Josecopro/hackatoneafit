import { NextResponse } from 'next/server';
import { anonymousSchema } from '@/src/schema';
import { getSupabaseServerClient } from '@/src/lib/supabaseServer';
import { buildTrackingId } from '@/src/lib/pqrsdTracking';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validData = anonymousSchema.parse(body);
    const trackingId = buildTrackingId('ANON');
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.from('pqrsd_requests').insert({
      tracking_id: trackingId,
      request_type: 'anonymous',
      status: 'received',
      subject: validData.subject,
      description: validData.description,
      incident_address: validData.incident_address,
      email: validData.email || null,
      phone: validData.phone || null,
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
      message: 'PQRSD radicada exitosamente de forma anonima.',
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
