// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('SW registered', reg))
    .catch(err => console.log('SW registration failed', err));
}

// Notification buttons logic
document.addEventListener('DOMContentLoaded', () => {
  const notifyBtn = document.getElementById('notifyBtn');
  if (notifyBtn) {
    // Decide notification type by page
    let type = '';
    if (window.location.pathname.includes('mechanical')) type = 'mechanical';
    else if (window.location.pathname.includes('quartz')) type = 'quartz';
    else if (window.location.pathname.includes('digital')) type = 'digital';

    notifyBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        alert('This browser does not support notifications.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ action: 'notify', type });
      } else if (permission === 'denied') {
        alert('You denied notifications. Enable them in your browser settings to get alerts.');
      }
    });
  }
});