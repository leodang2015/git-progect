(function () {
  'use strict';

  const auth = window.BellaSalon.validateSession();
  if (!auth) return;
  if (auth.currentUser.role !== 'stylist') {
    window.location.replace('dashboard.html');
    return;
  }

  window.BellaSalon.setupSharedLayout(auth, 'navStylistProfile');

  const form = document.getElementById('workAreasForm');
  const input = document.getElementById('workAreasInput');
  const count = document.getElementById('workAreasCount');
  const feedback = document.getElementById('workAreasFeedback');
  const saveButton = document.getElementById('saveWorkAreasButton');

  const getAreas = () => input.value.split(/\r?\n/).map(area => area.trim()).filter(Boolean);

  const updateCount = () => {
    count.textContent = `${getAreas().length} de 20 zonas`;
  };

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${auth.session.token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'No se pudo completar la operación.');
    return result.data;
  };

  const loadProfile = async () => {
    try {
      const profile = await apiRequest('/api/users/me');
      document.getElementById('stylistName').textContent = profile.name;
      document.getElementById('stylistSpecialty').textContent = profile.specialty || '';
      input.value = (profile.workAreas || []).join('\n');
      updateCount();
    } catch (error) {
      feedback.textContent = error.message;
      feedback.className = 'stylist-profile-feedback error';
    }
  };

  input.addEventListener('input', updateCount);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    feedback.textContent = '';
    feedback.className = 'stylist-profile-feedback';

    const workAreas = [...new Map(getAreas().map(area => [area.toLocaleLowerCase(), area])).values()];
    if (!workAreas.length) {
      feedback.textContent = 'Agrega al menos una zona de trabajo para aparecer en las reservas.';
      feedback.classList.add('error');
      return;
    }
    if (workAreas.length > 20 || workAreas.some(area => area.length > 80)) {
      feedback.textContent = 'Registra hasta 20 zonas y limita cada nombre a 80 caracteres.';
      feedback.classList.add('error');
      return;
    }

    saveButton.disabled = true;
    try {
      const profile = await apiRequest('/api/users/me/work-areas', {
        method: 'PUT',
        body: JSON.stringify({ workAreas })
      });
      input.value = (profile.workAreas || []).join('\n');
      updateCount();
      feedback.textContent = 'Tus zonas de trabajo se guardaron correctamente.';
      feedback.classList.add('success');
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add('error');
    } finally {
      saveButton.disabled = false;
    }
  });

  loadProfile();
})();
