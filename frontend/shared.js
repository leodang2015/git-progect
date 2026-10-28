/**
 * BellaSalón Studio & Spa - Módulo Compartido de Frontend
 * Centraliza sesión, seguridad por rol, persistencia, formateo y navegación.
 */

(function (window) {
  'use strict';

  // 1. CLAVES DE ALMACENAMIENTO LOCAL
  const SESSION_KEY = 'reservas_session';
  const SERVICES_KEY = 'reservas_services';
  const RESERVATIONS_KEY = 'reservas_list';
  const USERS_KEY = 'reservas_users';

  // 2. PROFESIONALES Y ESTILISTAS DEL SALÓN (Vida Real)
  const salonStylists = [
    { id: 'sty-1', name: 'Sofía Mendoza', specialty: 'Master Colorimetría & Mechas', serviceIds: ['service-3'], avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80', badge: 'Colorista Top' },
    { id: 'sty-2', name: 'Mateo Silva', specialty: 'Corte, Visagismo & Estilo', serviceIds: ['service-1'], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', badge: 'Estilista Senior' },
    { id: 'sty-3', name: 'Valentina Ruiz', specialty: 'Manicura Rusa & Pedicura Spa', serviceIds: ['service-4'], avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80', badge: 'Nail Artist' },
    { id: 'sty-4', name: 'Camila Gómez', specialty: 'Tratamientos Capilares & Brillo', serviceIds: ['service-2'], avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', badge: 'Terapeuta Capilar' }
  ];

  const getAvailableStylists = (serviceId) => {
    if (!serviceId) return [];
    const storedStylists = getStoredUsers()
      .filter(user => user.role === 'stylist' && user.status === 'active' && Array.isArray(user.serviceIds) && user.serviceIds.includes(serviceId))
      .map(user => ({
        id: user.id,
        name: user.name,
        specialty: user.specialty || 'Peluquero',
        avatar: '',
        badge: 'Peluquero'
      }));

    return [...salonStylists, ...storedStylists].filter(stylist => stylist.serviceIds
      ? stylist.serviceIds.includes(serviceId)
      : true);
  };

  // 3. CATÁLOGO BASE DE SERVICIOS
  const defaultServices = [
    {
      id: 'service-1',
      name: 'Corte de cabello y peinado',
      description: 'Asesoría de visagismo personalizada, lavado nutritivo con masaje capilar y peinado con acabado profesional.',
      price: 30000,
      duration: 45,
      category: 'Cabello & Peinado',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'service-2',
      name: 'Cepillado y blower',
      description: 'Lavado revitalizante capilar, aplicación de protector térmico y secado profesional para máximo brillo y soltura.',
      price: 25000,
      duration: 40,
      category: 'Peinados & Brillo',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'service-3',
      name: 'Tinte / Colorimetría',
      description: 'Diagnóstico de tono, aplicación de tinte premium sin amoniaco con cobertura total y tratamiento sellador de color.',
      price: 90000,
      duration: 90,
      category: 'Color & Brillo',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'service-4',
      name: 'Manicura y pedicura spa',
      description: 'Exfoliación con sales aromáticas, hidratación profunda con mascarilla, arreglo de cutículas y esmaltado impecable.',
      price: 35000,
      duration: 50,
      category: 'Uñas & Spa',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80'
    }
  ];

  // 4. CITAS DEMO INICIALES
  const defaultReservations = [
    {
      id: 'RES-2026-1001',
      serviceId: 'service-1',
      serviceName: 'Corte de cabello y peinado',
      stylistId: 'sty-2',
      stylistName: 'Mateo Silva',
      hairLength: 'Medio',
      userName: 'Camila Torres',
      userId: 'usr-demo',
      userEmail: 'usuario@ejemplo.com',
      date: '2026-10-22',
      time: '10:30 AM',
      price: 30000,
      notes: 'Corte en capas suaves con visagismo y peinado con ondas al agua',
      status: 'confirmed',
      createdAt: '2026-10-18T09:15:00.000Z'
    },
    {
      id: 'RES-2026-1002',
      serviceId: 'service-4',
      serviceName: 'Manicura y pedicura spa',
      stylistId: 'sty-3',
      stylistName: 'Valentina Ruiz',
      hairLength: 'No aplica',
      userName: 'Camila Torres',
      userId: 'usr-demo',
      userEmail: 'usuario@ejemplo.com',
      date: '2026-10-24',
      time: '02:00 PM',
      price: 35000,
      notes: 'Esmaltado en tono nude rosa con exfoliación frutal',
      status: 'pending',
      createdAt: '2026-10-19T14:30:00.000Z'
    },
    {
      id: 'RES-2026-1003',
      serviceId: 'service-2',
      serviceName: 'Cepillado y blower',
      stylistId: 'sty-4',
      stylistName: 'Camila Gómez',
      hairLength: 'Largo',
      userName: 'Camila Torres',
      userId: 'usr-demo',
      userEmail: 'usuario@ejemplo.com',
      date: '2026-10-14',
      time: '11:00 AM',
      price: 25000,
      notes: 'Atención completada a entera satisfacción',
      status: 'completed',
      createdAt: '2026-10-14T08:00:00.000Z'
    },
    {
      id: 'RES-2026-1004',
      serviceId: 'service-3',
      serviceName: 'Tinte / Colorimetría',
      stylistId: 'sty-1',
      stylistName: 'Sofía Mendoza',
      hairLength: 'Medio',
      userName: 'Diego Ramírez',
      userId: 'usr-diego',
      userEmail: 'diego@ejemplo.com',
      date: '2026-10-25',
      time: '09:00 AM',
      price: 90000,
      notes: 'Retoque de raíz castaño claro dorado',
      status: 'confirmed',
      createdAt: '2026-10-19T11:45:00.000Z'
    }
  ];

  // 5. MÉTODOS DE DATOS Y PERSISTENCIA
  const getStoredServices = () => {
    try {
      const data = JSON.parse(localStorage.getItem(SERVICES_KEY) || 'null');
      if (Array.isArray(data) && data.length > 0 && !data.some(s => s.name && (s.name.includes('Sala') || s.name.includes('Catering')))) {
        return data;
      }
      localStorage.setItem(SERVICES_KEY, JSON.stringify(defaultServices));
      return defaultServices;
    } catch {
      return defaultServices;
    }
  };

  const saveStoredServices = (services) => {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  };

  const getStoredReservations = () => {
    try {
      const data = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || 'null');
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(r => {
          if (!r.stylistName) {
            const availableStylists = getAvailableStylists(r.serviceId);
            const randomSty = availableStylists[Math.floor(Math.random() * availableStylists.length)];
            if (randomSty) {
              r.stylistId = randomSty.id;
              r.stylistName = randomSty.name;
            }
          }
          if (!r.hairLength) r.hairLength = 'Medio';
        });
        return data;
      }
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(defaultReservations));
      return defaultReservations;
    } catch {
      return defaultReservations;
    }
  };

  const saveStoredReservations = (reservations) => {
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
  };

  const getStoredUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const saveStoredUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  // 6. GESTIÓN DE SESIÓN
  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  };

  const validateSession = (options = {}) => {
    const session = getSession();
    const hasValidSession = session && typeof session.token === 'string' && session.token && Number(session.expiresAt) > Date.now() && session.user;

    if (!hasValidSession) {
      localStorage.removeItem(SESSION_KEY);
      window.location.replace('index.html');
      return null;
    }

    const currentUser = session.user || {};
    let resolvedName = currentUser.name;

    if (!resolvedName || resolvedName.toLowerCase() === 'usuario' || resolvedName.toLowerCase() === 'cliente') {
      try {
        const storedUsers = getStoredUsers();
        const match = storedUsers.find(u => u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase());
        if (match && match.name) {
          resolvedName = match.name;
          currentUser.name = match.name;
          if (match.role) currentUser.role = match.role;
          session.user = currentUser;
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
      } catch {}
    }

    if (!resolvedName && currentUser.email) {
      const prefix = currentUser.email.split('@')[0];
      resolvedName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    const userName = String(resolvedName || 'Cliente').trim();
    const userRole = String(currentUser.role || 'user');
    const isAdmin = ['admin', 'administrador'].includes(userRole.toLowerCase());
    const initials = userName.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'U';

    // Protección de rutas exclusivas de Administrador
    if (options.requireAdmin && !isAdmin) {
      alert('Acceso restringido: Esta sección requiere privilegios de administrador.');
      window.location.replace('dashboard.html');
      return null;
    }

    return {
      session,
      currentUser,
      userName,
      userRole,
      isAdmin,
      initials
    };
  };

  // 7. HELPERS DE FORMATEO
  const escapeHtml = (val) => String(val ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));

  const formatPrice = (val) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val || 0);

  const formatDate = (val) => new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(val));

  const formatReadableDate = (dateStr) => {
    if (!dateStr) return '—';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? dateStr : formatDate(d);
  };

  const statusLabels = {
    confirmed: 'Confirmada',
    pending: 'Pendiente',
    completed: 'Finalizada',
    cancelled: 'Cancelada',
    rejected: 'Rechazada'
  };

  const normalizeStatus = (status) => {
    const s = String(status ?? '').toLowerCase().trim();
    if (!s) return '';
    if (s === 'confirmada' || s === 'confirmed') return 'confirmed';
    if (s === 'pendiente' || s === 'pending') return 'pending';
    if (s === 'finalizada' || s === 'completed') return 'completed';
    if (s === 'cancelada' || s === 'cancelled') return 'cancelled';
    if (s === 'rechazada' || s === 'rejected') return 'rejected';
    return s;
  };

  const getUserScopeReservations = (allReservations, currentUser, isAdmin) => {
    const userName = (currentUser.name || '').toLowerCase();
    const userEmail = (currentUser.email || '').toLowerCase();
    const userId = currentUser.id ? String(currentUser.id) : '';
    const isDemoUser = (userEmail === 'usuario@ejemplo.com') || (userId === 'usr-demo') || (userName === 'usuario demo');

    return allReservations.filter(res => {
      if (isAdmin) return true;
      if (res.userId && userId && String(res.userId) === userId) return true;
      if (res.userEmail && userEmail && res.userEmail.toLowerCase() === userEmail) return true;
      if (res.userName && userName && res.userName.toLowerCase() === userName) return true;
      if (isDemoUser && (res.userId === 'usr-demo' || res.userEmail === 'usuario@ejemplo.com')) return true;
      return false;
    });
  };

  const generateWhatsAppUrl = (res) => {
    const phone = '573001234567';
    const text = encodeURIComponent(
      `Hola BellaSalón Studio & Spa ✨ Quiero consultar sobre mi cita #${res.id} para el tratamiento de *${res.serviceName}* agendada el *${formatReadableDate(res.date)}* a las *${res.time}* con *${res.stylistName || 'Estilista'}*. ¡Muchas gracias!`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  // 8. CONFIGURACIÓN DEL LAYOUT Y NAVEGACIÓN COMÚN
  const setupSharedLayout = (auth, activeNavId) => {
    // Info de usuario en el header
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = auth.userName;

    const userRoleEl = document.getElementById('userRole');
    if (userRoleEl) {
      userRoleEl.textContent = auth.isAdmin
        ? 'Administrador'
        : auth.currentUser.role === 'stylist' ? 'Peluquero' : 'Cliente';
    }

    const userInitialsEl = document.getElementById('userInitials');
    if (userInitialsEl) userInitialsEl.textContent = auth.initials;

    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
      currentDateEl.textContent = new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
    }

    // Control de opciones exclusivas de administrador para prevenir parpadeo (FOUC)
    if (auth.isAdmin) {
      document.documentElement.classList.add('is-admin');
      document.body.classList.add('is-admin');
      document.querySelectorAll('.admin-only').forEach(el => {
        el.removeAttribute('aria-hidden');
      });
    } else {
      document.documentElement.classList.remove('is-admin');
      document.body.classList.remove('is-admin');
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      });
    }

    // Marcar enlace activo en el menú lateral
    if (activeNavId) {
      document.querySelectorAll('.dashboard-nav-link').forEach(link => {
        link.classList.remove('active');
      });
      const activeLink = document.getElementById(activeNavId);
      if (activeLink) activeLink.classList.add('active');
    }

    // Toggle de Menú Móvil con cierre al hacer click fuera o presionar Escape
    const sidebar = document.getElementById('dashboardSidebar');
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = sidebar.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
      });

      document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
          sidebar.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Botón de Cerrar Sesión
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.replace('index.html');
      });
    }

    // Expiración periódica de sesión
    window.setInterval(() => {
      const currentSession = getSession();
      if (!currentSession || Number(currentSession.expiresAt) <= Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        window.location.replace('index.html');
      }
    }, 30000);
  };

  // 9. CONFIGURACIÓN MODAL DE RESERVA (HUS-06) REUTILIZABLE
  const setupBookingModal = (auth, onReservationSuccess) => {
    const modal = document.getElementById('reservationModal');
    const form = document.getElementById('reservationForm');
    const formError = document.getElementById('reservationFormError');
    const serviceSelect = document.getElementById('reservationService');
    const stylistSelect = document.getElementById('reservationStylist');
    const hairLengthSelect = document.getElementById('reservationHairLength');
    const dateInput = document.getElementById('reservationDate');
    const timeSelect = document.getElementById('reservationTime');
    const notesInput = document.getElementById('reservationNotes');
    const summaryService = document.getElementById('summaryService');
    const summaryDate = document.getElementById('summaryDate');
    const summaryTime = document.getElementById('summaryTime');
    const summaryPrice = document.getElementById('summaryPrice');
    const closeBtn = document.getElementById('closeReservationModal');
    const cancelBtn = document.getElementById('cancelReservationButton');

    // Modal de Éxito
    const successModal = document.getElementById('reservationSuccessModal');
    const ticketCode = document.getElementById('ticketCode');
    const ticketService = document.getElementById('ticketService');
    const ticketStylist = document.getElementById('ticketStylist');
    const ticketDate = document.getElementById('ticketDate');
    const ticketTime = document.getElementById('ticketTime');
    const ticketPrice = document.getElementById('ticketPrice');
    const ticketStatus = document.getElementById('ticketStatus');
    const waShareBtn = document.getElementById('whatsappShareBtn');
    const closeSuccessBtn = document.getElementById('closeSuccessModalButton');

    if (!modal || !form) return { openBookingModal: () => {} };

    // Poblar servicios disponibles
    const services = getStoredServices().filter(s => s.status === 'available' || s.isActive !== false);
    if (serviceSelect) {
      serviceSelect.innerHTML = '<option value="" disabled selected>Seleccione un servicio ▼</option>' +
        services.map(s => `<option value="${escapeHtml(s.id)}" data-price="${s.price || 0}" data-duration="${s.duration || 45}">${escapeHtml(s.name)} — ${formatPrice(s.price)} (${s.duration || 45} min)</option>`).join('');
    }

    const populateStylists = (selectedId = 'sty-any') => {
      if (!stylistSelect) return;
      const availableStylists = getAvailableStylists(serviceSelect?.value);
      if (!availableStylists.length) {
        stylistSelect.innerHTML = '<option value="" selected disabled>No hay profesionales para este servicio</option>';
        return;
      }

      stylistSelect.innerHTML = '<option value="sty-any">Primer profesional disponible</option>' +
        availableStylists.map(sty =>
          `<option value="${escapeHtml(sty.id)}">${escapeHtml(sty.name)} — ${escapeHtml(sty.specialty)}</option>`
        ).join('');
      stylistSelect.value = availableStylists.some(sty => sty.id === selectedId) ? selectedId : 'sty-any';
    };

    populateStylists();

    // Fecha mínima = hoy
    if (dateInput) {
      const todayISO = new Date().toISOString().split('T')[0];
      dateInput.min = todayISO;
    }

    // Flujo visual de pasos
    const flowStep1 = document.getElementById('flowStep1');
    const flowStep2 = document.getElementById('flowStep2');
    const flowStep3 = document.getElementById('flowStep3');
    const flowStep4 = document.getElementById('flowStep4');

    const updateFlowSteps = () => {
      const hasSrv = Boolean(serviceSelect?.value);
      const hasDate = Boolean(dateInput?.value);
      const hasTime = Boolean(timeSelect?.value);

      if (flowStep1) flowStep1.className = `flow-step ${hasSrv ? 'completed' : 'active'}`;
      if (flowStep2) flowStep2.className = `flow-step ${hasSrv ? (hasDate ? 'completed' : 'active') : ''}`;
      if (flowStep3) flowStep3.className = `flow-step ${hasSrv && hasDate ? (hasTime ? 'completed' : 'active') : ''}`;
      if (flowStep4) flowStep4.className = `flow-step ${hasSrv && hasDate && hasTime ? 'active' : ''}`;
    };

    const updateSummary = () => {
      const selectedOption = serviceSelect?.options[serviceSelect.selectedIndex];
      const selectedService = services.find(s => s.id === serviceSelect?.value);
      const price = selectedService ? selectedService.price : (selectedOption ? Number(selectedOption.dataset.price || 0) : 0);

      if (summaryService) summaryService.textContent = selectedService ? selectedService.name : '—';
      if (summaryDate) summaryDate.textContent = formatReadableDate(dateInput?.value);
      if (summaryTime) summaryTime.textContent = timeSelect?.value || '—';
      if (summaryPrice) summaryPrice.textContent = formatPrice(price);
      updateFlowSteps();
    };

    serviceSelect?.addEventListener('change', () => {
      populateStylists();
      updateSummary();
    });
    stylistSelect?.addEventListener('change', updateSummary);
    dateInput?.addEventListener('change', updateSummary);
    timeSelect?.addEventListener('change', updateSummary);

    const openBookingModal = (preselectedServiceId = null) => {
      form.reset();
      if (formError) formError.textContent = '';

      if (preselectedServiceId && serviceSelect) {
        serviceSelect.value = preselectedServiceId;
      }
      populateStylists();

      // No pre-seleccionar fecha automáticamente para respetar el orden de selección
      if (dateInput) {
        dateInput.value = '';
      }

      updateSummary();
      modal.hidden = false;
      if (serviceSelect && !serviceSelect.value) {
        serviceSelect.focus();
      } else if (timeSelect) {
        timeSelect.focus();
      }
    };

    const closeBookingModal = () => {
      modal.hidden = true;
      form.reset();
      if (formError) formError.textContent = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeBookingModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeBookingModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeBookingModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeBookingModal();
    });

    // Envío del Formulario
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (formError) formError.textContent = '';

      const serviceId = serviceSelect?.value;
      const stylistId = stylistSelect?.value || 'sty-any';
      const hairLength = hairLengthSelect?.value || 'Medio';
      const dateVal = dateInput?.value;
      const timeVal = timeSelect?.value;
      const notesVal = (notesInput?.value || '').trim();

      if (!serviceId) {
        if (formError) formError.textContent = 'Por favor selecciona el servicio de belleza que deseas recibir.';
        serviceSelect?.focus();
        return;
      }

      if (!dateVal) {
        if (formError) formError.textContent = 'Por favor selecciona la fecha para tu cita.';
        dateInput?.focus();
        return;
      }

      if (!timeVal) {
        if (formError) formError.textContent = 'Por favor selecciona el horario de atención.';
        timeSelect?.focus();
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      if (dateVal < todayStr) {
        if (formError) formError.textContent = 'La fecha de atención no puede ser en el pasado.';
        return;
      }

      const allReservations = getStoredReservations();
      const availableStylists = getAvailableStylists(serviceId);
      if (!availableStylists.length) {
        if (formError) formError.textContent = 'No hay profesionales asignados a este servicio. Contacta al salón para agendar.';
        return;
      }

      const stylistObj = stylistId === 'sty-any'
        ? availableStylists.find(stylist => !allReservations.some(reservation =>
          reservation.stylistId === stylist.id &&
          reservation.date === dateVal &&
          reservation.time === timeVal &&
          ['confirmed', 'pending'].includes(normalizeStatus(reservation.status))
        ))
        : availableStylists.find(stylist => stylist.id === stylistId);
      if (!stylistObj) {
        if (formError) formError.textContent = 'No hay profesionales disponibles para ese horario. Elige otra hora.';
        return;
      }

      // Validación de conflictos de agenda para el profesional
      if (stylistId !== 'sty-any') {
        const conflict = allReservations.find(r =>
          r.stylistId === stylistId &&
          r.date === dateVal &&
          r.time === timeVal &&
          ['confirmed', 'pending'].includes(normalizeStatus(r.status))
        );
        if (conflict) {
          if (formError) formError.textContent = `${stylistObj.name} ya tiene una cita reservada a las ${timeVal} el día ${formatReadableDate(dateVal)}. Por favor elige otro horario o selecciona "Primer profesional disponible".`;
          return;
        }
      }

      const selectedService = services.find(s => s.id === serviceId) || { name: 'Servicio de Belleza', price: 0 };
      const uniqueNum = Math.floor(1000 + Math.random() * 9000);
      const newReservationId = `RES-${new Date().getFullYear()}-${uniqueNum}`;

      const newReservation = {
        id: newReservationId,
        serviceId,
        serviceName: selectedService.name,
        stylistId: stylistObj.id,
        stylistName: stylistObj.name,
        hairLength,
        userName: auth.userName,
        userEmail: auth.currentUser.email || '',
        userId: auth.currentUser.id || 'usr-client',
        date: dateVal,
        time: timeVal,
        price: selectedService.price || 0,
        notes: notesVal || 'Sin especificaciones',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      allReservations.unshift(newReservation);
      saveStoredReservations(allReservations);
      closeBookingModal();

      // Abrir modal de ticket exitoso
      if (successModal) {
        if (ticketCode) ticketCode.textContent = `#${newReservation.id}`;
        if (ticketService) ticketService.textContent = newReservation.serviceName;
        if (ticketStylist) ticketStylist.textContent = newReservation.stylistName;
        if (ticketDate) ticketDate.textContent = formatReadableDate(newReservation.date);
        if (ticketTime) ticketTime.textContent = newReservation.time;
        if (ticketPrice) ticketPrice.textContent = formatPrice(newReservation.price);
        if (ticketStatus) {
          ticketStatus.textContent = 'Pendiente por confirmar';
          ticketStatus.className = 'status-badge pending';
        }
        if (waShareBtn) {
          waShareBtn.href = generateWhatsAppUrl(newReservation);
        }
        successModal.hidden = false;
      }

      if (typeof onReservationSuccess === 'function') {
        onReservationSuccess(newReservation);
      }
    });

    if (successModal) {
      if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
          successModal.hidden = true;
        });
      }

      successModal.addEventListener('click', (e) => {
        if (e.target === successModal) successModal.hidden = true;
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !successModal.hidden) successModal.hidden = true;
      });
    }

    return {
      openBookingModal,
      closeBookingModal
    };
  };

  // Exponer API Pública en window.BellaSalon
  window.BellaSalon = {
    SESSION_KEY,
    SERVICES_KEY,
    RESERVATIONS_KEY,
    USERS_KEY,
    salonStylists,
    getAvailableStylists,
    defaultServices,
    defaultReservations,
    getStoredServices,
    saveStoredServices,
    getStoredReservations,
    saveStoredReservations,
    getStoredUsers,
    saveStoredUsers,
    getSession,
    validateSession,
    escapeHtml,
    formatPrice,
    formatDate,
    formatReadableDate,
    statusLabels,
    normalizeStatus,
    getUserScopeReservations,
    generateWhatsAppUrl,
    setupSharedLayout,
    setupBookingModal
  };

})(window);
