// Toast moderno para notificações
function showToast(message, type = 'info', duration = 3000) {
  let toast = document.createElement('div');
  let icon = '';
  if (type === 'success') {
    icon = `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#16a34a" stroke-width="2" fill="#16a34a"/><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/></svg>`;
  } else if (type === 'error') {
    icon = `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#dc2626" stroke-width="2" fill="#dc2626"/><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9l-6 6m0-6l6 6"/></svg>`;
  } else {
    icon = `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#f97316" stroke-width="2" fill="#f97316"/><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01"/></svg>`;
  }
  toast.className = `fixed z-50 left-1/2 bottom-8 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl font-semibold text-base flex items-center gap-3 toast-${type}`;
  toast.style.background = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#f97316';
  toast.style.color = '#fff';
  toast.style.opacity = '0';
  toast.style.transform = 'translate(-50%, 40px)';
  toast.style.transition = 'all 0.4s cubic-bezier(.4,2,.3,1)';
  toast.style.maxWidth = '90vw';
  toast.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.18)';
  toast.innerHTML = `${icon}<span style="line-height:1.3;">${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0.97';
    toast.style.transform = 'translate(-50%, 0)';
  }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 40px)';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
