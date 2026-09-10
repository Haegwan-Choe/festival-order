import { supabase } from '@/lib/supabaseClient'

export async function enterTable(zone: string, seatNumber: number) {
  const { error } = await supabase.rpc('enter_table', { p_zone: zone, p_seat_number: seatNumber })
  if (error) throw error
}

export interface CartItem {
  menuItemId: number
  quantity: number
}

export async function submitOrder(zone: string, seatNumber: number, items: CartItem[]) {
  const { error } = await supabase.rpc('create_order', {
    p_zone: zone,
    p_seat_number: seatNumber,
    p_items: items.map((item) => ({ menu_item_id: item.menuItemId, quantity: item.quantity })),
  })
  if (error) throw error
}
