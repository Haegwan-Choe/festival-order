import { useCallback, useState } from 'react'
import { useRealtimeRefetch } from '@/hooks/useRealtimeRefetch'
import { supabase } from '@/lib/supabaseClient'
import type { DiningTable, TableStatus } from '@/types/domain'

interface DiningTableRow {
  id: number
  zone: string
  seat_number: number
  status: TableStatus
  entered_at: string | null
  grid_row: number
  grid_col: number
  group_id: number | null
}

const WATCHED_TABLES = ['dining_table'] as const

function mapRow(row: DiningTableRow): DiningTable {
  return {
    id: row.id,
    zone: row.zone,
    seatNumber: row.seat_number,
    status: row.status,
    enteredAt: row.entered_at,
    gridRow: row.grid_row,
    gridCol: row.grid_col,
    groupId: row.group_id,
  }
}

export function useDiningTables() {
  const [tables, setTables] = useState<DiningTable[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('dining_table')
      .select('id, zone, seat_number, status, entered_at, grid_row, grid_col, group_id')
      .order('zone')
      .order('seat_number')

    if (error) {
      console.error('failed to load dining_table', error)
    } else {
      setTables((data as DiningTableRow[]).map(mapRow))
    }
    setLoading(false)
  }, [])

  useRealtimeRefetch('dining_table_changes', WATCHED_TABLES, refetch)

  return { tables, loading, refetch }
}
