document.addEventListener('DOMContentLoaded', async function () {
        // Preencher formulário de configurações com dados do usuário
        async function preencherFormularioConfiguracoes() {
          const token = localStorage.getItem('userToken');
          const form = document.getElementById('form-configuracoes');
          if (!form || !token) return;
          try {
            const resp = await fetch('/api/meu-perfil/', {
              method: 'GET',
              headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data.nome) form.nome.value = data.nome;
              if (data.email) form.email.value = data.email;
              if (data.creci) form.creci.value = data.creci;
              if (data.telefone) form.telefone.value = data.telefone;
              if (data.cpf_cnpj) form.cpf_cnpj.value = data.cpf_cnpj;
              if (data.plano) form.plano.value = data.plano;
              // Não preenche senha
            }
          } catch (e) {
            // Ignora erro silenciosamente
          }
        }
        preencherFormularioConfiguracoes();
      // Máscara para CPF/CNPJ
      function maskCpfCnpj(value) {
        value = value.replace(/\D/g, '');
        if (value.length <= 11) {
          // CPF: 000.000.000-00
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
          // CNPJ: 00.000.000/0000-00
          value = value.replace(/(\d{2})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d)/, '$1/$2');
          value = value.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
        return value;
      }

      // Máscara para telefone (celular e fixo)
      function maskTelefone(value) {
        value = value.replace(/\D/g, '');
        if (value.length > 10) {
          // Celular: (00) 00000-0000
          value = value.replace(/(\d{2})(\d)/, '($1) $2');
          value = value.replace(/(\d{5})(\d)/, '$1-$2');
        } else {
          // Fixo: (00) 0000-0000
          value = value.replace(/(\d{2})(\d)/, '($1) $2');
          value = value.replace(/(\d{4})(\d)/, '$1-$2');
        }
        return value;
      }

      // Máscara para CRECI (formato livre, mas força maiúsculo e sem espaços extras)
      function maskCreci(value) {
        return value.replace(/\s+/g, '').toUpperCase();
      }

      // Aplica as máscaras nos inputs
      const inputCpfCnpj = document.getElementById('cpf_cnpj');
      if (inputCpfCnpj) {
        inputCpfCnpj.addEventListener('input', function () {
          this.value = maskCpfCnpj(this.value);
        });
      }
      const inputTelefone = document.getElementById('telefone');
      if (inputTelefone) {
        inputTelefone.addEventListener('input', function () {
          this.value = maskTelefone(this.value);
        });
      }
      const inputCreci = document.getElementById('creci');
      if (inputCreci) {
        inputCreci.addEventListener('input', function () {
          this.value = maskCreci(this.value);
        });
      }
    // Atualização do perfil via AJAX
    const formConfig = document.getElementById('form-configuracoes');
    if (formConfig) {
      formConfig.addEventListener('submit', async function (e) {
        e.preventDefault();
        const token = localStorage.getItem('userToken');
        const formData = new FormData(formConfig);
        // Remove campos de senha se estiverem vazios
        if (!formData.get('nova_senha')) formData.delete('nova_senha');
        if (!formData.get('senha_atual')) formData.delete('senha_atual');
        try {
          const resp = await fetch('/api/meu-perfil/', {
            method: 'PATCH',
            headers: {
              'Authorization': `Token ${token}`
            },
            body: formData
          });
          if (resp.ok) {
            showToast('Perfil atualizado com sucesso!', 'success');
            setTimeout(() => window.location.reload(), 1200);
          } else {
            const data = await resp.json();
            showToast('Erro ao atualizar perfil: ' + (data.detail || JSON.stringify(data)), 'error');
          }
        } catch (err) {
          showToast('Erro ao atualizar perfil.', 'error');
        }
      });
    }
  // Sempre força o uso de /perfil/<id>/
  const match = window.location.pathname.match(/\/perfil\/(\d+)\/?$/);
  const token = localStorage.getItem('userToken');

  if (window.location.pathname === '/perfil/' && token) {
    // Se está em /perfil/, busca o id e redireciona
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
        if (userData.id) {
          window.location.replace(`/perfil/${userData.id}/`);
          return;
        }
      } else {
        localStorage.removeItem('userToken');
        window.location.href = '/login/';
      }
    } catch (e) {
      console.error('Erro ao redirecionar perfil:', e);
    }
    return;
  } else if (match) {

    let allAds = [];

    // Buscar dados do perfil e anúncios do usuário
    try {
      const profileId = match[1];
      const resp = await fetch(`/api/perfil/${profileId}/`);
      if (resp.ok) {
        const data = await resp.json();
        // Preencher lateral do perfil SEMPRE antes de qualquer outra função
        preencherLateralPerfil(data);
        // Anúncios
        if (data.anuncios) {
          populateUserAds(data.anuncios);
        } else {
          populateUserAds([]);
        }
      } else {
        populateUserAds([]);
        // Exibe aviso de erro
        preencherLateralPerfil({});
        const elWarn = document.getElementById('user-profile-warning');
        if (elWarn) elWarn.classList.remove('hidden');
      }
    } catch (e) {
      populateUserAds([]);
      preencherLateralPerfil({});
      // Exibe aviso de erro
      const elWarn = document.getElementById('user-profile-warning');
      if (elWarn) elWarn.classList.remove('hidden');
    }

    // Função para preencher a lateral do perfil
    function preencherLateralPerfil(data) {
      const elNome = document.getElementById('user-name');
      if (elNome) elNome.textContent = data.nome || data.username || '';
      const elFoto = document.getElementById('user-photo');
      if (elFoto) elFoto.src = data.foto || '/static/images/default-user.png';
      const elCreci = document.getElementById('user-creci');
      if (elCreci) elCreci.textContent = data.creci || '';
      const elTel = document.getElementById('user-telefone');
      if (elTel) elTel.textContent = data.telefone || '';
      const elCpfCnpj = document.getElementById('user-cpf-cnpj');
      if (elCpfCnpj) elCpfCnpj.textContent = data.cpf_cnpj || '';
      const elMember = document.querySelector('.profile-member-since .font-medium');
      if (elMember) elMember.textContent = data.memberSince ? `Membro desde ${data.memberSince}` : '';
      const elLoc = document.querySelector('.profile-location .font-medium');
      if (elLoc) elLoc.textContent = data.location || '';
    }

    function renderAds(filteredAds) {
      const adsGrid = document.querySelector('.ads-grid');
      const listingsCount = document.querySelector('.listings-count');
      if (listingsCount) listingsCount.textContent = `${filteredAds.length} encontrado${filteredAds.length === 1 ? '' : 's'}`;

      if (!adsGrid) return;

      if (filteredAds.length === 0) {
              showToast('Você ainda não possui anúncios publicados.', 'info');
        return;
      }
      adsGrid.innerHTML = '';

      filteredAds.forEach(ad => {
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
                  <button data-ad-id="${ad.id}" class="px-3 bg-red-50 text-red-500 py-2 rounded-lg hover:bg-red-100 hover:text-red-700 transition border border-gray-100 flex items-center justify-center btn-apagar-anuncio" title="Apagar anúncio">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        adsGrid.innerHTML += adCard;
      });

      // Adiciona evento para apagar anúncio
      document.querySelectorAll('.btn-apagar-anuncio').forEach(btn => {
        btn.addEventListener('click', async function (e) {
          e.preventDefault();
          const self = this;
          showConfirm('Tem certeza que deseja apagar este anúncio? Essa ação não pode ser desfeita.', async function() {
            const adId = self.getAttribute('data-ad-id');
            const token = localStorage.getItem('userToken');
            try {
              const resp = await fetch(`/api/anuncios/${adId}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Token ${token}`
                }
              });
              if (resp.ok) {
                self.closest('.bg-white').remove();
                // Atualiza o contador após remoção
                const listingsCount = document.querySelector('.listings-count');
                if (listingsCount) {
                  const newCount = document.querySelectorAll('.ads-grid > .bg-white').length;
                  listingsCount.textContent = `${newCount} encontrado${newCount === 1 ? '' : 's'}`;
                }
              } else {
                showToast('Erro ao apagar anúncio.', 'error');
              }
            } catch (err) {
              showToast('Erro ao apagar anúncio.', 'error');
            }
          });
        });
      });
    }

    function applyFilters() {
      let filtered = [...allAds];
      // Busca
      const searchInput = document.querySelector('input[type="search"]');
      const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
      if (search) {
        filtered = filtered.filter(ad =>
          (ad.title && ad.title.toLowerCase().includes(search)) ||
          (ad.city && ad.city.toLowerCase().includes(search)) ||
          (ad.bairro && ad.bairro.toLowerCase().includes(search))
        );
      }
      // Categoria (Venda/Aluguel)
        const catSelect = document.getElementById('filtro-categoria');
      if (catSelect && catSelect.value && catSelect.value !== 'Todas as Categorias') {
        filtered = filtered.filter(ad => {
          if (catSelect.value === 'Venda') return ad.finalidade === 'venda';
          if (catSelect.value === 'Aluguel') return ad.finalidade === 'aluguel';
          return true;
        });
      }
      // Localização
        const locSelect = document.getElementById('filtro-localizacao');
      if (locSelect && locSelect.value && locSelect.value !== 'Qualquer Localização') {
        filtered = filtered.filter(ad => ad.city === locSelect.value);
      }
      // Ordenação
        const ordSelect = document.getElementById('filtro-ordenacao');
      if (ordSelect) {
        if (ordSelect.value === 'Mais recentes') {
          filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
        } else if (ordSelect.value === 'Mais antigos') {
          filtered.sort((a, b) => new Date(a.created) - new Date(b.created));
        } else if (ordSelect.value === 'Maior preço') {
          filtered.sort((a, b) => {
            const pa = parseFloat((a.price || '').replace(/[^\d,\.]/g, '').replace(',', '.'));
            const pb = parseFloat((b.price || '').replace(/[^\d,\.]/g, '').replace(',', '.'));
            return pb - pa;
          });
        }
      }
      renderAds(filtered);
    }

    function populateUserAds(ads) {
      allAds = ads;
      // Preencher select de localização com cidades únicas
        const locSelect = document.getElementById('filtro-localizacao');
      if (locSelect) {
        const cidades = [...new Set(ads.map(ad => ad.city).filter(Boolean))];
        locSelect.innerHTML = '<option>Qualquer Localização</option>' + cidades.map(c => `<option>${c}</option>`).join('');
      }
      applyFilters();
      // Eventos dos filtros
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput) searchInput.addEventListener('input', applyFilters);
        const catSelect = document.getElementById('filtro-categoria');
        const locSelect2 = document.getElementById('filtro-localizacao');
        const ordSelect = document.getElementById('filtro-ordenacao');
        if (catSelect) catSelect.addEventListener('change', applyFilters);
        if (locSelect2) locSelect2.addEventListener('change', applyFilters);
        if (ordSelect) ordSelect.addEventListener('change', applyFilters);
    }
    } // <-- FECHA o else if (match)

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
        if (typeof showToast === 'function') {
          showToast("Foto atualizada com sucesso!", 'success', 3500);
        } else {
          alert("Foto atualizada com sucesso!");
        }
      } else {
        if (typeof showToast === 'function') {
          showToast("Erro ao atualizar foto.", 'error', 3500);
        } else {
          alert("Erro ao atualizar foto.");
        }
      }
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  }

  window.uploadFoto = uploadFoto; // Torna a função global para ser chamada no HTML

});
  
