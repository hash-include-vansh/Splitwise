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
    const { groupId, debtorId, creditorId, amount } = body

    if (!groupId || !debtorId || !creditorId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: groupId, debtorId, creditorId, amount' },
        { status: 400 }
      )
    }

    // Only the debtor can mark payment as paid
    if (debtorId !== user.id) {
      return NextResponse.json({ error: 'Only the debtor can mark payment as paid' }, { status: 403 })
    }

    const { data: payment, error } = await markPaymentAsPaid(groupId, debtorId, creditorId, amount, user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Send notification to creditor
    if (payment) {
      const { data: debtorData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', debtorId)
        .single()
      
      const debtorName = debtorData?.name || debtorData?.email || 'Someone'
      await notifyPaymentPending(creditorId, debtorName, amount, groupId, payment.id)
    }

    return NextResponse.json({ payment }, { status: 200 })
  } catch (error: any) {
    console.error('Error marking payment as paid:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

