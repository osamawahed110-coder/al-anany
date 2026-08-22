// Particles
const container = document.getElementById('particles');
for (let i = 0; i < 30; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.cssText = `
    left: ${Math.random() * 100}%;
    animation-duration: ${8 + Math.random() * 12}s;
    animation-delay: ${Math.random() * 8}s;
    width: ${1 + Math.random() * 3}px;
    height: ${1 + Math.random() * 3}px;
    opacity: ${0.3 + Math.random() * 0.4};
  `;
  container.appendChild(p);
}

// Toggle password
document.getElementById('togglePass').addEventListener('click', () => {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errorMsg = document.getElementById('errorMsg');
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');

  errorMsg.style.display = 'none';
  btn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('alanani_token', data.token);
      localStorage.setItem('alanani_user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } else {
      errorMsg.textContent = data.message;
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    errorMsg.textContent = 'حدث خطأ في الاتصال بالخادم';
    errorMsg.style.display = 'block';
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
});

// Redirect if already logged in
const token = localStorage.getItem('alanani_token');
if (token) {
  fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(d => { if (d.success) window.location.href = '/dashboard'; })
    .catch(() => {});
}
