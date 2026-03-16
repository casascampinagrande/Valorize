$(function () {
    // Função auxiliar para obter o CSRF Token dos cookies (padrão do Django)
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    $('.form').on('submit', function (e) {
        e.preventDefault();
        
        const $msg = $('#login-message');
        // Captura os valores reais digitados nos campos
        const email = $(this).find('input[name="email"]').val().trim();
        const senha = $(this).find('input[name="senha"]').val().trim();

        $msg.removeClass('error success').text('Autenticando...');

        fetch('http://127.0.0.1:8000/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ 
                username: email, // O Django usa 'username' por padrão no authenticate
                password: senha 
            })
        })
        .then(async res => {
            const data = await res.json();

            if (res.ok) {
                // 1. Salva os dados no navegador para usar em outras páginas
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userId', data.id);

                $msg.addClass('success').text('Login bem-sucedido! Redirecionando...');

                // 2. Pequeno delay para o usuário ver a mensagem de sucesso
                setTimeout(() => {
                    // Redireciona para a página de perfil passando o ID na URL
                    window.location.href = `/perfil/${data.id}/`;
                }, 1000);

            } else {
                // Exibe o erro vindo do Django ou uma mensagem padrão
                $msg.addClass('error').text(data.erro || 'E-mail ou senha incorretos.');
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);
            $msg.addClass('error').text('Erro ao conectar com o servidor. Verifique se o Django está rodando.');
        });
    });
});