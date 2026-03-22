document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('announceForm');
    const path = window.location.pathname;

    // Função para ativar autocomplete de cidade/estado (caso não esteja)
    function ativarAutocompleteCidadeUF() {
        const inputCidade = document.getElementById('input-cidade');
        const sugestoesCidade = document.getElementById('sugestoes-cidade');
        const selectUf = document.getElementById('select-uf');
        if (!inputCidade || !sugestoesCidade || !selectUf) return;
        let timeoutId;
        function buscarSugestoesCidade(termo = "") {
            const uf = selectUf.value;
            if (!uf) {
                sugestoesCidade.classList.add('hidden');
                sugestoesCidade.innerHTML = '';
                return;
            }
            fetch(`/api/sugestoes-cidade/?q=${encodeURIComponent(termo)}&uf=${encodeURIComponent(uf)}`)
                .then(resp => resp.ok ? resp.json() : [])
                .then(sugestoes => {
                    sugestoesCidade.innerHTML = '';
                    if (!sugestoes || sugestoes.length === 0) {
                        sugestoesCidade.classList.add('hidden');
                        return;
                    }
                    sugestoes.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        li.className = 'px-4 py-2 cursor-pointer hover:bg-orange-50';
                        li.addEventListener('mousedown', function () {
                            inputCidade.value = item;
                            sugestoesCidade.classList.add('hidden');
                            sugestoesCidade.innerHTML = '';
                        });
                        sugestoesCidade.appendChild(li);
                    });
                    sugestoesCidade.classList.remove('hidden');
                })
                .catch(() => {
                    sugestoesCidade.classList.add('hidden');
                });
        }
        inputCidade.addEventListener('input', function () {
            clearTimeout(timeoutId);
            const termo = inputCidade.value.trim();
            if (!selectUf.value) {
                sugestoesCidade.classList.add('hidden');
                sugestoesCidade.innerHTML = '';
                return;
            }
            if (termo.length < 2) {
                sugestoesCidade.classList.add('hidden');
                sugestoesCidade.innerHTML = '';
                return;
            }
            timeoutId = setTimeout(() => buscarSugestoesCidade(termo), 200);
        });
        selectUf.addEventListener('change', function () {
            inputCidade.value = '';
            buscarSugestoesCidade("");
        });
        inputCidade.addEventListener('blur', function () {
            setTimeout(() => {
                sugestoesCidade.classList.add('hidden');
            }, 150);
        });
    }

    // Só executa se a URL for de edição: /editar-anuncio/ID/
    if (path.includes('editar-anuncio')) {
        const adId = path.split('/').filter(Boolean).pop();
        const token = localStorage.getItem('userToken');

        // Ativar autocomplete cidade/UF
        ativarAutocompleteCidadeUF();

        // 1. Alterar o título da página e o botão
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = "Editar Anúncio";
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = "Salvar Alterações";

        // 2. Buscar dados atuais do anúncio
        try {
            const res = await fetch(`/api/anuncios/${adId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const ad = await res.json();

            // Preencher campos texto e selects
            form.querySelector('[name="titulo"]').value = ad.title || '';
            form.querySelector('[name="preco"]').value = (ad.price || '').toString().replace(/[^\d,\.]/g, '');
            form.querySelector('[name="descricao"]').value = ad.description || '';
            form.querySelector('[name="cidade"]').value = ad.city || '';
            form.querySelector('[name="bairro"]').value = ad.bairro || '';
            if (ad.rooms !== undefined) form.querySelector('[name="quartos"]').value = ad.rooms;
            if (ad.bathrooms !== undefined) form.querySelector('[name="banheiros"]').value = ad.bathrooms;
            if (ad.garage !== undefined) form.querySelector('[name="vagas_garagem"]').value = ad.garage;
            if (ad.area_m2 !== undefined) form.querySelector('[name="area_m2"]').value = ad.area_m2;
            if (ad.uf) {
                const ufSelect = form.querySelector('[name="uf"]');
                if (ufSelect) ufSelect.value = ad.uf;
            }
            if (ad.categoria) form.querySelector('[name="categoria"]').value = ad.categoria;
            if (ad.finalidade) form.querySelector('[name="finalidade"]').value = ad.finalidade;
            if (ad.tem_varanda !== undefined) form.querySelector('[name="tem_varanda"]').checked = !!ad.tem_varanda;
            if (ad.tem_terraco !== undefined) form.querySelector('[name="tem_terraco"]').checked = !!ad.tem_terraco;

            // Exibir galeria de imagens (capa + demais)
            const preview = document.getElementById('previewContainer');
            if (preview) {
                preview.innerHTML = '';
                if (ad.images && ad.images.length > 0) {
                    ad.images.forEach((imgUrl, idx) => {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'relative';
                        wrapper.innerHTML = `
                            <img src="${imgUrl}" class="w-full h-24 object-cover rounded-xl border">
                            ${idx === 0 ? '<span class="absolute top-1 left-1 bg-brand-orange text-white text-xs px-2 py-0.5 rounded">Capa atual</span>' : ''}
                        `;
                        preview.appendChild(wrapper);
                    });
                }
            }

        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }

        // 4. Mudar o comportamento do Submit para EDITAR (PATCH) em vez de CRIAR
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            btn.disabled = true;
            btn.textContent = "Salvando...";

            const fd = new FormData(form);

            try {
                const response = await fetch(`/api/anuncios/${adId}/editar/`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Token ${token}`
                    },
                    body: fd
                });

                const data = await response.json();

                if (response.ok) {
                    showToast("Anúncio atualizado com sucesso!", 'success');
                    const userId = localStorage.getItem('userId');
                    if (userId && userId !== 'null' && userId !== 'undefined') {
                        window.location.href = `/perfil/${userId}/`;
                    } else {
                        window.location.href = '/login/';
                    }
                } else {
                    console.error(data);
                    showToast("Erro ao salvar mudanças.", 'error');
                }

            } catch (err) {
                console.error(err);
                showToast("Erro de conexão.", 'error');
            }

            btn.disabled = false;
            btn.textContent = "Salvar Alterações";
        });
    }
})
