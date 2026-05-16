import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface SettlementPeriod {
  label: string
  start: string         // YYYY-MM-DD
  end: string           // YYYY-MM-DD
  settlementDate: string // YYYY-MM-DD
  type: 'A' | 'B'
}

/** Returns the period that contains the given date (defaults to now). */
export function getPeriodForDate(date: Date = new Date()): SettlementPeriod {
  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()

  let start: Date, end: Date, settle: Date, type: 'A' | 'B'

  if (day >= 27) {
    type = 'A'
    start = new Date(year, month, 27)
    end = new Date(year, month + 1, 14, 23, 59, 59)
    settle = new Date(year, month + 1, 15)
  } else if (day >= 15) {
    type = 'B'
    start = new Date(year, month, 15)
    end = new Date(year, month, 26, 23, 59, 59)
    settle = new Date(year, month, 27)
  } else {
    type = 'A'
    start = new Date(year, month - 1, 27)
    end = new Date(year, month, 14, 23, 59, 59)
    settle = new Date(year, month, 15)
  }

  const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  return {
    label: `Periode ${type} ${fmt(start)} - ${fmt(end)}`,
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    settlementDate: settle.toISOString().split('T')[0],
    type,
  }
}

export function getCurrentPeriod(): SettlementPeriod {
  return getPeriodForDate(new Date())
}

/**
 * Returns the previous N periods from current, newest first.
 * E.g. count=6 returns 6 periods before current.
 */
export function getPreviousPeriods(count: number): SettlementPeriod[] {
  const periods: SettlementPeriod[] = []
  // Find start of current period, then step backwards
  const current = getCurrentPeriod()
  // Parse start of current period
  let cursor = new Date(current.start + 'T00:00:00Z')

  for (let i = 0; i < count; i++) {
    // Go one day before the cursor to land in the previous period
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
    const period = getPeriodForDate(cursor)
    periods.push(period)
    // Move cursor to start of that period
    cursor = new Date(period.start + 'T00:00:00Z')
  }

  return periods
}

export interface PeriodRecordData {
  period_label: string
  period_type: 'A' | 'B'
  period_start: string  // ISO
  period_end: string    // ISO
  settlement_date: string // YYYY-MM-DD
}

/**
 * Upsert a period into settlement_periods table and return its id.
 */
export async function getOrCreatePeriodRecord(periodData: PeriodRecordData): Promise<string> {
  const admin = getSupabaseAdmin()

  // Try to find existing by period_start + period_type (unique enough)
  const { data: existing } = await admin
    .from('settlement_periods')
    .select('id')
    .eq('period_start', periodData.period_start)
    .eq('period_type', periodData.period_type)
    .maybeSingle()

  if (existing) return existing.id

  const { data: inserted, error } = await admin
    .from('settlement_periods')
    .insert({
      period_label: periodData.period_label,
      period_type: periodData.period_type,
      period_start: periodData.period_start,
      period_end: periodData.period_end,
      settlement_date: periodData.settlement_date,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    throw new Error(`Failed to create period record: ${error?.message}`)
  }

  return inserted.id
}
