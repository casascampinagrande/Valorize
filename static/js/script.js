document.addEventListener('DOMContentLoaded', function(){
  const tabs = document.querySelectorAll('.search-card .tabs .tab');
  const cards = document.querySelectorAll('.listings-grid .ad-card');

  // Carrega os anúncios mais acessados (via API)
  loadPopularAds();

  if(!tabs || tabs.length === 0) return;

  function filterByTab(tabText){
    const key = tabText.trim().toLowerCase();
    cards.forEach(card => {
      const typeEl = card.querySelector('.ad-meta .type') || card.querySelector('.type');
      const typeText = typeEl ? typeEl.textContent.trim().toLowerCase() : '';
      if(key === 'venda'){
        card.style.display = typeText.includes('venda') ? '' : 'none';
      } else if(key === 'aluguel'){
        card.style.display = typeText.includes('aluguel') ? '' : 'none';
      } else {
        card.style.display = '';
      }
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', function(e){
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      filterByTab(this.textContent);
    });
  });

  // ativa a aba marcada como .active no carregamento (ou a primeira)
  const active = document.querySelector('.search-card .tab.active') || tabs[0];
  if(active){
    tabs.forEach(t => t.classList.remove('active'));
    active.classList.add('active');
    filterByTab(active.textContent);
  }

});

// Função para carregar os anúncios mais acessados do backend fictício
async function loadPopularAds() {
  try {
    const token = localStorage.getItem('userToken');
    const headers = token ? { 'Authorization': `Token ${token}` } : {};

    const response = await fetch('/api/anuncios/', { headers });
    if (!response.ok) return console.error('Falha ao buscar anúncios');

    const data = await response.json();
    let ads = data.results || [];

    // Se a API não retornar anúncios, usa anúncios fictícios para popular a seção
    if (!ads || ads.length === 0) {
      ads = [
        { id: 1, title: 'Casa espaçosa no Centro', price: 'R$ 550.000', city: 'Campina Grande', bairro: 'Centro', image: 'https://via.placeholder.com/400x260?text=Casa+Centro', mine: false },
        { id: 2, title: 'Apartamento moderno', price: 'R$ 2.300 / mês', city: 'João Pessoa', bairro: 'Bessa', image: 'https://via.placeholder.com/400x260?text=Apartamento+Moderno', mine: false },
        { id: 3, title: 'Casa com quintal', price: 'R$ 420.000', city: 'Campina Grande', bairro: 'Bodocongó', image: 'https://via.placeholder.com/400x260?text=Casa+Quintal', mine: false },
        { id: 4, title: 'Kitnet compacta', price: 'R$ 900 / mês', city: 'João Pessoa', bairro: 'Mangabeira', image: 'https://via.placeholder.com/400x260?text=Kitnet+Compacta', mine: false },
        { id: 5, title: 'Cobertura com vista', price: 'R$ 1.200.000', city: 'Campina Grande', bairro: 'Catolé', image: 'https://via.placeholder.com/400x260?text=Cobertura+Vista', mine: false }
      ];
    }

    const myAds = ads.filter(a => a.mine);
    const otherAds = ads.filter(a => !a.mine);

    const container = document.getElementById('popularAds');
    if (!container) return;

    function cardsHtml(list) {
      return list.map(ad => `
        <a href="/anuncio/${ad.id}/" class="card small-card block hover:shadow-lg rounded-lg overflow-hidden">
          <img src="${ad.image}" alt="${ad.title}" class="w-full h-40 object-cover">
          <div class="p-3">
            <h4 class="font-semibold">${ad.title}</h4>
            <p class="text-sm text-gray-200">${ad.city} ${ad.bairro ? ' - ' + ad.bairro : ''}</p>
            <p class="text-sm text-white mt-2 font-bold">${ad.price}</p>
          </div>
        </a>
      `).join('');
    }

    let html = '';
    if (myAds.length) {
      html += `<h3 class="text-white text-lg mb-4">Seus anúncios</h3>`;
      html += `<div class="popular-row-wrapper">${cardsHtml(myAds)}</div>`;
    }

    if (otherAds.length) {
      html += `<h3 class="text-white text-lg mt-6 mb-4">Outros anúncios</h3>`;
      html += `<div class="popular-row-wrapper">${cardsHtml(otherAds.slice(0,8))}</div>`;
    }

    container.innerHTML = html || '<p style="color:white">Nenhum anúncio disponível.</p>';

  } catch (error) {
    console.error('Erro ao carregar anúncios populares:', error);
  }
}