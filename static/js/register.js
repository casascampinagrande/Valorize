$(function () {

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

  const $radios = $('input[name="tipo_conta"]');
  const $dateRow = $('#dateRow');
  const $cpfRow = $('#cpfRow');
  const $cnpjRow = $('#cnpjRow');

  function updateFields() {
    const val = $('input[name="tipo_conta"]:checked').val();
    if (val === 'pf') {
      $dateRow.show(); 
      $cpfRow.show(); 
      $cnpjRow.hide();
    } else {
      $dateRow.hide(); 
      $cpfRow.hide(); 
      $cnpjRow.show();
    }
  }

  $radios.on('change', updateFields);
  updateFields();

  document.querySelector('#register-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }

    const nome = document.querySelector('#nome').value;
    const email = document.querySelector('#email').value;
    const senha = document.querySelector('#senha').value;
    const confirmar_senha = document.querySelector('#confirmar_senha').value;
    const documento = document.querySelector('#cpf_cnpj').value;

    const $msg = document.querySelector('#mensagem');

    if (senha !== confirmar_senha) {
      $msg.classList.add('error');
      $msg.textContent = 'As senhas não coincidem.';
      return;
    }

    const payload = {
      nome: nome,
      email: email,
      senha: senha,
      cpf_cnpj: documento,
      creci: null,
      telefone: null
    };

    fetch('/api/registrar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          $msg.classList.add('success');
          $msg.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
          setTimeout(() => {
            window.location.href = `/confirmacao-pendente/?email=${encodeURIComponent(email)}`;
          }, 1500);
        } else {
          let erroTexto = 'Erro ao cadastrar.';
          if (data.email) erroTexto = 'Este e-mail já está em uso.';
          if (data.cpf_cnpj) erroTexto = 'Este CPF/CNPJ já está cadastrado.';
          $msg.classList.add('error');
          $msg.textContent = erroTexto;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cadastrar';
          }
        }
      })
      .catch(() => {
        $msg.classList.add('error');
        $msg.textContent = 'Erro ao conectar com o servidor.';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Cadastrar';
        }
      });
  });
});


