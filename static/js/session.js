document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('userToken');
  const loggedIn = token && token !== 'undefined' && token !== 'null';
  let uid = localStorage.getItem('userId');

  // Troca links de 'Entrar' por 'Sair' quando autenticado
  if (loggedIn) {
    const selectors = ['a[href="/login/"]', 'a[href="/perfil/"]', 'a[href="/login"]', 'a[href="/perfil"]'];
    const links = Array.from(document.querySelectorAll(selectors.join(',')));

    document.querySelectorAll('a').forEach(a => {
      if (a.textContent && a.textContent.trim().toLowerCase() === 'entrar') links.push(a);
    });

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

  // Links de anúncio: levam para /anunciar/ se logado, ou para /login/ caso contrário
  const announceLinks = Array.from(document.querySelectorAll('a')).filter(a => {
    const href = a.getAttribute('href') || '';
    const text = a.textContent || '';
    return href.includes('anunciar') || /anunciar/i.test(text);
  });
  announceLinks.forEach(a => { a.href = loggedIn ? '/anunciar/' : '/login/'; });

  // Função utilitária: garante/atualiza link 'Meu Perfil' dentro de um container
  function ensureProfileLinkElement(container) {
    if (!container) return;
    let link = container.querySelector('a[data-profile-link]');
    const target = (loggedIn && uid) ? `/perfil/${uid}/` : '/login/';
    if (link) {
      link.href = target;
      link.textContent = 'Meu Perfil';
    } else {
      link = document.createElement('a');
      link.setAttribute('href', target);
      link.setAttribute('data-profile-link', '1');
      link.textContent = 'Meu Perfil';
      // tenta copiar classes do primeiro link do container para manter estilo
      const sample = container.querySelector('a');
      if (sample) link.className = sample.className;
      container.appendChild(link);
    }
  }

  // Função que aplica/atualiza link 'Meu Perfil' ao lado de 'Início' em cada <nav>
  function applyProfileLinks() {
    document.querySelectorAll('nav').forEach(nav => {
      const inicio = Array.from(nav.querySelectorAll('a')).find(a => {
        const href = (a.getAttribute('href') || '').toLowerCase();
        const txt = (a.textContent || '').trim().toLowerCase();
        return txt === 'início' || txt === 'inicio' || href === '/' || href.includes('/home') || href.includes('home');
      });
      if (!inicio) return;

      let existing = nav.querySelector('a[data-profile-link]');
      const target = (loggedIn && uid) ? `/perfil/${uid}/` : '/login/';

      if (existing) {
        existing.href = target;
        existing.textContent = 'Meu Perfil';
      } else {
        const link = document.createElement('a');
        link.setAttribute('href', target);
        link.setAttribute('data-profile-link', '1');
        link.textContent = 'Meu Perfil';
        link.className = inicio.className || 'text-gray-800 hover:text-green-700 transition';
        if (inicio.nextSibling) nav.insertBefore(link, inicio.nextSibling);
        else nav.appendChild(link);
      }
    });
  }

  // If logged in but we don't yet have userId, fetch profile to get it, then apply links
  if (loggedIn && !uid) {
    fetch('/api/meu-perfil/', { headers: { 'Authorization': `Token ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data && data.id) {
          uid = data.id;
          localStorage.setItem('userId', uid);
        }
      })
      .catch(() => {
        // ignore — we'll fallback to /login/
      })
      .finally(() => applyProfileLinks());
  } else {
    applyProfileLinks();
  }
});
