import router from './routes/routes.js';

class App {
  constructor() {
    this._initialAppShell();
    this._initialRouter();
  }

  _initialAppShell() {
    const drawerButton = document.getElementById('drawer-button');
    const navigationDrawer = document.getElementById('navigation-drawer');
    const mainContent = document.getElementById('main-content');
    const logoutButton = document.getElementById('logout-button');

    drawerButton.addEventListener('click', (event) => {
      navigationDrawer.classList.toggle('open');
      event.stopPropagation();
    });

    mainContent.addEventListener('click', () => {
      navigationDrawer.classList.remove('open');
    });

    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('authToken');
      alert('Anda telah logout.');
      window.location.hash = '#/login';
      navigationDrawer.classList.remove('open');
    });
  }

  _initialRouter() {
    window.addEventListener('load', () => {
      router();
    });
    window.addEventListener('hashchange', () => {
      router();
    });
  }
}

export default App;