document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitButton = document.getElementById('submitBtn');

  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const formMessage = document.createElement('p');
  formMessage.className = 'form-message';
  formMessage.setAttribute('role', 'alert');
  loginForm.prepend(formMessage);

  const registrationMessage = sessionStorage.getItem('registration_message');
  if (registrationMessage) {
    formMessage.textContent = registrationMessage;
    formMessage.className = 'form-message success';
    sessionStorage.removeItem('registration_message');
  }

  const USERS_KEY = 'reservas_users';
  const LOGIN_STATE_KEY = 'reservas_login_state';
  const SESSION_KEY = 'reservas_session';
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MS = 15 * 60 * 1000;
  const MIN_PASSWORD_LENGTH = 6;

  const getJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const users = getJson(USERS_KEY, []);
  if (!users.length) {
    saveJson(USERS_KEY, [{
      name: 'Usuario demo',
      email: 'usuario@ejemplo.com',
      password: 'Demo123!'
    }]);
  }

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getLoginState = () => getJson(LOGIN_STATE_KEY, { attempts: 0, lockedUntil: 0 });

  const showMessage = (message, type = 'error') => {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
  };

  const clearErrors = () => {
    emailError.textContent = '';
    passwordError.textContent = '';
    emailInput.classList.remove('invalid');
    passwordInput.classList.remove('invalid');
    showMessage('');
  };

  const createSessionToken = () => {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const getRemainingLockTime = (lockedUntil) => Math.ceil((lockedUntil - Date.now()) / 60000);

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const loginState = getLoginState();
    if (loginState.lockedUntil > Date.now()) {
      showMessage(`Demasiados intentos. Intenta nuevamente en ${getRemainingLockTime(loginState.lockedUntil)} minuto(s).`);
      return;
    }

    let isValid = true;
    const emailValue = emailInput.value.trim();
    if (!emailValue) {
      emailError.textContent = 'El correo electrónico es obligatorio.';
      emailInput.classList.add('invalid');
      isValid = false;
    } else if (!isValidEmail(emailValue)) {
      emailError.textContent = 'Por favor, ingresa un correo válido.';
      emailInput.classList.add('invalid');
      isValid = false;
    }

    
    const passwordValue = passwordInput.value.trim();
    if (!passwordValue) {
      passwordError.textContent = 'La contraseña es obligatoria.';
      passwordInput.classList.add('invalid');
      isValid = false;
    } else if (passwordValue.length < MIN_PASSWORD_LENGTH) {
      passwordError.textContent = `La contraseña debe tener mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
      passwordInput.classList.add('invalid');
      isValid = false;
    }

    if (!isValid) return;

    const storedUsers = getJson(USERS_KEY, []);
    const user = storedUsers.find((storedUser) =>
      storedUser.email.toLowerCase() === emailValue.toLowerCase()
      && storedUser.password === passwordValue
    );

    if (!user) {
      const attempts = loginState.attempts + 1;
      const nextState = { attempts, lockedUntil: 0 };
      if (attempts >= MAX_ATTEMPTS) nextState.lockedUntil = Date.now() + LOCK_TIME_MS;
      saveJson(LOGIN_STATE_KEY, nextState);
      showMessage(nextState.lockedUntil
        ? 'Has superado el número de intentos permitidos. El acceso está bloqueado durante 15 minutos.'
        : 'El correo o la contraseña son incorrectos.');
      return;
    }

    saveJson(LOGIN_STATE_KEY, { attempts: 0, lockedUntil: 0 });
    saveJson(SESSION_KEY, {
      token: createSessionToken(),
      user: { name: user.name, email: user.email },
      expiresAt: Date.now() + (60 * 60 * 1000)
    });
    showMessage('Inicio de sesión exitoso. Redirigiendo...', 'success');
    submitButton.disabled = true;
    window.setTimeout(() => { window.location.href = 'dashboard.html'; }, 300);
  });
});