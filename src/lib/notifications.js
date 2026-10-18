export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function getPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

/** Must be called from a click handler (a user gesture). */
export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported'
  try {
    const result = await Notification.requestPermission()
    return result ?? Notification.permission
  } catch (err) {
    console.error(err)
    return Notification.permission
  }
}

/** Returns true if the browser accepted the notification. */
export function showNotification(title, body, tag) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  try {
    const n = new Notification(title, { body, tag })
    n.onclick = () => {
      window.focus()
      n.close()
    }
    return true
  } catch (err) {
    // e.g. Android Chrome, which only allows service-worker notifications.
    console.error('Could not show notification:', err)
    return false
  }
}