document.addEventListener('DOMContentLoaded', async function () {
  // Detecta se a URL contém um id de usuário: /perfil/123/
  const match = window.location.pathname.match(/\/perfil\/(\d+)\/?$/);

  if (match) {
    // Perfil público por id
    const userId = match[1];
    try {
      const response = await fetch(`/api/perfil/${userId}/`, { method: 'GET' });
      if (response.ok) {
        const userData = await response.json();
        populateUserInfo(userData);
        populateUserAds(userData.anuncios || []);
      } else {
        console.error('Perfil não encontrado');
      }
    } catch (e) {
      console.error('Erro ao carregar perfil público:', e);
    }

    return;
  }

  // Perfil privado (usuário logado)
  const token = localStorage.getItem('userToken');

  if (!token || token === "undefined" || token === "null") {
    window.location.href = '/login/';
    return;
  }

  try {
    const response = await fetch('/api/meu-perfil/', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      populateUserInfo(userData);
      populateUserAds(userData.anuncios || []);
      configurarBotaoSair();
    } else {
      localStorage.removeItem('userToken');
      window.location.href = '/login/';
    }

  } catch (e) {
    console.error('Erro ao carregar perfil:', e);
  }
});

function populateUserInfo(user) {
  // 1. Nome e CRECI
  const nameEl = document.querySelector('#user-name');
  if (nameEl) nameEl.textContent = user.nome || user.username;

  const creciEl = document.querySelector('#user-creci');
  if (creciEl) creciEl.textContent = user.creci ? `CRECI: ${user.creci}` : "Sem CRECI";

  // 2. Foto
  const avatarEl = document.querySelector('#user-photo');
 if (avatarEl) {
  avatarEl.src = user.foto || "/static/images/default-user.png";
}

  // 3. Status Online (Forçando o preenchimento)
  const statusEl = document.querySelector('.profile-status');
  if (statusEl) {
    statusEl.innerHTML = '<span class="status-dot" style="background:#4ade80; display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:5px;"></span> online';
  }

  // 4. Membro desde
  const memberSinceEl = document.querySelector('.profile-member-since span:last-child');
  if (memberSinceEl) {
    memberSinceEl.textContent = `Na Valorize desde ${user.memberSince || '03/2026'}`;
  }

  // 5. Localização
  const locationEl = document.querySelector('.profile-location span:last-child');
  if (locationEl) {
    locationEl.textContent = user.location || "Paraíba, Brasil";
  }

  // 6. Nível de cadastro (Barra)
  const progressFill = document.querySelector('.progress-fill');
  if (progressFill) progressFill.style.width = `70%`;
}

function configurarBotaoSair() {
  // Encontra links de 'Entrar' no header (vários templates usam '/perfil/' ou '/login/')
  const possibleSelectors = ['a[href="/login/"]', 'a[href="/perfil/"]', 'a[href="/login"]', 'a[href="/perfil"]'];
  const links = Array.from(document.querySelectorAll(possibleSelectors.join(',')));

  // Também captura links pelo texto 'Entrar' caso o href seja diferente
  document.querySelectorAll('a').forEach(a => {
    if (a.textContent.trim().toLowerCase() === 'entrar') links.push(a);
  });

  // Remove duplicatas
  const uniqueLinks = [...new Set(links)];

  uniqueLinks.forEach(btn => {
    btn.textContent = 'Sair';
    btn.href = '#';
    btn.classList.add('btn-logout');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('userToken');
      localStorage.removeItem('userId');
      window.location.href = '/';
    });
  });
}



function populateUserAds(ads) {
  const adsGrid = document.querySelector('.ads-grid');
  if (!adsGrid) return;

  if (ads.length === 0) {
    adsGrid.innerHTML = '<p style="padding:20px; color:#666;">Você ainda não possui anúncios publicados.</p>';
    return;
  }
  adsGrid.innerHTML = '';

  ads.forEach(ad => {
    const adCard = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
          <img src="${ad.image}" alt="${ad.title}" class="w-full h-48 object-cover">        
          <div class="p-4">
            <h3 class="font-bold text-gray-800 text-lg mb-1 truncate">${ad.title}</h3>
            <p class="text-green-600 font-bold text-xl mb-2">${ad.price}</p>
            <div class="flex items-center text-gray-500 text-sm gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              ${ad.city}
            </div>
            <div class="mt-4 flex gap-2">
              <a href="/anuncio/${ad.id}/" class="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">Ver</a>
              <a href="/editar-anuncio/${ad.id}/" class="px-3 bg-gray-50 text-gray-500 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition border border-gray-100 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      `;
    adsGrid.innerHTML += adCard;
  });
}

// Botão Sair
document.addEventListener('click', function (e) {
  if (e.target && e.target.textContent === 'Sair') {
    localStorage.removeItem('userToken');
    window.location.href = '/';
  }
});

async function uploadFoto(input) {
    if (!input.files || !input.files[0]) return;

    const formData = new FormData();
    formData.append('foto', input.files[0]);

    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch('/api/meu-perfil/', { 
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            // Atualiza a foto na tela na hora
            document.getElementById('user-photo').src = data.foto;
            alert("Foto atualizada com sucesso!");
        } else {
            alert("Erro ao atualizar foto.");
        }
    } catch (error) {
        console.error("Erro no upload:", error);
    }
}
