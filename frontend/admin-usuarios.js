/**
 * BellaSalón Studio & Spa - Módulo Administrativo de Gestión de Clientes y Personal
 * Exclusivo para administradores: Crear, listar, editar y eliminar cuentas de usuarios.
 */

(function () {
  'use strict';

  // 1. VALIDACIÓN DE SESIÓN (Requiere rol de Administrador)
  const auth = window.BellaSalon.validateSession({ requireAdmin: true });
  if (!auth) return;

  // 2. CONFIGURACIÓN DEL LAYOUT (Sidebar activo: navAdminUsuarios)
  window.BellaSalon.setupSharedLayout(auth, 'navAdminUsuarios');

  const {
    getStoredUsers,
    saveStoredUsers,
    getStoredServices,
    escapeHtml,
    formatDate
  } = window.BellaSalon;

  // 3. ELEMENTOS DEL DOM
  const elements = {
    body: document.getElementById('usersTableBody'),
    search: document.getElementById('userSearch'),
    role: document.getElementById('roleFilter'),
    status: document.getElementById('statusFilter'),
    feedback: document.getElementById('userFeedback'),
    empty: document.getElementById('emptyUsers'),
    modal: document.getElementById('userModal'),
    form: document.getElementById('userForm'),
    formError: document.getElementById('userFormError'),
    id: document.getElementById('userId'),
    name: document.getElementById('userNameInput'),
    email: document.getElementById('userEmailInput'),
    password: document.getElementById('userPasswordInput'),
    userRole: document.getElementById('userRoleInput'),
    userStatus: document.getElementById('userStatusInput'),
    stylistFields: document.getElementById('stylistFields'),
    specialty: document.getElementById('userSpecialtyInput'),
    stylistServices: document.getElementById('stylistServicesInput'),
    saveButton: document.querySelector('#userForm button[type="submit"]'),
    title: document.getElementById('userModalTitle'),
    newBtn: document.getElementById('newUserButton'),
    closeBtn: document.getElementById('closeUserModal'),
    cancelBtn: document.getElementById('cancelUserButton')
  };

  const apiHeaders = {
    Authorization: `Bearer ${auth.session.token}`,
    'Content-Type': 'application/json'
  };
  let mongoServices = [];
  let isLoading = false;

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: { ...apiHeaders, ...options.headers }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || result.errores?.[0]?.mensaje || 'No se pudo completar la operación en MongoDB.');
    }
    return result;
  };

  const toFrontendUser = (user) => {
    const mongoServiceIds = (user.serviceIds || []).map(service => String(service._id || service));
    const serviceNames = mongoServices
      .filter(service => mongoServiceIds.includes(String(service.id)))
      .map(service => service.name);
    const localServiceIds = getStoredServices()
      .filter(service => serviceNames.includes(service.name))
      .map(service => service.id);

    return {
      ...user,
      id: String(user.id || user._id),
      mongoServiceIds,
      serviceIds: user.role === 'stylist' ? localServiceIds : []
    };
  };

  const getMongoServiceIds = (localServiceIds) => {
    return localServiceIds.map(String);
  };

  // 4. RENDERIZAR TABLA DE USUARIOS
  const loadUsers = () => {
    if (!elements.body) return;
    const q = (elements.search?.value || '').trim().toLowerCase();
    const r = elements.role?.value;
    const s = elements.status?.value;
    const users = getStoredUsers();

    const filtered = users.filter(u =>
      (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)) &&
      (!r || u.role === r) &&
      (!s || u.status === s)
    );

    elements.body.innerHTML = filtered.map(u => {
      const isUserActive = u.status === 'active' || u.isActive !== false;
      const roleBadge = u.role === 'admin'
        ? '<span style="color:var(--salon-rose); font-weight:700;"><i class="fa-solid fa-crown"></i> Administrador</span>'
        : u.role === 'stylist'
          ? `<span><i class="fa-solid fa-scissors"></i> Peluquero<small style="display:block; color:var(--text-muted);">${escapeHtml(u.specialty || 'Sin oficio indicado')}</small><small style="display:block; color:var(--text-muted);">Zonas: ${escapeHtml((u.workAreas || []).join(', ') || 'Sin registrar')}</small></span>`
          : '<span><i class="fa-solid fa-user"></i> Cliente</span>';

      return `
        <tr>
          <td><strong>${escapeHtml(u.name)}</strong></td>
          <td>${escapeHtml(u.email)}</td>
          <td>${roleBadge}</td>
          <td><span class="status-badge ${isUserActive ? 'active' : 'inactive'}">${isUserActive ? 'Activo' : 'Inactivo'}</span></td>
          <td>${formatDate(u.createdAt || new Date())}</td>
          <td>
            <div class="row-actions">
              <button class="row-action" data-edit-user="${escapeHtml(u.id)}" type="button">
                <i class="fa-solid fa-pen-to-square"></i> Editar
              </button>
              <button class="row-action danger" data-delete-user="${escapeHtml(u.id)}" type="button">
                <i class="fa-solid fa-trash"></i> Eliminar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (elements.empty) elements.empty.hidden = filtered.length > 0;
    if (elements.feedback) elements.feedback.textContent = `${filtered.length} cuenta(s) encontrada(s)`;
  };

  const refreshUsers = async () => {
    if (isLoading) return;
    isLoading = true;
    if (elements.feedback) elements.feedback.textContent = 'Conectando con MongoDB...';

    try {
      const [serviceResponse, userResponse] = await Promise.all([
        apiRequest('/api/services?limit=100&isActive=true'),
        apiRequest('/api/users?limit=100')
      ]);
      mongoServices = serviceResponse.data.map(service => ({ ...service, id: String(service.id || service._id) }));
      const users = userResponse.data.map(toFrontendUser);
      saveStoredUsers(users);
      loadUsers();
    } catch (error) {
      console.error('Error al sincronizar usuarios con MongoDB:', error);
      if (elements.feedback) {
        elements.feedback.textContent = `No se pudieron cargar o guardar los usuarios en MongoDB: ${error.message}`;
        elements.feedback.style.color = 'var(--error-color)';
      }
      loadUsers();
    } finally {
      isLoading = false;
    }
  };

  const renderStylistServices = (selectedIds = []) => {
    elements.stylistServices.innerHTML = mongoServices.length
      ? mongoServices.map(service => `
        <label class="stylist-service-option">
          <input type="checkbox" name="stylistService" value="${escapeHtml(service.id)}" ${selectedIds.includes(String(service.id)) ? 'checked' : ''}>
          <span>${escapeHtml(service.name)}${service.category ? ` <small>(${escapeHtml(service.category)})</small>` : ''}</span>
        </label>
      `).join('')
      : '<p>Conecta con MongoDB para cargar los servicios disponibles.</p>';
  };

  const updateStylistFields = (selectedIds = []) => {
    const isStylist = elements.userRole.value === 'stylist';
    elements.stylistFields.hidden = !isStylist;
    elements.specialty.required = isStylist;
    elements.stylistServices.querySelectorAll('input[name="stylistService"]').forEach(input => {
      input.checked = selectedIds.includes(input.value);
    });
  };

  // 5. MODAL NUEVO / EDITAR USUARIO
  if (elements.newBtn) {
    elements.newBtn.addEventListener('click', () => {
      elements.form.reset();
      elements.id.value = '';
      renderStylistServices();
      updateStylistFields();
      elements.title.textContent = 'Nuevo Cliente / Usuario';
      elements.password.required = true;
      elements.password.placeholder = 'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo';
      elements.formError.textContent = '';
      elements.modal.hidden = false;
      elements.name.focus();
    });
  }

  const closeModal = () => {
    elements.modal.hidden = true;
    elements.form.reset();
    elements.formError.textContent = '';
  };

  if (elements.closeBtn) elements.closeBtn.addEventListener('click', closeModal);
  if (elements.cancelBtn) elements.cancelBtn.addEventListener('click', closeModal);
  elements.modal?.addEventListener('click', (e) => {
    if (e.target === elements.modal) closeModal();
  });

  // Acciones en la tabla
  elements.body?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit-user]');
    const delBtn = e.target.closest('[data-delete-user]');
    let users = getStoredUsers();

    if (editBtn) {
      const editId = editBtn.dataset.editUser;
      const u = users.find(item => item.id === editId);
      if (u) {
        elements.form.reset();
        elements.id.value = u.id;
        elements.title.textContent = 'Editar Cliente / Usuario';
        elements.name.value = u.name;
        elements.email.value = u.email;
        elements.userRole.value = u.role || 'user';
        elements.userStatus.value = u.status || 'active';
        elements.specialty.value = u.specialty || '';
        renderStylistServices(u.mongoServiceIds || []);
        updateStylistFields(u.mongoServiceIds || []);
        elements.password.required = false;
        elements.password.placeholder = 'En blanco para conservar la contraseña actual';
        elements.formError.textContent = '';
        elements.modal.hidden = false;
      }
      return;
    }

    if (delBtn) {
      const delId = delBtn.dataset.deleteUser;
      if (delId === auth.currentUser.id || delId === 'usr-admin') {
        alert('No es posible eliminar la cuenta del administrador en sesión actual.');
        return;
      }
      if (window.confirm('¿Seguro que deseas eliminar esta cuenta? Esta acción no se puede revertir.')) {
        try {
          await apiRequest(`/api/users/${encodeURIComponent(delId)}`, { method: 'DELETE' });
          users = users.filter(u => u.id !== delId);
          saveStoredUsers(users);
          loadUsers();
          if (elements.feedback) {
            elements.feedback.textContent = 'Usuario eliminado de MongoDB.';
            elements.feedback.style.color = 'var(--success-color)';
          }
        } catch (error) {
          if (elements.feedback) {
            elements.feedback.textContent = `No se pudo eliminar el usuario de MongoDB: ${error.message}`;
            elements.feedback.style.color = 'var(--error-color)';
          }
        }
      }
    }
  });

  // Guardar (Crear o Actualizar)
  elements.form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.formError.textContent = '';
    if (isLoading) return;

    const nameVal = elements.name.value.trim();
    const emailVal = elements.email.value.trim().toLowerCase();
    const roleVal = elements.userRole.value;
    const statusVal = elements.userStatus.value;
    const passVal = elements.password.value;
    const specialtyVal = elements.specialty.value.trim();
    const serviceIds = [...elements.stylistServices.querySelectorAll('input[name="stylistService"]:checked')]
      .map(input => input.value);

    if (!nameVal || !emailVal) {
      elements.formError.textContent = 'El nombre y correo electrónico son requeridos.';
      return;
    }
    if (roleVal === 'stylist' && !specialtyVal) {
      elements.formError.textContent = 'Indica el oficio o especialidad del peluquero.';
      elements.specialty.focus();
      return;
    }
    if (roleVal === 'stylist' && serviceIds.length === 0) {
      elements.formError.textContent = 'Selecciona al menos un servicio que pueda realizar el peluquero.';
      return;
    }

    let users = getStoredUsers();
    const uid = elements.id.value;

    // Verificar si el correo ya está registrado en otra cuenta
    const existing = users.find(u => u.email && u.email.toLowerCase() === emailVal && u.id !== uid);
    if (existing) {
      elements.formError.textContent = 'Ya existe otra cuenta registrada con este correo electrónico.';
      return;
    }

    const payload = {
      name: nameVal,
      email: emailVal,
      role: roleVal,
      status: statusVal,
      specialty: roleVal === 'stylist' ? specialtyVal : '',
      serviceIds: roleVal === 'stylist' ? serviceIds : []
    };

    if (passVal) {
      if (passVal.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/.test(passVal)) {
        elements.formError.textContent = 'La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo.';
        return;
      }
      payload.password = passVal;
    }

    if (!uid && !payload.password) {
      elements.formError.textContent = 'La contraseña es obligatoria para crear una cuenta.';
      elements.password.focus();
      return;
    }

    isLoading = true;
    elements.saveButton.disabled = true;
    elements.saveButton.textContent = 'Guardando en MongoDB...';
    try {
      const mongoPayload = {
        ...payload,
        serviceIds: payload.role === 'stylist' ? getMongoServiceIds(serviceIds) : []
      };
      const result = await apiRequest(uid ? `/api/users/${encodeURIComponent(uid)}` : '/api/users', {
        method: uid ? 'PUT' : 'POST',
        body: JSON.stringify(mongoPayload)
      });
      const savedUser = toFrontendUser(result.data);
      const updatedUsers = getStoredUsers();
      const savedIndex = updatedUsers.findIndex(user => user.id === savedUser.id);
      if (savedIndex >= 0) updatedUsers[savedIndex] = savedUser;
      else updatedUsers.push(savedUser);
      saveStoredUsers(updatedUsers);
      closeModal();
      loadUsers();
      if (elements.feedback) {
        elements.feedback.textContent = 'Usuario guardado correctamente en MongoDB.';
        elements.feedback.style.color = 'var(--success-color)';
      }
    } catch (error) {
      elements.formError.textContent = error.message;
    } finally {
      isLoading = false;
      elements.saveButton.disabled = false;
      elements.saveButton.textContent = 'Guardar cliente';
    }
  });

  // Filtros
  elements.search?.addEventListener('input', loadUsers);
  elements.role?.addEventListener('change', loadUsers);
  elements.status?.addEventListener('change', loadUsers);
  elements.userRole?.addEventListener('change', () => updateStylistFields());

  // Tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.modal.hidden) {
      closeModal();
    }
  });

  // 6. INICIALIZACIÓN
  refreshUsers();
})();
