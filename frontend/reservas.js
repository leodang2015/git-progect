/**
 * BellaSalón Studio & Spa - Módulo de Gestión de Citas (Mis Citas / Agenda)
 * Implementa HUS-06 (Agendar), HUS-07 (Listar/Detalle), HUS-08 (Reprogramar), HUS-09 (Cancelar)
 */

(function () {
  'use strict';

  // 1. VALIDACIÓN DE SESIÓN
  const auth = window.BellaSalon.validateSession();
  if (!auth) return;

  // 2. CONFIGURACIÓN DEL LAYOUT (Sidebar activo: navReservas)
  window.BellaSalon.setupSharedLayout(auth, 'navReservas');

  const {
    salonStylists,
    getStoredServices,
    getStoredReservations,
    saveStoredReservations,
    getUserScopeReservations,
    escapeHtml,
    formatPrice,
    formatDate,
    formatReadableDate,
    statusLabels,
    normalizeStatus,
    generateWhatsAppUrl
  } = window.BellaSalon;

  // Adaptación de textos para Administrador
  if (auth.isAdmin) {
    const titleEl = document.getElementById('reservationsTitle');
    if (titleEl) titleEl.textContent = 'Agenda General del Salón';
    const subTitleEl = document.getElementById('reservationsSubtitle');
    if (subTitleEl) subTitleEl.textContent = 'Control general de citas agendadas por clientes, atención de estilistas y gestión de turnos.';
  }

  // 3. ELEMENTOS DEL DOM
  const elements = {
    tableWrap: document.getElementById('reservationsTableWrap'),
    tableBody: document.getElementById('reservationsTableBody'),
    cardsContainer: document.getElementById('reservationsCardsContainer'),
    search: document.getElementById('reservationSearch'),
    datePreset: document.getElementById('reservationDatePreset'),
    dateFilter: document.getElementById('reservationDateFilter'),
    clearDateBtn: document.getElementById('clearDateFilterBtn'),
    statusFilter: document.getElementById('reservationStatusFilter'),
    resetFiltersBtn: document.getElementById('resetReservationFilters'),
    feedback: document.getElementById('reservationFeedback'),
    empty: document.getElementById('emptyReservations'),
    // Switch de Vistas (Tarjetas vs Tabla)
    viewCardsBtn: document.getElementById('viewCardsBtn'),
    viewTableBtn: document.getElementById('viewTableBtn'),
    // Píldoras de estado
    pills: document.querySelectorAll('.status-pill'),
    countAll: document.getElementById('countAll'),
    countConfirmed: document.getElementById('countConfirmed'),
    countPending: document.getElementById('countPending'),
    countCompleted: document.getElementById('countCompleted'),
    countCancelled: document.getElementById('countCancelled'),
    // Paginación
    paginationWrap: document.getElementById('reservationPagination'),
    paginationInfo: document.getElementById('reservationPaginationInfo'),
    rowsPerPage: document.getElementById('reservationsPerPage'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    pageNumbers: document.getElementById('reservationPageNumbers'),
    // Modal Detalle
    detailModal: document.getElementById('reservationDetailModal'),
    detailCode: document.getElementById('detailCode'),
    detailStatusBadge: document.getElementById('detailStatusBadge'),
    detailService: document.getElementById('detailService'),
    detailStylist: document.getElementById('detailStylist'),
    detailDate: document.getElementById('detailDate'),
    detailTime: document.getElementById('detailTime'),
    detailHairLength: document.getElementById('detailHairLength'),
    detailPrice: document.getElementById('detailPrice'),
    detailUser: document.getElementById('detailUser'),
    detailCreatedAt: document.getElementById('detailCreatedAt'),
    detailNotes: document.getElementById('detailNotes'),
    closeDetailBtn: document.getElementById('closeDetailModal'),
    closeDetailBtn2: document.getElementById('closeDetailModalBtn'),
    printDetailBtn: document.getElementById('printDetailButton'),
    detailWhatsAppBtn: document.getElementById('detailWhatsAppBtn'),
    editFromDetailBtn: document.getElementById('editFromDetailBtn'),
    cancelFromDetailBtn: document.getElementById('cancelFromDetailBtn'),
    // Modal Editar
    editModal: document.getElementById('editReservationModal'),
    editForm: document.getElementById('editReservationForm'),
    editFormError: document.getElementById('editReservationFormError'),
    editId: document.getElementById('editReservationId'),
    editCodeBadge: document.getElementById('editReservationCodeBadge'),
    editService: document.getElementById('editReservationService'),
    editStylist: document.getElementById('editReservationStylist'),
    editHairLength: document.getElementById('editReservationHairLength'),
    editDate: document.getElementById('editReservationDate'),
    editTime: document.getElementById('editReservationTime'),
    editNotes: document.getElementById('editReservationNotes'),
    editStatusWrap: document.getElementById('editStatusWrap'),
    editStatus: document.getElementById('editReservationStatus'),
    editSummaryService: document.getElementById('editSummaryService'),
    editSummaryDateTime: document.getElementById('editSummaryDateTime'),
    editSummaryPrice: document.getElementById('editSummaryPrice'),
    closeEditModalBtn: document.getElementById('closeEditReservationModal'),
    cancelEditModalBtn: document.getElementById('cancelEditReservationBtn'),
    // Modal Confirmar Edición
    confirmModal: document.getElementById('confirmUpdateModal'),
    confirmChangesPreview: document.getElementById('promptChangesPreview'),
    cancelConfirmBtn: document.getElementById('cancelConfirmUpdateBtn'),
    confirmUpdateBtn: document.getElementById('confirmUpdateBtn'),
    // Modal Cancelar
    cancelModal: document.getElementById('cancelReservationModal'),
    cancelModalService: document.getElementById('cancelModalService'),
    cancelModalDate: document.getElementById('cancelModalDate'),
    cancelModalTime: document.getElementById('cancelModalTime'),
    cancelModalCode: document.getElementById('cancelModalCode'),
    cancelError: document.getElementById('cancelReservationError'),
    closeCancelModalBtn: document.getElementById('closeCancelReservationModal'),
    cancelDismissBtn: document.getElementById('cancelDismissBtn'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),
    // Botón Nuevo
    openNewBtn: document.getElementById('newReservationButton')
  };

  // 4. ESTADO DE LA VISTA
  let currentViewMode = localStorage.getItem('salon_view_mode') || 'cards';
  let currentPage = 1;
  let itemsPerPage = currentViewMode === 'cards' ? 6 : 10;
  let currentSelectedDetailReservation = null;
  let currentEditingReservation = null;
  let currentCancellingReservation = null;
  let pendingUpdatePayload = null;

  // 5. INICIALIZAR MODAL DE AGENDAR CITA CON SHARED HELPER
  const bookingHandler = window.BellaSalon.setupBookingModal(auth, () => {
    showFeedback('✓ Cita agendada con éxito. ¡Te esperamos en BellaSalón!', 'success');
    renderReservations();
  });

  if (elements.openNewBtn) {
    elements.openNewBtn.addEventListener('click', () => {
      bookingHandler.openBookingModal();
    });
  }

  // Comprobar parámetros en la URL (por ejemplo si viene de servicios con ?serviceId=... o ?new=1)
  const urlParams = new URLSearchParams(window.location.search);
  const paramServiceId = urlParams.get('serviceId');
  const paramNew = urlParams.get('new');
  if (paramServiceId || paramNew) {
    window.setTimeout(() => {
      bookingHandler.openBookingModal(paramServiceId);
    }, 200);
  }

  // 6. ACTUALIZAR CONTADORES DE PÍLDORAS
  const updateStatusCounts = (userScopeList) => {
    const counts = { all: userScopeList.length, confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
    userScopeList.forEach(r => {
      const norm = normalizeStatus(r.status);
      if (counts[norm] !== undefined) counts[norm]++;
    });

    if (elements.countAll) elements.countAll.textContent = counts.all;
    if (elements.countConfirmed) elements.countConfirmed.textContent = counts.confirmed;
    if (elements.countPending) elements.countPending.textContent = counts.pending;
    if (elements.countCompleted) elements.countCompleted.textContent = counts.completed;
    if (elements.countCancelled) elements.countCancelled.textContent = counts.cancelled;
  };

  // 7. RENDERIZAR VISTA DE TARJETAS TIPO SALÓN
  const renderCardsView = (items) => {
    if (!elements.cardsContainer) return;
    elements.cardsContainer.innerHTML = items.map(res => {
      const norm = normalizeStatus(res.status);
      const label = statusLabels[norm] || res.status;
      const stylist = salonStylists.find(s => s.id === res.stylistId) || { name: res.stylistName || 'Estilista', avatar: '', specialty: 'Estilista de Salón' };
      const avatarSrc = stylist.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

      return `
        <article class="appointment-card status-${norm}">
          <div class="appointment-card-header">
            <span class="appointment-code">#${escapeHtml(res.id)}</span>
            <span class="status-badge ${norm}">${escapeHtml(label)}</span>
          </div>

          <div class="appointment-card-body">
            <h3 class="appointment-service-title">${escapeHtml(res.serviceName)}</h3>

            <div class="appointment-stylist-row">
              <img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(stylist.name)}" class="stylist-avatar" loading="lazy">
              <div class="stylist-info">
                <strong>${escapeHtml(res.stylistName || stylist.name)}</strong>
                <span>${escapeHtml(stylist.specialty || 'Profesional de Belleza')}</span>
              </div>
            </div>

            <div class="appointment-meta-grid">
              <div class="meta-item">
                <i class="fa-solid fa-calendar-day"></i>
                <div>
                  <small>Fecha</small>
                  <strong>${formatReadableDate(res.date)}</strong>
                </div>
              </div>
              <div class="meta-item">
                <i class="fa-solid fa-clock"></i>
                <div>
                  <small>Hora de turno</small>
                  <strong>${escapeHtml(res.time)}</strong>
                </div>
              </div>
            </div>

            <div class="appointment-price-row">
              <span class="price-label">Inversión estimada:</span>
              <strong class="price-val">${formatPrice(res.price || 0)}</strong>
            </div>

            ${auth.isAdmin && res.userName ? `
              <div class="admin-client-info" style="font-size:12px; color:var(--text-muted); padding:6px 0 2px; border-top:1px dashed var(--border-subtle); margin-top:6px;">
                <i class="fa-solid fa-user" style="color:var(--salon-rose);"></i> Cliente: <strong>${escapeHtml(res.userName)}</strong>
              </div>
            ` : ''}
          </div>

          <div class="appointment-card-actions">
            ${auth.isAdmin && norm === 'pending' ? `
              <button class="action-btn confirm-admin-btn" data-quick-confirm="${escapeHtml(res.id)}" type="button" title="Confirmar cita del cliente">
                <i class="fa-solid fa-check"></i> Confirmar
              </button>
            ` : ''}
            ${auth.isAdmin && norm === 'confirmed' ? `
              <button class="action-btn complete-admin-btn" data-quick-complete="${escapeHtml(res.id)}" type="button" title="Marcar como atendida y finalizada">
                <i class="fa-solid fa-sparkles"></i> Finalizar
              </button>
            ` : ''}
            <button class="action-btn detail-btn" data-detail-id="${escapeHtml(res.id)}" type="button" title="Ver comprobante y detalles de cita">
              <i class="fa-solid fa-eye"></i> Comprobante
            </button>
            ${norm !== 'cancelled' && norm !== 'completed' ? `
              <button class="action-btn edit-btn" data-edit-id="${escapeHtml(res.id)}" type="button" title="Reprogramar fecha u hora">
                <i class="fa-solid fa-calendar-days"></i> Reprogramar
              </button>
              <button class="action-btn cancel-btn" data-cancel-id="${escapeHtml(res.id)}" type="button" title="Cancelar esta cita">
                <i class="fa-solid fa-ban"></i> Cancelar
              </button>
            ` : `
              <span class="status-indicator-muted" style="margin-left:auto; font-size:12px; color:var(--text-dim); display:flex; align-items:center; gap:6px;">
                ${norm === 'completed' ? '<i class="fa-solid fa-check-double"></i> Atendida' : '<i class="fa-solid fa-circle-xmark"></i> Cancelada'}
              </span>
            `}
          </div>
        </article>
      `;
    }).join('');
  };

  // 8. RENDERIZAR VISTA TABLA CLÁSICA
  const renderTableView = (items) => {
    if (!elements.tableBody) return;
    elements.tableBody.innerHTML = items.map(res => {
      const norm = normalizeStatus(res.status);
      const label = statusLabels[norm] || res.status;
      return `
        <tr>
          <td><strong>#${escapeHtml(res.id)}</strong></td>
          <td>
            <strong>${escapeHtml(res.serviceName)}</strong>
            <small style="display:block; color:var(--text-muted);">${escapeHtml(res.stylistName || 'Sin estilista asignado')}</small>
          </td>
          <td>${formatReadableDate(res.date)}</td>
          <td>${escapeHtml(res.time)}</td>
          ${auth.isAdmin ? `<td class="admin-only"><strong>${escapeHtml(res.userName || 'Cliente')}</strong></td>` : ''}
          <td><strong>${formatPrice(res.price || 0)}</strong></td>
          <td><span class="status-badge ${norm}">${escapeHtml(label)}</span></td>
          <td>
            <div class="reservation-actions-group">
              <button class="action-btn detail-btn" data-detail-id="${escapeHtml(res.id)}" type="button" title="Ver comprobante de la cita">
                <i class="fa-solid fa-eye"></i>
              </button>
              ${norm !== 'cancelled' && norm !== 'completed' ? `
                <button class="action-btn edit-btn" data-edit-id="${escapeHtml(res.id)}" type="button" title="Reprogramar">
                  <i class="fa-solid fa-calendar-days"></i>
                </button>
                <button class="action-btn cancel-btn" data-cancel-id="${escapeHtml(res.id)}" type="button" title="Cancelar">
                  <i class="fa-solid fa-ban"></i>
                </button>
              ` : ''}
              ${auth.isAdmin && norm === 'pending' ? `
                <button class="action-btn confirm-admin-btn" data-quick-confirm="${escapeHtml(res.id)}" type="button" title="Confirmar">
                  <i class="fa-solid fa-check"></i>
                </button>
              ` : ''}
              ${auth.isAdmin && norm === 'confirmed' ? `
                <button class="action-btn complete-admin-btn" data-quick-complete="${escapeHtml(res.id)}" type="button" title="Finalizar">
                  <i class="fa-solid fa-sparkles"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  // 9. FUNCIÓN PRINCIPAL DE FILTRADO Y RENDERIZADO
  const renderReservations = () => {
    const query = (elements.search?.value || '').trim().toLowerCase();
    const selectedStatus = normalizeStatus(elements.statusFilter?.value);
    const datePreset = elements.datePreset?.value || 'all';
    const customDate = elements.dateFilter?.value;

    const allReservations = getStoredReservations();
    const userScopeList = getUserScopeReservations(allReservations, auth.currentUser, auth.isAdmin);

    updateStatusCounts(userScopeList);

    const todayStr = new Date().toISOString().split('T')[0];

    const filtered = userScopeList.filter(res => {
      const matchesQuery = !query ||
        (res.id && res.id.toLowerCase().includes(query)) ||
        (res.serviceName && res.serviceName.toLowerCase().includes(query)) ||
        (res.stylistName && res.stylistName.toLowerCase().includes(query)) ||
        (res.userName && res.userName.toLowerCase().includes(query)) ||
        (res.notes && res.notes.toLowerCase().includes(query)) ||
        (res.date && res.date.includes(query)) ||
        (res.time && res.time.toLowerCase().includes(query));

      const resNorm = normalizeStatus(res.status);
      const matchesStatus = !selectedStatus || resNorm === selectedStatus;

      let matchesDate = true;
      if (datePreset === 'today') matchesDate = res.date === todayStr;
      else if (datePreset === 'upcoming') matchesDate = res.date >= todayStr;
      else if (datePreset === 'past') matchesDate = res.date < todayStr;
      else if (datePreset === 'custom' && customDate) matchesDate = res.date === customDate;

      return matchesQuery && matchesStatus && matchesDate;
    });

    // Paginación
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedList = filtered.slice(startIndex, endIndex);

    // Conmutar vistas
    if (currentViewMode === 'cards') {
      if (elements.cardsContainer) elements.cardsContainer.hidden = false;
      if (elements.tableWrap) elements.tableWrap.hidden = true;
      if (elements.viewCardsBtn) elements.viewCardsBtn.classList.add('active');
      if (elements.viewTableBtn) elements.viewTableBtn.classList.remove('active');
      renderCardsView(paginatedList);
    } else {
      if (elements.cardsContainer) elements.cardsContainer.hidden = true;
      if (elements.tableWrap) elements.tableWrap.hidden = false;
      if (elements.viewCardsBtn) elements.viewCardsBtn.classList.remove('active');
      if (elements.viewTableBtn) elements.viewTableBtn.classList.add('active');
      renderTableView(paginatedList);
    }

    if (elements.empty) {
      elements.empty.hidden = totalItems > 0;
    }

    // Información de paginación
    if (elements.paginationInfo) {
      if (totalItems === 0) {
        elements.paginationInfo.innerHTML = 'Mostrando <strong>0</strong> citas';
      } else {
        elements.paginationInfo.innerHTML = `Mostrando <strong>${startIndex + 1}</strong> a <strong>${endIndex}</strong> de <strong>${totalItems}</strong> cita(s)`;
      }
    }

    if (elements.prevPageBtn) elements.prevPageBtn.disabled = currentPage <= 1;
    if (elements.nextPageBtn) elements.nextPageBtn.disabled = currentPage >= totalPages;

    if (elements.pageNumbers) {
      elements.pageNumbers.innerHTML = '';
      for (let p = 1; p <= totalPages; p++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `page-num ${p === currentPage ? 'active' : ''}`;
        btn.textContent = String(p);
        btn.addEventListener('click', () => {
          currentPage = p;
          renderReservations();
        });
        elements.pageNumbers.appendChild(btn);
      }
    }

    if (elements.feedback) {
      elements.feedback.textContent = `${totalItems} cita(s) encontrada(s)`;
    }
  };

  // Switch de Vistas (Tarjetas vs Tabla)
  if (elements.viewCardsBtn) {
    elements.viewCardsBtn.addEventListener('click', () => {
      currentViewMode = 'cards';
      localStorage.setItem('salon_view_mode', 'cards');
      itemsPerPage = 6;
      currentPage = 1;
      renderReservations();
    });
  }

  if (elements.viewTableBtn) {
    elements.viewTableBtn.addEventListener('click', () => {
      currentViewMode = 'table';
      localStorage.setItem('salon_view_mode', 'table');
      itemsPerPage = 10;
      currentPage = 1;
      renderReservations();
    });
  }

  // 10. MODAL DETALLE DE CITA (HUS-07 T08)
  const openDetailModal = (res) => {
    if (!res) return;
    currentSelectedDetailReservation = res;
    const norm = normalizeStatus(res.status);
    const label = statusLabels[norm] || res.status;

    elements.detailCode.textContent = `#${res.id}`;
    elements.detailStatusBadge.className = `status-badge ${norm}`;
    elements.detailStatusBadge.textContent = label;
    elements.detailService.textContent = res.serviceName || 'Servicio de Belleza';
    elements.detailPrice.textContent = formatPrice(res.price || 0);
    elements.detailDate.textContent = formatReadableDate(res.date);
    elements.detailTime.textContent = res.time || '—';
    if (elements.detailStylist) elements.detailStylist.textContent = res.stylistName || 'Primer estilista disponible';
    if (elements.detailHairLength) elements.detailHairLength.textContent = res.hairLength || 'No especificado';
    elements.detailUser.textContent = res.userName || auth.userName;
    elements.detailCreatedAt.textContent = res.createdAt ? formatDate(res.createdAt) : formatDate(new Date());
    elements.detailNotes.textContent = res.notes || 'Sin observaciones o especificaciones registradas.';

    if (elements.detailWhatsAppBtn) {
      elements.detailWhatsAppBtn.href = generateWhatsAppUrl(res);
    }

    if (elements.editFromDetailBtn) {
      elements.editFromDetailBtn.disabled = norm === 'cancelled';
    }
    if (elements.cancelFromDetailBtn) {
      elements.cancelFromDetailBtn.disabled = norm === 'cancelled' || norm === 'completed';
    }

    elements.detailModal.hidden = false;
  };

  const closeDetailModal = () => {
    elements.detailModal.hidden = true;
  };

  if (elements.closeDetailBtn) elements.closeDetailBtn.addEventListener('click', closeDetailModal);
  if (elements.closeDetailBtn2) elements.closeDetailBtn2.addEventListener('click', closeDetailModal);
  if (elements.printDetailBtn) elements.printDetailBtn.addEventListener('click', () => window.print());

  // 11. MODAL REPROGRAMAR / EDITAR CITA (HUS-08)
  const setupEditFormOptions = () => {
    const services = getStoredServices().filter(s => s.status === 'available' || s.isActive !== false);
    if (elements.editService) {
      elements.editService.innerHTML = '<option value="" disabled>Seleccione un servicio ▼</option>' +
        services.map(s => `<option value="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}" data-price="${s.price || 0}">${escapeHtml(s.name)} — ${formatPrice(s.price)}</option>`).join('');
    }

    if (elements.editStylist) {
      elements.editStylist.innerHTML = salonStylists.map(sty =>
        `<option value="${escapeHtml(sty.id)}">${escapeHtml(sty.name)} ${sty.badge ? `(${sty.badge})` : ''}</option>`
      ).join('');
    }

    if (elements.editDate) {
      const todayISO = new Date().toISOString().split('T')[0];
      elements.editDate.min = todayISO;
    }
  };

  setupEditFormOptions();

  const updateEditSummary = () => {
    const selectedOption = elements.editService.options[elements.editService.selectedIndex];
    const srvName = selectedOption?.dataset.name || elements.editService.options[elements.editService.selectedIndex]?.text || '—';
    const srvPrice = Number(selectedOption?.dataset.price || 0);

    elements.editSummaryService.textContent = srvName;
    elements.editSummaryDateTime.textContent = `${formatReadableDate(elements.editDate.value)} a las ${elements.editTime.value || '—'}`;
    elements.editSummaryPrice.textContent = formatPrice(srvPrice);
  };

  elements.editService?.addEventListener('change', updateEditSummary);
  elements.editStylist?.addEventListener('change', updateEditSummary);
  elements.editDate?.addEventListener('change', updateEditSummary);
  elements.editTime?.addEventListener('change', updateEditSummary);

  const openEditModal = (res) => {
    if (!res) return;
    currentEditingReservation = res;
    elements.editFormError.textContent = '';
    elements.editId.value = res.id;
    elements.editCodeBadge.textContent = `#${res.id}`;

    if (elements.editService) elements.editService.value = res.serviceId;
    if (elements.editStylist) elements.editStylist.value = res.stylistId || 'sty-any';
    if (elements.editHairLength) elements.editHairLength.value = res.hairLength || 'Medio';
    if (elements.editDate) elements.editDate.value = res.date;
    if (elements.editTime) elements.editTime.value = res.time;
    if (elements.editNotes) elements.editNotes.value = res.notes || '';

    if (auth.isAdmin && elements.editStatusWrap) {
      elements.editStatusWrap.hidden = false;
      elements.editStatus.value = normalizeStatus(res.status);
    } else if (elements.editStatusWrap) {
      elements.editStatusWrap.hidden = true;
    }

    updateEditSummary();
    elements.editModal.hidden = false;
  };

  const closeEditModal = () => {
    elements.editModal.hidden = true;
    currentEditingReservation = null;
  };

  if (elements.closeEditModalBtn) elements.closeEditModalBtn.addEventListener('click', closeEditModal);
  if (elements.cancelEditModalBtn) elements.cancelEditModalBtn.addEventListener('click', closeEditModal);

  elements.editForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    elements.editFormError.textContent = '';

    const serviceId = elements.editService.value;
    const stylistId = elements.editStylist.value || 'sty-any';
    const hairLengthVal = elements.editHairLength.value;
    const dateVal = elements.editDate.value;
    const timeVal = elements.editTime.value;
    const notesVal = elements.editNotes.value.trim();
    const statusVal = auth.isAdmin && elements.editStatus?.value ? elements.editStatus.value : currentEditingReservation.status;

    if (!serviceId || !dateVal || !timeVal) {
      elements.editFormError.textContent = 'Por favor completa todos los campos requeridos (servicio, fecha y hora).';
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateVal < todayStr) {
      elements.editFormError.textContent = 'No puedes agendar citas en fechas anteriores a hoy.';
      return;
    }

    const stylistObj = salonStylists.find(s => s.id === stylistId) || salonStylists[salonStylists.length - 1];
    const allReservations = getStoredReservations();

    // Verificación de conflicto de horario
    if (stylistId !== 'sty-any') {
      const isConflict = allReservations.some(r =>
        r.id !== currentEditingReservation.id &&
        r.stylistId === stylistId &&
        r.date === dateVal &&
        r.time === timeVal &&
        ['confirmed', 'pending'].includes(normalizeStatus(r.status))
      );
      if (isConflict) {
        elements.editFormError.textContent = `${stylistObj.name} ya tiene una cita agendada en ese horario. Por favor selecciona otra hora.`;
        return;
      }
    }

    const services = getStoredServices();
    const selectedService = services.find(s => s.id === serviceId) || {
      id: serviceId,
      name: elements.editService.options[elements.editService.selectedIndex]?.dataset.name || 'Servicio',
      price: 0
    };

    pendingUpdatePayload = {
      id: currentEditingReservation.id,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      stylistId: stylistObj.id,
      stylistName: stylistObj.name,
      hairLength: hairLengthVal,
      date: dateVal,
      time: timeVal,
      price: selectedService.price || 0,
      notes: notesVal || 'Sin observaciones',
      status: statusVal
    };

    elements.confirmChangesPreview.innerHTML = `
      <div class="prompt-preview-row"><span>Código:</span><strong>#${escapeHtml(currentEditingReservation.id)}</strong></div>
      <div class="prompt-preview-row"><span>Tratamiento:</span><strong>${escapeHtml(selectedService.name)}</strong></div>
      <div class="prompt-preview-row"><span>Estilista:</span><strong>${escapeHtml(stylistObj.name)}</strong></div>
      <div class="prompt-preview-row"><span>Fecha & Hora:</span><strong>${formatReadableDate(dateVal)} a las ${timeVal}</strong></div>
      <div class="prompt-preview-row"><span>Valor:</span><strong style="color:var(--salon-rose);">${formatPrice(selectedService.price || 0)}</strong></div>
    `;

    elements.confirmModal.hidden = false;
  });

  const closeConfirmModal = () => {
    elements.confirmModal.hidden = true;
  };
  if (elements.cancelConfirmBtn) elements.cancelConfirmBtn.addEventListener('click', closeConfirmModal);

  elements.confirmUpdateBtn?.addEventListener('click', () => {
    if (!pendingUpdatePayload) return;
    const allReservations = getStoredReservations();
    const targetIdx = allReservations.findIndex(r => r.id === pendingUpdatePayload.id);

    if (targetIdx >= 0) {
      allReservations[targetIdx] = {
        ...allReservations[targetIdx],
        ...pendingUpdatePayload,
        updatedAt: new Date().toISOString()
      };
      saveStoredReservations(allReservations);
    }

    closeConfirmModal();
    closeEditModal();

    if (!elements.detailModal.hidden && currentSelectedDetailReservation?.id === pendingUpdatePayload.id) {
      openDetailModal(allReservations[targetIdx]);
    }

    showFeedback(`✓ Cita #${pendingUpdatePayload.id} actualizada con éxito.`, 'success');
    renderReservations();
  });

  // 12. MODAL CANCELAR CITA (HUS-09)
  const openCancelModal = (res) => {
    if (!res) return;
    currentCancellingReservation = res;
    elements.cancelModalService.textContent = res.serviceName;
    elements.cancelModalDate.textContent = formatReadableDate(res.date);
    elements.cancelModalTime.textContent = res.time;
    elements.cancelModalCode.textContent = `#${res.id}`;
    elements.cancelError.textContent = '';
    elements.cancelModal.hidden = false;
    elements.cancelDismissBtn?.focus();
  };

  const closeCancelModal = () => {
    elements.cancelModal.hidden = true;
    currentCancellingReservation = null;
  };

  if (elements.closeCancelModalBtn) elements.closeCancelModalBtn.addEventListener('click', closeCancelModal);
  if (elements.cancelDismissBtn) elements.cancelDismissBtn.addEventListener('click', closeCancelModal);

  elements.confirmCancelBtn?.addEventListener('click', () => {
    if (!currentCancellingReservation) return;
    const allReservations = getStoredReservations();
    const targetIdx = allReservations.findIndex(r => r.id === currentCancellingReservation.id);

    if (targetIdx >= 0) {
      allReservations[targetIdx].status = 'cancelled';
      allReservations[targetIdx].cancelledAt = new Date().toISOString();
      saveStoredReservations(allReservations);
    }

    closeCancelModal();

    if (!elements.detailModal.hidden && currentSelectedDetailReservation?.id === currentCancellingReservation.id) {
      openDetailModal(allReservations[targetIdx]);
    }

    showFeedback(`✓ Cita #${currentCancellingReservation.id} cancelada. Horario liberado en el salón.`, 'error');
    renderReservations();
  });

  // 13. ACCIONES DELEGADAS EN TARJETAS Y TABLA
  const handleReservationActions = (e) => {
    const allReservations = getStoredReservations();

    const detailBtn = e.target.closest('[data-detail-id]');
    if (detailBtn) {
      const res = allReservations.find(r => r.id === detailBtn.dataset.detailId);
      if (res) openDetailModal(res);
      return;
    }

    const editBtn = e.target.closest('[data-edit-id]');
    if (editBtn) {
      const res = allReservations.find(r => r.id === editBtn.dataset.editId);
      if (res) openEditModal(res);
      return;
    }

    const cancelBtn = e.target.closest('[data-cancel-id]');
    if (cancelBtn) {
      const res = allReservations.find(r => r.id === cancelBtn.dataset.cancelId);
      if (res) openCancelModal(res);
      return;
    }

    const confirmAdminBtn = e.target.closest('[data-quick-confirm]');
    if (confirmAdminBtn) {
      const id = confirmAdminBtn.dataset.quickConfirm;
      const target = allReservations.find(r => r.id === id);
      if (target) {
        target.status = 'confirmed';
        target.confirmedAt = new Date().toISOString();
        saveStoredReservations(allReservations);
        showFeedback(`✓ Cita #${id} confirmada exitosamente.`, 'success');
        renderReservations();
      }
      return;
    }

    const completeAdminBtn = e.target.closest('[data-quick-complete]');
    if (completeAdminBtn) {
      const id = completeAdminBtn.dataset.quickComplete;
      const target = allReservations.find(r => r.id === id);
      if (target) {
        target.status = 'completed';
        target.completedAt = new Date().toISOString();
        saveStoredReservations(allReservations);
        showFeedback(`✓ Cita #${id} marcada como realizada y finalizada.`, 'success');
        renderReservations();
      }
      return;
    }
  };

  elements.cardsContainer?.addEventListener('click', handleReservationActions);
  elements.tableBody?.addEventListener('click', handleReservationActions);

  if (elements.editFromDetailBtn) {
    elements.editFromDetailBtn.addEventListener('click', () => {
      if (currentSelectedDetailReservation) {
        const toEdit = currentSelectedDetailReservation;
        closeDetailModal();
        openEditModal(toEdit);
      }
    });
  }

  if (elements.cancelFromDetailBtn) {
    elements.cancelFromDetailBtn.addEventListener('click', () => {
      if (currentSelectedDetailReservation) {
        const toCancel = currentSelectedDetailReservation;
        closeDetailModal();
        openCancelModal(toCancel);
      }
    });
  }

  // 14. EVENTOS DE BÚSQUEDA Y FILTRADO
  const showFeedback = (msg, type = 'info') => {
    if (!elements.feedback) return;
    elements.feedback.textContent = msg;
    elements.feedback.style.color = type === 'error' ? '#c2535f' : type === 'success' ? '#277958' : '';
    setTimeout(() => {
      if (elements.feedback) elements.feedback.style.color = '';
      renderReservations();
    }, 4000);
  };

  elements.search?.addEventListener('input', () => {
    currentPage = 1;
    renderReservations();
  });

  const syncPills = (statusVal) => {
    const norm = normalizeStatus(statusVal);
    elements.pills.forEach(pill => {
      const pillNorm = normalizeStatus(pill.dataset.pillStatus);
      if (pillNorm === norm) pill.classList.add('active');
      else pill.classList.remove('active');
    });
  };

  elements.pills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (elements.statusFilter) elements.statusFilter.value = pill.dataset.pillStatus;
      syncPills(pill.dataset.pillStatus);
      currentPage = 1;
      renderReservations();
    });
  });

  elements.datePreset?.addEventListener('change', () => {
    if (elements.datePreset.value === 'custom') {
      elements.dateFilter.hidden = false;
      elements.clearDateBtn.hidden = false;
      elements.dateFilter.focus();
    } else {
      elements.dateFilter.hidden = true;
      elements.clearDateBtn.hidden = true;
      elements.dateFilter.value = '';
    }
    currentPage = 1;
    renderReservations();
  });

  elements.dateFilter?.addEventListener('change', () => {
    currentPage = 1;
    renderReservations();
  });

  elements.clearDateBtn?.addEventListener('click', () => {
    elements.dateFilter.value = '';
    elements.datePreset.value = 'all';
    elements.dateFilter.hidden = true;
    elements.clearDateBtn.hidden = true;
    currentPage = 1;
    renderReservations();
  });

  elements.resetFiltersBtn?.addEventListener('click', () => {
    if (elements.search) elements.search.value = '';
    if (elements.statusFilter) elements.statusFilter.value = '';
    if (elements.datePreset) elements.datePreset.value = 'all';
    if (elements.dateFilter) {
      elements.dateFilter.value = '';
      elements.dateFilter.hidden = true;
    }
    if (elements.clearDateBtn) elements.clearDateBtn.hidden = true;
    syncPills('');
    currentPage = 1;
    renderReservations();
  });

  elements.rowsPerPage?.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value, 10) || 6;
    currentPage = 1;
    renderReservations();
  });

  elements.prevPageBtn?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderReservations();
    }
  });

  elements.nextPageBtn?.addEventListener('click', () => {
    currentPage++;
    renderReservations();
  });

  // Tecla Escape para cerrar modales abiertos
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.cancelModal && !elements.cancelModal.hidden) closeCancelModal();
      else if (elements.confirmModal && !elements.confirmModal.hidden) closeConfirmModal();
      else if (elements.editModal && !elements.editModal.hidden) closeEditModal();
      else if (elements.detailModal && !elements.detailModal.hidden) closeDetailModal();
    }
  });

  // 15. INICIALIZACIÓN
  renderReservations();
})();
