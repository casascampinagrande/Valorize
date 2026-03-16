document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.search-type-btn');
  if (!buttons.length) return;

  // Garantir que apenas um botão esteja ativo por vez
  function deactivateAll() {
    buttons.forEach(b => {
      b.classList.remove('bg-green-600', 'text-white', 'active');
      b.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
    });
  }

  // Normaliza estado inicial: se houver múltiplos ativos, mantém só o primeiro
  const activeButtons = Array.from(buttons).filter(b => b.classList.contains('bg-green-600') || b.classList.contains('active'));
  if (activeButtons.length > 1) {
    const first = activeButtons[0];
    deactivateAll();
    first.classList.add('bg-green-600', 'text-white', 'active');
    first.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Ao clicar, ativa apenas o botão clicado e desativa os demais
      deactivateAll();
      btn.classList.add('bg-green-600', 'text-white', 'active');
      btn.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
    });
  });
});
