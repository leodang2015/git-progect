/**
 * BellaSalón Studio & Spa - Módulo Administrativo de Gestión de Servicios
 * Exclusivo para administradores: Crear, editar, activar/desactivar y eliminar tratamientos.
 */

(function () {
  'use strict';

  // 1. VALIDACIÓN DE SESIÓN (Requiere rol de Administrador)
  const auth = window.BellaSalon.validateSession({ requireAdmin: true });
  if (!auth) return;

  // 2. CONFIGURACIÓN DEL LAYOUT (Sidebar activo: navAdminServicios)
  window.BellaSalon.setupSharedLayout(auth, 'navAdminServicios');

  const {
    getStoredServices,
    saveStoredServices,
    escapeHtml,
    formatPrice
  } = window.BellaSalon;

  // 3. ELEMENTOS DEL DOM
  const elements = {
    grid: document.getElementById('serviceGrid'),
    search: document.getElementById('serviceSearch'),
    status: document.getElementById('serviceStatusFilter'),
    feedback: document.getElementById('serviceFeedback'),
    empty: document.getElementById('emptyServices'),
    modal: document.getElementById('serviceModal'),
    form: document.getElementById('serviceForm'),
    error: document.getElementById('serviceFormError'),
    id: document.getElementById('serviceId'),
    name: document.getElementById('serviceNameInput'),
    description: document.getElementById('serviceDescriptionInput'),
    price: document.getElementById('servicePriceInput'),
    duration: document.getElementById('serviceDurationInput'),
    category: document.getElementById('serviceCategoryInput'),
    serviceStatus: document.getElementById('serviceStatusInput'),
    image: document.getElementById('serviceImageInput'),
    title: document.getElementById('serviceModalTitle'),
    newBtn: document.getElementById('newServiceButton'),
    closeBtn: document.getElementById('closeServiceModal'),
    cancelBtn: document.getElementById('cancelServiceButton')
  };

  // 4. RENDERIZAR LISTADO ADMINISTRATIVO DE SERVICIOS
  const loadAdminServices = () => {
    if (!elements.grid) return;
    const q = (elements.search?.value || '').trim().toLowerCase();
    const st = elements.status?.value;
    const services = getStoredServices();

    const filtered = services.filter(s =>
      (!q || `${s.name} ${s.category} ${s.description}`.toLowerCase().includes(q)) &&
      (!st || s.status === st)
    );

    elements.grid.innerHTML = filtered.map(s => {
      const isAvailable = s.status === 'available' || s.isActive !== false;
      return `
        <article class="service-card">
          <div class="service-image">
            ${s.image ? `<img src="${escapeHtml(s.image)}" alt="${escapeHtml(s.name)}" loading="lazy">` : '<span aria-hidden="true"><i class="fa-solid fa-sparkles"></i></span>'}
          </div>
          <div class="service-card-content">
            <span class="service-category">${escapeHtml(s.category || 'Belleza')}</span>
            <h3>${escapeHtml(s.name)}</h3>
            <p>${escapeHtml(s.description)}</p>
            <div class="service-details">
              <span>Duración: <strong>${s.duration || 45} min</strong></span>
              <span>Precio: <strong>${formatPrice(s.price || 0)}</strong></span>
            </div>
            <div class="service-card-footer">
              <span class="status-badge ${isAvailable ? 'available' : 'inactive'}">
                ${isAvailable ? 'Disponible' : 'Inactivo'}
              </span>
              <div class="row-actions">
                <button class="row-action" data-edit-service="${escapeHtml(s.id)}" type="button">
                  <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button class="row-action danger" data-delete-service="${escapeHtml(s.id)}" type="button">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    if (elements.empty) elements.empty.hidden = filtered.length > 0;
    if (elements.feedback) elements.feedback.textContent = `${filtered.length} tratamiento(s) en carta`;
  };

  // 5. MODAL CREAR / EDITAR SERVICIO
  if (elements.newBtn) {
    elements.newBtn.addEventListener('click', () => {
      elements.form.reset();
      elements.id.value = '';
      elements.title.textContent = 'Nuevo Tratamiento de Belleza';
      elements.error.textContent = '';
      elements.modal.hidden = false;
      elements.name.focus();
    });
  }

  const closeModal = () => {
    elements.modal.hidden = true;
    elements.form.reset();
    elements.error.textContent = '';
  };

  if (elements.closeBtn) elements.closeBtn.addEventListener('click', closeModal);
  if (elements.cancelBtn) elements.cancelBtn.addEventListener('click', closeModal);
  elements.modal?.addEventListener('click', (e) => {
    if (e.target === elements.modal) closeModal();
  });

  // Delegación de eventos para Editar y Eliminar
  elements.grid?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-service]');
    const delBtn = e.target.closest('[data-delete-service]');
    let services = getStoredServices();

    if (editBtn) {
      const editId = editBtn.dataset.editService;
      const s = services.find(item => item.id === editId);
      if (s) {
        elements.form.reset();
        elements.id.value = s.id;
        elements.title.textContent = 'Editar Tratamiento';
        elements.name.value = s.name;
        elements.description.value = s.description;
        elements.price.value = s.price;
        elements.duration.value = s.duration;
        elements.category.value = s.category;
        elements.serviceStatus.value = s.status || 'available';
        elements.image.value = s.image || '';
        elements.error.textContent = '';
        elements.modal.hidden = false;
      }
      return;
    }

    if (delBtn) {
      const delId = delBtn.dataset.deleteService;
      if (window.confirm('¿Seguro que deseas eliminar este tratamiento? Esta acción no se puede deshacer.')) {
        services = services.filter(s => s.id !== delId);
        saveStoredServices(services);
        loadAdminServices();
      }
    }
  });

  // Guardar (Crear o Actualizar)
  elements.form?.addEventListener('submit', (e) => {
    e.preventDefault();
    elements.error.textContent = '';

    const nameVal = elements.name.value.trim();
    const descVal = elements.description.value.trim();
    const priceVal = Number(elements.price.value);
    const durationVal = Number(elements.duration.value);
    const categoryVal = elements.category.value.trim();
    const statusVal = elements.serviceStatus.value;
    const imageVal = elements.image.value.trim();

    if (!nameVal || !descVal || !categoryVal || Number.isNaN(priceVal) || Number.isNaN(durationVal)) {
      elements.error.textContent = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    const payload = {
      name: nameVal,
      description: descVal,
      price: priceVal,
      duration: durationVal,
      category: categoryVal,
      status: statusVal,
      image: imageVal || 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80'
    };

    const sid = elements.id.value;
    let services = getStoredServices();

    if (sid) {
      const target = services.find(s => s.id === sid);
      if (target) Object.assign(target, payload);
    } else {
      services.push({
        ...payload,
        id: `service-${Date.now()}`
      });
    }

    saveStoredServices(services);
    closeModal();
    loadAdminServices();
  });

  // Filtros
  elements.search?.addEventListener('input', loadAdminServices);
  elements.status?.addEventListener('change', loadAdminServices);

  // Tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.modal.hidden) {
      closeModal();
    }
  });

  // 6. INICIALIZACIÓN
  loadAdminServices();
})();
