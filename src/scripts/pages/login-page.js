import StoryApi from '../data/api.js';

class LoginPage extends HTMLElement {
  connectedCallback() {
    this.render();
    this._setupFormListener();
  }

  render() {
    this.innerHTML = `
      <h2>Halaman Login</h2>
      <form id="login-form">
        <div>
          <label for="login-email">Email:</label>
          <input type="email" id="login-email" required>
        </div>
        <div>
          <label for="login-password">Password:</label>
          <input type="password" id="login-password" required>
        </div>
        <button type="submit">Login</button>
      </form>
      <p class="auth-link">Belum punya akun? <a href="#/register">Daftar di sini</a></p>
    `;
  }

  _setupFormListener() {
    const form = this.querySelector('#login-form');
    form.addEventListener('submit', this._loginFormSubmit.bind(this));
  }

  async _loginFormSubmit(event) {
    event.preventDefault();

    const loader = document.getElementById('loading-overlay');
    const submitButton = this.querySelector('button[type="submit"]');

    loader.classList.add('show');
    submitButton.disabled = true;

    const email = this.querySelector('#login-email').value;
    const password = this.querySelector('#login-password').value;

    try {
      const response = await StoryApi.login(email, password);
      localStorage.setItem('authToken', response.loginResult.token);
      
      window.location.hash = '#/';

    } catch (error) {
      alert(`Login Gagal: ${error.message}`);
    } finally {
      loader.classList.remove('show');
      submitButton.disabled = false;
    }
  }
}

customElements.define('login-page', LoginPage);
export default LoginPage;