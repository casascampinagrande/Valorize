document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('announceForm');
    const path = window.location.pathname;

    // Só executa se a URL for de edição: /editar-anuncio/ID/
    if (path.includes('editar-anuncio')) {
        const adId = path.split('/').filter(Boolean).pop();
        const token = localStorage.getItem('userToken');

        // 1. Alterar o título da página e o botão
        document.querySelector('h1').textContent = "Editar Anúncio";
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = "Salvar Alterações";

        // 2. Buscar dados atuais do anúncio
        try {
            const res = await fetch(`/api/anuncios/${adId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const ad = await res.json();

            // 3. Preencher os campos automaticamente
            // Use os nomes EXATOS que estão no atributo 'name' do seu HTML
            form.querySelector('[name="titulo"]').value = ad.title;
            form.querySelector('[name="preco"]').value = ad.price.replace(/[^\d]/g, ''); // Limpa o "R$"
            form.querySelector('[name="descricao"]').value = ad.description;
            form.querySelector('[name="cidade"]').value = ad.city;
            form.querySelector('[name="bairro"]').value = ad.bairro;

            // Se tiver campos de quartos, banheiros, etc, preencha também:
            if (ad.rooms) form.querySelector('[name="quartos"]').value = ad.rooms;

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
                    alert("Anúncio atualizado com sucesso!");
                    window.location.href = '/perfil/';
                } else {
                    console.error(data);
                    alert("Erro ao salvar mudanças.");
                }

            } catch (err) {
                console.error(err);
                alert("Erro de conexão.");
            }

            btn.disabled = false;
            btn.textContent = "Salvar Alterações";
        });
    };
})
