import { useEffect, useState } from 'react'

/** Current time in ms, refreshed on an interval and when the tab is shown. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    const id = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])

  return now
}