document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMsg = document.getElementById('error-msg');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const data = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = 'dashboard.html';
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            try {
                const data = await apiFetch('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password, role })
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = 'dashboard.html';
            } catch (error) {
                showError(error.message);
            }
        });
    }

    function showError(message) {
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.classList.remove('hidden');
            setTimeout(() => {
                errorMsg.classList.add('hidden');
            }, 5000);
        } else {
            alert(message);
        }
    }
});
