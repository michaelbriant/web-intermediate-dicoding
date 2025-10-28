import StoryApi from '../data/api.js';

class RegisterPage extends HTMLElement {
  connectedCallback() {
    this.render();
    this._setupFormListener();
  }

  render() {
    this.innerHTML = `
      <h2>Halaman Registrasi</h2>
      <form id="register-form">
        <div>
          <label for="register-name">Name:</label>
          <input type="text" id="register-name" required>
        </div>
        <div>
          <label for="register-email">Email:</label>
          <input type="email" id="register-email" required>
        </div>
        <div>
          <label for="register-password">Password:</label>
          <input type="password" id="register-password" minlength="8" required>
        </div>
        <button type="submit">Register</button>
      </form>
      <p class="auth-link">Sudah punya akun? <a href="#/login">Login di sini</a></p>
    `;
  }

  _setupFormListener() {
    const form = this.querySelector('#register-form');
    form.addEventListener('submit', this._registerFormSubmit.bind(this));
  }

  async _registerFormSubmit(event) {
    event.preventDefault();

    const name = this.querySelector('#register-name').value;
    const email = this.querySelector('#register-email').value;
    const password = this.querySelector('#register-password').value;

    try {
      const response = await StoryApi.register(name, email, password);
      alert('Registrasi berhasil!');
      window.location.hash = '#/login';
    } catch (error) {
      alert(`Registrasi Gagal: ${error.message}`);
    }
  }
}

customElements.define('register-page', RegisterPage);
export default RegisterPage;