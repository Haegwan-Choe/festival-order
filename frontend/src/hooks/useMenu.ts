import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { MenuItem } from '@/types/domain'

interface MenuItemRow {
  id: number
  name: string
  price: number
  category: string
  available: boolean
  image_url: string | null
}

function mapRow(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    category: row.category,
    available: row.available,
    imageUrl: row.image_url,
  }
}

export function useMenu() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('menu_item')
      .select('id, name, price, category, available, image_url')
      .order('category')
      .order('name')
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('failed to load menu_item', error)
        } else {
          setMenu((data as MenuItemRow[]).map(mapRow))
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { menu, loading }
}
