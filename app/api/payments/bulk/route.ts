import { createClient } from '@/lib/supabase/server'
import { markPaymentAsPaid } from '@/lib/services/payments'
import { notifyPaymentPending } from '@/lib/services/notifications'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, payments } = body

    if (!groupId || !payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: groupId, payments (array)' },
        { status: 400 }
      )
    }

    // Validate all payments have the current user as debtor
    for (const p of payments) {
      if (!p.debtor_id || !p.creditor_id || !p.amount) {
        return NextResponse.json(
          { error: 'Each payment must have debtor_id, creditor_id, and amount' },
          { status: 400 }
        )
      }
      if (p.debtor_id !== user.id) {
        return NextResponse.json(
          { error: 'Only the debtor can mark payment as paid' },
          { status: 403 }
        )
      }
    }

    const createdPayments = []
    const errors = []

    // Get debtor name for notifications
    const { data: debtorData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const debtorName = debtorData?.name || debtorData?.email || 'Someone'

    for (const p of payments) {
      const { data: payment, error } = await markPaymentAsPaid(
        groupId,
        p.debtor_id,
        p.creditor_id,
        p.amount,
        user.id
      )

      if (error) {
        errors.push({ ...p, error: error.message })
      } else if (payment) {
        createdPayments.push(payment)
        // Send notification to each creditor
        await notifyPaymentPending(p.creditor_id, debtorName, p.amount, groupId, payment.id)
      }
    }

    if (createdPayments.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: errors[0]?.error || 'Failed to create any payments' },
        { status: 400 }
      )
    }

    return NextResponse.json({ payments: createdPayments, errors }, { status: 200 })
  } catch (error: any) {
    console.error('Error creating bulk payments:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
