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

        if (images.length === 0 && ad.image) {
            images = [ad.image];
        }

        if (images.length === 0) {
            images = ["/static/images/default-house.jpg"];
    }   


        const mainImage = images[0];

        container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-8 bg-white p-6 rounded-2xl shadow-sm">

            <div class="grid grid-cols-1 gap-4">

                <img id="mainImage"
                src="${mainImage}"
                class="w-full h-[500px] object-cover rounded-xl">

                <div class="grid grid-cols-4 gap-2">

                    ${images.map(img => `
                        <img src="${img}"
                        class="thumbnail h-28 w-full object-cover rounded-lg cursor-pointer hover:opacity-80">
                    `).join('')}

                </div>

            </div>

            <div class="space-y-3">

                <h1 class="text-3xl font-bold">
                    ${ad.title || ""}
                </h1>

                <p class="text-2xl text-green-600 font-semibold">
                    R$ ${ad.price || ""}
                </p>

                <p class="text-gray-600">
                    ${ad.city || ""} • ${ad.bairro || ""}
                </p>

                <p class="text-gray-700">
                    ${ad.description || ""}
                </p>

            </div>

        </div>
        `;

        const mainImg = document.getElementById("mainImage");

        document.querySelectorAll(".thumbnail").forEach(img => {

            img.addEventListener("click", () => {
                mainImg.src = img.src;
            });

        });

    }

    carregarAnuncio();

});