export interface SettlementPeriod {
  label: string
  start: string
  end: string
  settlementDate: string
}

export function getCurrentPeriod(): SettlementPeriod {
  const now = new Date()
  const day = now.getDate()
  const month = now.getMonth()
  const year = now.getFullYear()

  let start: Date, end: Date, settle: Date, label: string

  if (day >= 27) {
    start = new Date(year, month, 27)
    end = new Date(year, month + 1, 14, 23, 59, 59)
    settle = new Date(year, month + 1, 15)
    label = `Periode A`
  } else if (day >= 15) {
    start = new Date(year, month, 15)
    end = new Date(year, month, 26, 23, 59, 59)
    settle = new Date(year, month, 27)
    label = `Periode B`
  } else {
    start = new Date(year, month - 1, 27)
    end = new Date(year, month, 14, 23, 59, 59)
    settle = new Date(year, month, 15)
    label = `Periode A`
  }

  return {
    label: `${label} ${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    settlementDate: settle.toISOString().split('T')[0],
  }
}
