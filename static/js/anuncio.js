document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("anuncio-container");

    async function carregarAnuncio() {

        try {

            const url = window.location.pathname;
            const id = url.split("/").filter(Boolean).pop();

            const res = await fetch(`/api/anuncios/${id}/`);

            if (!res.ok) {
                throw new Error("Erro ao buscar anúncio");
            }

            const ad = await res.json();

            render(ad);

        } catch (err) {

            console.error(err);

            container.innerHTML = `
                <div class="text-center text-red-500">
                    Erro ao carregar anúncio
                </div>
            `;

        }

    }

    function render(ad) {

        // junta imagem de capa + galeria
        let images = ad.images || [];
        if (images.length === 0 && ad.imagem_capa) {
            images = [ad.imagem_capa];
        }
        if (images.length === 0) {
            images = ["/static/images/default-house.jpg"];
        }
        const mainImage = images[0];
        let html = `
        <div class="max-w-4xl mx-auto space-y-8 bg-white p-6 rounded-2xl shadow-sm">
            <div class="grid grid-cols-1 gap-4">
                <img id="mainImage" src="${mainImage}" class="w-full h-[500px] object-cover rounded-xl">
                <div class="grid grid-cols-4 gap-2">
                    ${images.map(img => `<img src="${img}" class="thumbnail h-28 w-full object-cover rounded-lg cursor-pointer hover:opacity-80">`).join('')}
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div class="space-y-3">
                    <h1 class="text-3xl font-bold">${ad.titulo || ""}</h1>
                    <p class="text-2xl text-green-600 font-semibold">R$ ${ad.preco || ""}</p>
                    <p class="text-gray-600">${ad.cidade || ""} - ${ad.uf || ""} • ${ad.bairro || ""}</p>
                    <p class="text-gray-700">${ad.descricao || ""}</p>
                    <div class="flex flex-wrap gap-4 mt-4">
                        <span class="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium">Categoria: ${ad.categoria || ""}</span>
                        <span class="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium">Finalidade: ${ad.finalidade || ""}</span>
                        <span class="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium">Quartos: ${ad.quartos ?? "-"}</span>
                        <span class="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium">Banheiros: ${ad.banheiros ?? "-"}</span>
                        <span class="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium">Vagas: ${ad.vagas_garagem ?? "-"}</span>
                        <span class="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium">Área: ${ad.area_m2 ? ad.area_m2 + ' m²' : "-"}</span>
                        <span class="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium">Varanda: ${ad.tem_varanda ? 'Sim' : 'Não'}</span>
                        <span class="bg-gray-100 rounded-full px-4 py-2 text-sm font-medium">Terraço: ${ad.tem_terraco ? 'Sim' : 'Não'}</span>
                    </div>
                </div>
                <div class="flex flex-col gap-4 justify-center items-start">
                    <div class="text-gray-500 text-sm">Publicado em: ${ad.data_criacao ? new Date(ad.data_criacao).toLocaleDateString() : ""}</div>
                    ${ad.telefone ? `<a href="https://wa.me/55${ad.telefone.replace(/\D/g, "")}" target="_blank" class="inline-block px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow hover:bg-green-600 transition">Conversar com o vendedor no WhatsApp</a>` : ""}
                </div>
            </div>
        </div>`;
        container.innerHTML = html;
        const mainImg = document.getElementById("mainImage");
        document.querySelectorAll(".thumbnail").forEach(img => {
            img.addEventListener("click", () => {
                mainImg.src = img.src;
            });
        });
    }

    carregarAnuncio();

});