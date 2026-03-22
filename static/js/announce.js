// Autocomplete de cidade/estado
document.addEventListener('DOMContentLoaded', function () {
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

    // Ao trocar UF, buscar cidades daquele estado
    selectUf.addEventListener('change', function () {
        inputCidade.value = '';
        buscarSugestoesCidade("");
    });

    // Esconde sugestões ao perder o foco
    inputCidade.addEventListener('blur', function () {
        setTimeout(() => {
            sugestoesCidade.classList.add('hidden');
        }, 150);
    });
});
document.addEventListener('DOMContentLoaded', async () => {

    const form = document.getElementById('announceForm');
    if (!form) return;

    const token = localStorage.getItem("userToken"); // ← FALTAVA ISSO

    if (!token) {
        showToast("Você precisa estar logado.", 'error');
        window.location.href = "/login/";
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const pageTitle = document.getElementById('pageTitle');

    const adId = form.dataset.adId;
    const isEditing = adId && adId !== "";

    // =============================
    // MODO EDIÇÃO
    // =============================

    if (isEditing) {

        pageTitle.textContent = "Editar anúncio";
        submitBtn.textContent = "Salvar alterações";

        try {
            const res = await fetch(`/api/anuncios/${adId}/`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            const ad = await res.json();
            // Preencher todos os campos do model
            const map = {
                'titulo': ad.titulo,
                'descricao': ad.descricao,
                'preco': ad.preco,
                'cidade': ad.cidade,
                'uf': ad.uf,
                'bairro': ad.bairro,
                'quartos': ad.quartos,
                'banheiros': ad.banheiros,
                'vagas_garagem': ad.vagas_garagem,
                'area_m2': ad.area_m2,
                'tem_varanda': ad.tem_varanda,
                'tem_terraco': ad.tem_terraco,
                'finalidade': ad.finalidade,
                'categoria': ad.categoria
            };
            Object.entries(map).forEach(([name, value]) => {
                const input = form.querySelector(`[name="${name}"]`);
                if (!input) return;
                if (input.type === 'checkbox') {
                    input.checked = !!value;
                } else if (input.tagName === 'SELECT') {
                    input.value = value || '';
                } else {
                    input.value = value ?? '';
                }
            });
        } catch (err) {
            console.error("Erro ao carregar anúncio", err);
            showToast("Erro ao carregar anúncio", 'error');
        }

    }

    // =============================
    // SUBMIT
    // =============================

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.textContent = isEditing ? "Salvando..." : "Publicando...";

        const fd = new FormData(form);
        fd.delete("imagens");

        selectedFiles.forEach(file => {
            fd.append("imagens", file);
        });

        const url = isEditing
            ? `/api/anuncios/${adId}/editar/`
            : `/api/publicar-anuncio/`;

        const method = isEditing ? "PATCH" : "POST";

        try {

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Token ${token}`
                },
                body: fd
            });

            const data = await response.json();

            if (response.ok) {

                showToast(isEditing ? "Anúncio atualizado!" : "Anúncio publicado!", 'success');
                const userId = localStorage.getItem('userId');
                if (userId && userId !== 'null' && userId !== 'undefined') {
                    window.location.href = `/perfil/${userId}/`;
                } else {
                    window.location.href = '/login/';
                }

            } else {

                console.error(data);
                console.log(data);
            // Exibe mensagens de erro de validação de forma amigável
            let msg = 'Erro ao publicar anúncio.';
            if (typeof data === 'object' && data !== null) {
                if (data.descricao && Array.isArray(data.descricao)) {
                    msg = 'Descrição: ' + data.descricao.join(', ');
                } else {
                    msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                }
            }
            showToast(msg, 'error');
            // Exibe mensagens de erro de validação de forma amigável
            let msg = 'Erro ao publicar anúncio.';
            if (typeof data === 'object' && data !== null) {
                if (data.descricao && Array.isArray(data.descricao)) {
                    msg = 'Descrição: ' + data.descricao.join(', ');
                } else {
                    msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                }
            }
            showToast(msg, 'error');

            }

        } catch (err) {

            console.error(err);
            showToast("Erro de conexão", 'error');

        }

        submitBtn.disabled = false;
        submitBtn.textContent = isEditing ? "Salvar alterações" : "Publicar anúncio";

    });

});

const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");

let selectedFiles = [];

if (imageInput) {

    imageInput.addEventListener("change", function () {

        const files = Array.from(this.files);

        files.forEach(file => {

            selectedFiles.push(file);

            const reader = new FileReader();

            reader.onload = function(e){

                const wrapper = document.createElement("div");
                wrapper.className = "relative";

                wrapper.innerHTML = `
                    <img src="${e.target.result}" 
                    class="h-32 w-full object-cover rounded-lg">

                    <button type="button"
                        class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs">
                        ✕
                    </button>
                `;

                const btn = wrapper.querySelector("button");

                btn.addEventListener("click", () => {

                    previewContainer.removeChild(wrapper);

                    selectedFiles = selectedFiles.filter(f => f !== file);

                });

                previewContainer.appendChild(wrapper);

            };

            reader.readAsDataURL(file);

        });

    });

}