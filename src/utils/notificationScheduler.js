/**
 * Local notification scheduler logic
 */

let checkInterval = null

export function startNotificationScheduler(weather) {
  if (checkInterval) {
    clearInterval(checkInterval)
  }

  // Check every 5 minutes if it's time to show the morning notification
  checkInterval = setInterval(() => {
    checkAndShowNotification(weather)
  }, 5 * 60 * 1000)

  // Also check immediately
  checkAndShowNotification(weather)
}

export function stopNotificationScheduler() {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

async function checkAndShowNotification(weather) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  const isEnabled = localStorage.getItem('outfitme_notif_enabled') === 'true'
  if (!isEnabled) return

  const now = new Date()
  const currentHour = now.getHours()
  
  // Target time for morning reminder: between 7:00 and 9:00 AM
  if (currentHour >= 7 && currentHour < 9) {
    const todayStr = now.toLocaleDateString()
    const lastNotifDate = localStorage.getItem('outfitme_last_morning_notif')
    
    // Only show once per day
    if (lastNotifDate !== todayStr) {
      if (await showMorningReminder(weather)) localStorage.setItem('outfitme_last_morning_notif', todayStr)
    }
  }
}

async function showMorningReminder(weather) {
  let body = '¡Buenos días! Es un gran momento para elegir tu outfit de hoy.'
  
  if (weather && weather.temperatura !== undefined) {
    const temp = Math.round(weather.temperatura)
    
    if (temp < 15) {
      body = `¡Buenos días! Hace frío afuera (${temp}°C). ¡Asegúrate de llevar chamarra o abrigo hoy!`
    } else if (temp > 28) {
      body = `¡Buenos días! Hará calor hoy (${temp}°C). ¡Te sugerimos algo ligero y fresco!`
    } else {
      body = `¡Buenos días! El clima está agradable (${temp}°C). ¡Perfecto para armar un gran outfit!`
    }
  }

  try {
    const registration = await navigator.serviceWorker?.ready
    if (registration) {
      await registration.showNotification('OutfitMe', {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: { url: '/outfit/generate' }
      })
    } else {
      // Fallback for non-ServiceWorker contexts
      new Notification('OutfitMe', {
        body,
        icon: '/icons/icon-192x192.png'
      })
    }
    return true
  } catch (err) {
    console.error('Error showing notification:', err)
    return false
  }
}
