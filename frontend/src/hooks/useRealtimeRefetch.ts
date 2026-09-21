import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

const DEBOUNCE_MS = 300
const SAFETY_POLL_MS = 30_000

// postgres_changes 이벤트가 오면 전체를 다시 조회하되, 주문 1건이 여러 행 변경 이벤트를
// 연달아 만들어도 0.3초 모아서 한 번만 조회한다. 그리고 폰이 잠들거나 연결이 끊겨서
// 이벤트를 놓쳐도 화면이 영영 stale해지지 않도록 다음 시점에 다시 조회한다:
//   - 30초마다 (화면이 보이는 동안만)
//   - 탭/앱이 다시 보이게 될 때
//   - 실시간 연결이 끊겼다가 재연결됐을 때
export function useRealtimeRefetch(channelName: string, tables: readonly string[], refetch: () => void) {
  useEffect(() => {
    refetch()

    let timer: ReturnType<typeof setTimeout> | undefined
    const scheduleRefetch = () => {
      clearTimeout(timer)
      timer = setTimeout(refetch, DEBOUNCE_MS)
    }

    let channel = supabase.channel(channelName)
    for (const table of tables) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefetch)
    }

    let firstSubscribe = true
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return
      if (!firstSubscribe) refetch()
      firstSubscribe = false
    })

    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') refetch()
    }, SAFETY_POLL_MS)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refetch()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearTimeout(timer)
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, [channelName, tables, refetch])
}
