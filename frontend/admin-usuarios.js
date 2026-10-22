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
    title: document.getElementById('userModalTitle'),
    newBtn: document.getElementById('newUserButton'),
    closeBtn: document.getElementById('closeUserModal'),
    cancelBtn: document.getElementById('cancelUserButton')
  };

  // Inicializar usuarios si está vacío
  let storedUsers = getStoredUsers();
  if (!storedUsers.length) {
    storedUsers.push(
      {
        id: 'usr-admin',
        name: auth.userName || 'Administrador',
        email: auth.currentUser.email || 'admin@example.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr-demo',
        name: 'Camila Torres',
        email: 'usuario@ejemplo.com',
        role: 'user',
        status: 'active',
        createdAt: '2026-10-10T12:00:00.000Z'
      }
    );
    saveStoredUsers(storedUsers);
  }

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

  // 5. MODAL NUEVO / EDITAR USUARIO
  if (elements.newBtn) {
    elements.newBtn.addEventListener('click', () => {
      elements.form.reset();
      elements.id.value = '';
      elements.title.textContent = 'Nuevo Cliente / Usuario';
      elements.password.required = true;
      elements.password.placeholder = 'Mínimo 6 caracteres';
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

  // Acciones en la tabla
  elements.body?.addEventListener('click', (e) => {
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
        elements.password.required = false;
        elements.password.placeholder = 'Dejar en blanco para mantener actual';
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
        users = users.filter(u => u.id !== delId);
        saveStoredUsers(users);
        loadUsers();
      }
    }
  });

  // Guardar (Crear o Actualizar)
  elements.form?.addEventListener('submit', (e) => {
    e.preventDefault();
    elements.formError.textContent = '';

    const nameVal = elements.name.value.trim();
    const emailVal = elements.email.value.trim().toLowerCase();
    const roleVal = elements.userRole.value;
    const statusVal = elements.userStatus.value;
    const passVal = elements.password.value;

    if (!nameVal || !emailVal) {
      elements.formError.textContent = 'El nombre y correo electrónico son requeridos.';
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
      status: statusVal
    };

    if (passVal) {
      if (passVal.length < 6) {
        elements.formError.textContent = 'La contraseña debe tener mínimo 6 caracteres.';
        return;
      }
      payload.password = passVal;
    }

    if (uid) {
      const target = users.find(u => u.id === uid);
      if (target) Object.assign(target, payload);
    } else {
      users.push({
        ...payload,
        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString()
      });
    }

    saveStoredUsers(users);
    closeModal();
    loadUsers();
  });

  // Filtros
  elements.search?.addEventListener('input', loadUsers);
  elements.role?.addEventListener('change', loadUsers);
  elements.status?.addEventListener('change', loadUsers);

  // Tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.modal.hidden) {
      closeModal();
    }
  });

  // 6. INICIALIZACIÓN
  loadUsers();
})();
