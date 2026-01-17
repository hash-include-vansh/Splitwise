import { createClient } from '@/lib/supabase/server'
import { acceptPayment, getPaymentById } from '@/lib/services/payments'
import { notifyPaymentAccepted } from '@/lib/services/notifications'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paymentId = params.id

    // First, get the payment to check if user is the creditor
    const { data: payment, error: fetchError } = await getPaymentById(paymentId)

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Only the creditor can accept payment
    if (payment.creditor_id !== user.id) {
      return NextResponse.json({ error: 'Only the creditor can accept payment' }, { status: 403 })
    }

    const { data: updatedPayment, error } = await acceptPayment(paymentId, user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Send notification to debtor
    if (updatedPayment) {
      const { data: creditorData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', payment.creditor_id)
        .single()
      
      const creditorName = creditorData?.name || creditorData?.email || 'Someone'
      await notifyPaymentAccepted(payment.debtor_id, creditorName, payment.amount, payment.group_id, paymentId)
    }

    return NextResponse.json({ payment: updatedPayment }, { status: 200 })
  } catch (error: any) {
    console.error('Error accepting payment:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

