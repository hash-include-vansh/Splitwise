import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/services/notifications'
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

    // Only the creditor can send a reminder
    if (creditorId !== user.id) {
      return NextResponse.json(
        { error: 'Only the creditor can send a payment reminder' },
        { status: 403 }
      )
    }

    // Get creditor name for the notification
    const { data: creditorData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', creditorId)
      .single()

    const creditorName = creditorData?.name || creditorData?.email || 'Someone'

    const { data: notification, error } = await createNotification(
      debtorId,
      'payment_reminder',
      'Payment Reminder',
      `${creditorName} is reminding you to pay ₹${amount.toFixed(2)}`,
      { groupId, amount, creditorName }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ notification }, { status: 200 })
  } catch (error: any) {
    console.error('Error sending payment reminder:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
