document.addEventListener('DOMContentLoaded', async () => {

    const form = document.getElementById('announceForm');
    if (!form) return;

    const token = localStorage.getItem("userToken"); // ← FALTAVA ISSO

    if (!token) {
        alert("Você precisa estar logado.");
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

            const titulo = form.querySelector('[name="titulo"]');
            if (titulo) titulo.value = ad.title || "";

            const preco = form.querySelector('[name="preco"]');
            if (preco) preco.value = ad.price || "";

            const descricao = form.querySelector('[name="descricao"]');
            if (descricao) descricao.value = ad.description || "";

            const cidade = form.querySelector('[name="cidade"]');
            if (cidade) cidade.value = ad.city || "";

            const bairro = form.querySelector('[name="bairro"]');
            if (bairro) bairro.value = ad.bairro || "";

            const area = form.querySelector('[name="area_m2"]');
            if (area) area.value = ad.area_m2 || "";

            const quartos = form.querySelector('[name="quartos"]');
            if (quartos) quartos.value = ad.rooms || "";

        } catch (err) {

            console.error("Erro ao carregar anúncio", err);
            alert("Erro ao carregar anúncio");

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

                alert(isEditing ? "Anúncio atualizado!" : "Anúncio publicado!");
                window.location.href = "/perfil/";

            } else {

                console.error(data);
                console.log(data);
                alert(JSON.stringify(data));

            }

        } catch (err) {

            console.error(err);
            alert("Erro de conexão");

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