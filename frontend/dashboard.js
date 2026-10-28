/**
 * BellaSalón Studio & Spa - Resumen Ejecutivo (Dashboard Principal)
 * Renderiza métricas inteligentes, agenda próxima y accesos directos.
 */

(function () {
  'use strict';

  // 1. VALIDACIÓN DE SESIÓN
  const auth = window.BellaSalon.validateSession();
  if (!auth) return;

  // 2. CONFIGURACIÓN DEL LAYOUT COMPARTIDO (Sidebar activo: navDashboard)
  window.BellaSalon.setupSharedLayout(auth, 'navDashboard');

  const {
    getStoredReservations,
    getStoredServices,
    getUserScopeReservations,
    formatReadableDate,
    formatPrice,
    escapeHtml,
    normalizeStatus,
    statusLabels
  } = window.BellaSalon;

  // 3. INICIALIZACIÓN DEL SALUDO
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const welcomeGreetingEl = document.getElementById('welcomeGreeting');
  if (welcomeGreetingEl) welcomeGreetingEl.textContent = getGreeting();

  const welcomeNameEl = document.getElementById('welcomeName');
  if (welcomeNameEl) welcomeNameEl.textContent = auth.userName;

  const welcomeDescEl = document.getElementById('welcomeDescription');
  if (welcomeDescEl) {
    welcomeDescEl.textContent = auth.isAdmin
      ? 'Panel de control administrativo general. Monitorea métricas en tiempo real, citas agendadas y atención del equipo de estilistas.'
      : '¡Es momento de consentirte! Consulta tus próximas citas de belleza o agenda un nuevo servicio exclusivo.';
  }

  // 4. CÁLCULO Y RENDERIZADO DE KPIS INTELIGENTES
  const renderDashboardKPIs = () => {
    const allReservations = getStoredReservations();
    const userScopeList = getUserScopeReservations(allReservations, auth.currentUser, auth.isAdmin);
    const services = getStoredServices();

    const activeList = userScopeList.filter(r => ['pending', 'confirmed'].includes(normalizeStatus(r.status)));
    const completedList = userScopeList.filter(r => normalizeStatus(r.status) === 'completed');
    const pendingList = userScopeList.filter(r => normalizeStatus(r.status) === 'pending');

    const card1 = document.getElementById('kpiCard1');
    const card2 = document.getElementById('kpiCard2');
    const card3 = document.getElementById('kpiCard3');
    const card4 = document.getElementById('kpiCard4');

    if (!auth.isAdmin) {
      // Cliente común
      const upcoming = [...activeList].sort((a, b) => new Date(`${a.date}T12:00:00`) - new Date(`${b.date}T12:00:00`))[0];

      if (card1) {
        card1.querySelector('p').textContent = 'Próxima Cita';
        card1.querySelector('strong').textContent = upcoming ? formatReadableDate(upcoming.date) : 'Sin citas';
        card1.querySelector('.trend').innerHTML = upcoming
          ? `<i class="fa-solid fa-clock"></i> ${upcoming.time} • ${escapeHtml(upcoming.stylistName || 'Estilista')}`
          : '¡Agenda tu próxima cita!';
      }

      if (card2) {
        card2.querySelector('p').textContent = 'Citas Activas';
        card2.querySelector('strong').textContent = activeList.length;
        card2.querySelector('.trend').innerHTML = 'En agenda <small>pendientes / confirmadas</small>';
      }

      if (card3) {
        const icon = card3.querySelector('.stat-icon i');
        if (icon) icon.className = 'fa-solid fa-circle-check';
        card3.querySelector('p').textContent = 'Servicios Realizados';
        card3.querySelector('strong').textContent = completedList.length;
        card3.querySelector('.trend').innerHTML = 'Historial <small>experiencias BellaSalón</small>';
      }
    } else {
      // Administrador
      const totalIncome = completedList.reduce((acc, cur) => acc + (Number(cur.price) || 0), 0);

      if (card1) {
        card1.querySelector('p').textContent = 'Citas Activas';
        card1.querySelector('strong').textContent = activeList.length;
        card1.querySelector('.trend').innerHTML = 'En agenda <small>hoy y próximas</small>';
      }

      if (card2) {
        card2.querySelector('p').textContent = 'Servicios en Carta';
        card2.querySelector('strong').textContent = services.length;
        card2.querySelector('.trend').innerHTML = 'Catálogo <small>tratamientos activos</small>';
      }

      if (card3) {
        const icon = card3.querySelector('.stat-icon i');
        if (icon) icon.className = 'fa-solid fa-clock';
        card3.querySelector('p').textContent = 'Citas por Confirmar';
        card3.querySelector('strong').textContent = pendingList.length;
        card3.querySelector('.trend').innerHTML = 'Atención <small>pendientes de revisión</small>';
      }

      if (card4) {
        card4.querySelector('p').textContent = 'Facturado en Citas';
        card4.querySelector('strong').textContent = formatPrice(totalIncome);
        card4.querySelector('.trend').innerHTML = 'Ingresos <small>citas atendidas</small>';
      }
    }
  };

  // 5. RENDERIZADO DE PRÓXIMAS CITAS EN EL PANEL PRINCIPAL
  const renderOverviewAppointments = () => {
    const container = document.getElementById('overviewAppointmentsList');
    if (!container) return;

    const allReservations = getStoredReservations();
    const userScopeList = getUserScopeReservations(allReservations, auth.currentUser, auth.isAdmin);

    // Ordenar próximas citas activas
    const activeOrRecent = [...userScopeList].sort((a, b) => new Date(`${b.date}T12:00:00`) - new Date(`${a.date}T12:00:00`)).slice(0, 4);

    if (activeOrRecent.length === 0) {
      container.innerHTML = `
        <div class="activity-empty" style="text-align:center; padding:30px 10px;">
          <p style="font-size:14px; margin-bottom:12px; color:var(--text-muted);">Aún no tienes citas agendadas en BellaSalón Studio.</p>
          <button class="primary-action" type="button" id="overviewEmptyBookBtn" style="margin:0 auto; padding:8px 18px; font-size:13px;">
            <i class="fa-solid fa-calendar-plus"></i> Agendar mi primera cita
          </button>
        </div>
      `;
      document.getElementById('overviewEmptyBookBtn')?.addEventListener('click', () => {
        bookingHandler.openBookingModal();
      });
      return;
    }

    container.innerHTML = activeOrRecent.map(res => {
      const norm = normalizeStatus(res.status);
      const label = statusLabels[norm] || res.status;
      const initials = (res.stylistName || 'Estilista').split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

      return `
        <div class="activity-item">
          <div class="activity-avatar" title="${escapeHtml(res.stylistName || 'Estilista')}">
            ${escapeHtml(initials)}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <strong>${escapeHtml(res.serviceName)}</strong>
              <span class="status-badge ${norm}" style="font-size:10.5px; padding:2px 8px;">${escapeHtml(label)}</span>
            </div>
            <p>
              <i class="fa-solid fa-user-tie" style="color:var(--salon-rose); font-size:11px;"></i> ${escapeHtml(res.stylistName || 'Estilista')}
              ${auth.isAdmin && res.userName ? ` • <i class="fa-solid fa-user" style="font-size:11px;"></i> ${escapeHtml(res.userName)}` : ''}
              • <strong>${formatPrice(res.price || 0)}</strong>
            </p>
          </div>
          <time>
            <i class="fa-solid fa-calendar" style="color:var(--text-dim); font-size:11px;"></i> ${formatReadableDate(res.date)}<br>
            <i class="fa-solid fa-clock" style="color:var(--text-dim); font-size:11px;"></i> ${escapeHtml(res.time)}
          </time>
        </div>
      `;
    }).join('');
  };

  // 6. MODAL DE AGENDAR CITA EN EL DASHBOARD
  const bookingHandler = window.BellaSalon.setupBookingModal(auth, (newRes) => {
    renderDashboardKPIs();
    renderOverviewAppointments();
  });

  const quickNewBtn = document.getElementById('quickNewReservationBtn');
  if (quickNewBtn) {
    quickNewBtn.addEventListener('click', () => {
      bookingHandler.openBookingModal();
    });
  }

  // 7. INICIALIZACIÓN
  renderDashboardKPIs();
  renderOverviewAppointments();
})();
