/**
 * BellaSalón Studio & Spa - Carta de Servicios de Belleza
 * Renderiza el menú de experiencias con filtros de categoría, buscador y agendamiento directo.
 */

(function () {
  'use strict';

  // 1. VALIDACIÓN DE SESIÓN
  const auth = window.BellaSalon.validateSession();
  if (!auth) return;

  // 2. CONFIGURACIÓN DEL LAYOUT (Sidebar activo: navServicios)
  window.BellaSalon.setupSharedLayout(auth, 'navServicios');

  const {
    getStoredServices,
    escapeHtml,
    formatPrice
  } = window.BellaSalon;

  // 3. ELEMENTOS DEL DOM
  const elements = {
    container: document.getElementById('showcaseContainer'),
    search: document.getElementById('catalogSearch'),
    category: document.getElementById('categoryFilter'),
    resetBtn: document.getElementById('resetCatalogFilters'),
    feedback: document.getElementById('catalogFeedback'),
    empty: document.getElementById('emptyCatalog'),
    headerBookBtn: document.getElementById('headerBookButton')
  };

  // 4. INICIALIZAR MODAL DE AGENDAR CITA
  const bookingHandler = window.BellaSalon.setupBookingModal(auth, () => {
    // Al agendar, redirigir o mostrar feedback
  });

  if (elements.headerBookBtn) {
    elements.headerBookBtn.addEventListener('click', () => {
      bookingHandler.openBookingModal();
    });
  }

  // 5. POBLAR SELECTOR DE CATEGORÍAS
  const populateCategories = () => {
    if (!elements.category) return;
    const services = getStoredServices().filter(s => s.status === 'available' || s.isActive !== false);
    const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

    elements.category.innerHTML = '<option value="">Todas las categorías</option>' +
      categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
  };

  // 6. RENDERIZAR CARTA DE SERVICIOS
  const renderCatalog = () => {
    if (!elements.container) return;

    const query = (elements.search?.value || '').trim().toLowerCase();
    const selectedCat = elements.category?.value;
    const services = getStoredServices().filter(s => s.status === 'available' || s.isActive !== false);

    const filtered = services.filter(s => {
      const matchesQuery = !query ||
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.category && s.category.toLowerCase().includes(query));

      const matchesCat = !selectedCat || s.category === selectedCat;

      return matchesQuery && matchesCat;
    });

    if (elements.empty) {
      elements.empty.hidden = filtered.length > 0;
    }

    if (elements.feedback) {
      elements.feedback.textContent = `${filtered.length} tratamiento(s) disponible(s)`;
    }

    elements.container.innerHTML = filtered.map(srv => {
      const img = srv.image || 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80';
      return `
        <article class="showcase-card">
          <div class="showcase-image-wrap">
            <img src="${escapeHtml(img)}" alt="${escapeHtml(srv.name)}" loading="lazy">
            <span class="showcase-category-tag"><i class="fa-solid fa-sparkles"></i> ${escapeHtml(srv.category || 'Belleza')}</span>
          </div>
          <div class="showcase-body">
            <h3>${escapeHtml(srv.name)}</h3>
            <p>${escapeHtml(srv.description)}</p>
            <div class="showcase-meta">
              <span class="showcase-duration"><i class="fa-solid fa-stopwatch"></i> ${srv.duration || 45} min</span>
              <span class="showcase-price">${formatPrice(srv.price)}</span>
            </div>
            <button class="showcase-book-btn" type="button" data-book-service="${escapeHtml(srv.id)}">
              <i class="fa-solid fa-calendar-plus"></i> Agendar este servicio
            </button>
          </div>
        </article>
      `;
    }).join('');
  };

  // 7. EVENTOS DE AGENDAMIENTO DIRECTO DESDE TARJETAS
  elements.container?.addEventListener('click', (e) => {
    const bookBtn = e.target.closest('[data-book-service]');
    if (bookBtn) {
      const serviceId = bookBtn.dataset.bookService;
      bookingHandler.openBookingModal(serviceId);
    }
  });

  // 8. FILTROS Y BÚSQUEDA
  elements.search?.addEventListener('input', renderCatalog);
  elements.category?.addEventListener('change', renderCatalog);

  elements.resetBtn?.addEventListener('click', () => {
    if (elements.search) elements.search.value = '';
    if (elements.category) elements.category.value = '';
    renderCatalog();
  });

  // 9. INICIALIZACIÓN
  populateCategories();
  renderCatalog();
})();
