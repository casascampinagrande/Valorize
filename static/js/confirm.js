// Modal de confirmação customizado
function showConfirm(message, onConfirm, onCancel) {
  // Remove modal antigo se existir
  const old = document.getElementById('custom-confirm-modal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'custom-confirm-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
      <div class="mb-6 text-lg text-gray-800">${message}</div>
      <div class="flex justify-center gap-4">
        <button id="custom-confirm-cancel" class="px-6 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition">Cancelar</button>
        <button id="custom-confirm-ok" class="px-6 py-2 rounded-xl bg-brand-orange text-white font-bold hover:bg-orange-600 transition">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('custom-confirm-cancel').onclick = () => {
    modal.remove();
    if (onCancel) onCancel();
  };
  document.getElementById('custom-confirm-ok').onclick = () => {
    modal.remove();
    if (onConfirm) onConfirm();
  };
}
