import { supabase } from '@/lib/supabaseClient'
import type { DiningTable } from '@/types/domain'

export async function confirmPayment(orderId: number) {
  const { error } = await supabase.rpc('confirm_payment', { p_order_id: orderId })
  if (error) throw error
}

export async function markServed(itemId: number) {
  const { error } = await supabase.rpc('serve_item', { p_item_id: itemId })
  if (error) throw error
}

export async function checkoutTable(table: DiningTable) {
  const { error } = await supabase.rpc('checkout_table', {
    p_zone: table.zone,
    p_seat_number: table.seatNumber,
  })
  if (error) throw error
}

export async function moveTable(table: DiningTable, newRow: number, newCol: number) {
  const { error } = await supabase.rpc('move_dining_table', {
    p_zone: table.zone,
    p_seat_number: table.seatNumber,
    p_new_row: newRow,
    p_new_col: newCol,
  })
  if (error) throw error
}

export async function mergeTables(tables: DiningTable[]) {
  const { error } = await supabase.rpc('merge_tables', {
    p_tables: tables.map((t) => ({ zone: t.zone, seat_number: t.seatNumber })),
  })
  if (error) throw error
}

export async function createMenuItem(params: {
  name: string
  price: number
  category: string
  imageUrl: string | null
}) {
  const { error } = await supabase.rpc('create_menu_item', {
    p_name: params.name,
    p_price: params.price,
    p_category: params.category,
    p_image_url: params.imageUrl,
  })
  if (error) throw error
}

export async function updateMenuItem(params: {
  id: number
  name: string
  price: number
  category: string
  available: boolean
  imageUrl: string | null
}) {
  const { error } = await supabase.rpc('update_menu_item', {
    p_id: params.id,
    p_name: params.name,
    p_price: params.price,
    p_category: params.category,
    p_available: params.available,
    p_image_url: params.imageUrl,
  })
  if (error) throw error
}
