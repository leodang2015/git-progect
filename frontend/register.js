document.addEventListener('DOMContentLoaded', () => {
	const registerForm = document.getElementById('registerForm');
	const nameInput = document.getElementById('name');
	const emailInput = document.getElementById('email');
	const phoneInput = document.getElementById('phone');
	const passwordInput = document.getElementById('password');
	const confirmPasswordInput = document.getElementById('confirmPassword');
	const captchaCheck = document.getElementById('captchaCheck');
	const registerButton = document.getElementById('registerBtn');
	const fields = [nameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput];
	const USERS_KEY = 'reservas_users';
	const MIN_PASSWORD_LENGTH = 6;

	const errorElements = {
		name: document.getElementById('nameError'),
		email: document.getElementById('emailError'),
		phone: document.getElementById('phoneError'),
		password: document.getElementById('passwordError'),
		confirmPassword: document.getElementById('confirmPasswordError'),
		captcha: document.getElementById('captchaError')
	};

	const formMessage = document.createElement('p');
	formMessage.className = 'form-message';
	formMessage.setAttribute('role', 'alert');
	registerForm.prepend(formMessage);

	const getUsers = () => {
		try {
			const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
			return Array.isArray(users) ? users : [];
		} catch (error) {
			return [];
		}
	};

	const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	const isValidPhone = (phone) => /^[0-9+()\s-]{7,20}$/.test(phone);

	const updatePasswordStrength = () => {
		const password = passwordInput.value;
		const strengthBar = document.getElementById('strengthBar');
		const strengthLabel = document.getElementById('strengthLabel');
		const score = [
			password.length >= MIN_PASSWORD_LENGTH,
			/[A-Z]/.test(password),
			/[0-9]/.test(password),
			/[^A-Za-z0-9]/.test(password)
		].filter(Boolean).length;
		const levels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
		strengthBar.style.width = `${score * 25}%`;
		strengthBar.className = `strength-${score}`;
		strengthLabel.textContent = password ? `Seguridad: ${levels[score]}` : 'Seguridad de contraseña';
	};

	document.querySelectorAll('.password-toggle').forEach((toggle) => {
		toggle.addEventListener('click', () => {
			const input = document.getElementById(toggle.dataset.target);
			const showing = input.type === 'text';
			input.type = showing ? 'password' : 'text';
			toggle.textContent = showing ? 'Mostrar' : 'Ocultar';
			toggle.setAttribute('aria-label', `${showing ? 'Mostrar' : 'Ocultar'} contraseña`);
			toggle.setAttribute('title', `${showing ? 'Mostrar' : 'Ocultar'} contraseña`);
		});
	});

	passwordInput.addEventListener('input', updatePasswordStrength);

	const clearFeedback = () => {
		formMessage.textContent = '';
		formMessage.className = 'form-message';
		fields.forEach((field) => field.classList.remove('invalid'));
		captchaCheck.classList.remove('invalid');
		Object.values(errorElements).forEach((element) => { element.textContent = ''; });
	};

	const setFieldError = (field, message) => {
		field.classList.add('invalid');
		errorElements[field.id].textContent = message;
	};

	registerForm.addEventListener('submit', (event) => {
		event.preventDefault();
		clearFeedback();

		const name = nameInput.value.trim();
		const email = emailInput.value.trim().toLowerCase();
		const phone = phoneInput.value.trim();
		const password = passwordInput.value;
		const confirmPassword = confirmPasswordInput.value;
		let isValid = true;

		if (!name) {
			setFieldError(nameInput, 'El nombre completo es obligatorio.');
			isValid = false;
		} else if (name.length < 3) {
			setFieldError(nameInput, 'Ingresa un nombre de al menos 3 caracteres.');
			isValid = false;
		}

		if (!email) {
			setFieldError(emailInput, 'El correo electrónico es obligatorio.');
			isValid = false;
		} else if (!isValidEmail(email)) {
			setFieldError(emailInput, 'Ingresa un correo electrónico válido.');
			isValid = false;
		}

		if (!phone) {
			setFieldError(phoneInput, 'El teléfono es obligatorio.');
			isValid = false;
		} else if (!isValidPhone(phone)) {
			setFieldError(phoneInput, 'Ingresa un teléfono válido.');
			isValid = false;
		}

		if (!password) {
			setFieldError(passwordInput, 'La contraseña es obligatoria.');
			isValid = false;
		} else if (password.length < MIN_PASSWORD_LENGTH) {
			setFieldError(passwordInput, `La contraseña debe tener mínimo ${MIN_PASSWORD_LENGTH} caracteres.`);
			isValid = false;
		}

		if (!confirmPassword) {
			setFieldError(confirmPasswordInput, 'Confirma tu contraseña.');
			isValid = false;
		} else if (password !== confirmPassword) {
			setFieldError(confirmPasswordInput, 'Las contraseñas no coinciden.');
			isValid = false;
		}

		if (!captchaCheck.checked) {
			captchaCheck.classList.add('invalid');
			errorElements.captcha.textContent = 'Confirma que no eres un robot.';
			isValid = false;
		}

		if (!isValid) return;

		const users = getUsers();
		if (users.some((user) => user.email.toLowerCase() === email)) {
			setFieldError(emailInput, 'Este correo ya está registrado.');
			formMessage.textContent = 'No se pudo completar el registro.';
			return;
		}

		users.push({ name, email, phone, password });
		localStorage.setItem(USERS_KEY, JSON.stringify(users));
		sessionStorage.setItem('registration_message', 'Registro exitoso. Ahora puedes iniciar sesión.');
		formMessage.textContent = 'Registro exitoso. Redirigiendo al inicio de sesión...';
		formMessage.className = 'form-message success';
		registerButton.disabled = true;
		window.setTimeout(() => { window.location.href = 'index.html'; }, 500);
	});
});
