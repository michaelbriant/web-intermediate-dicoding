import HomePage from '../pages/home-page.js';
import LoginPage from '../pages/login-page.js';
import RegisterPage from '../pages/register-page.js';
import AddStoryPage from '../pages/add-story-page.js';

const routes = {
  '/': HomePage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/add-story': AddStoryPage,
};

const router = () => {
  const mainContent = document.getElementById('main-content');
  const path = window.location.hash.slice(1).toLowerCase() || '/';

  const protectedRoutes = ['/', '/add-story'];
  const token = localStorage.getItem('authToken');

  if (token) {
    document.body.classList.add('logged-in');
  } else {
    document.body.classList.remove('logged-in');
  }

  if (protectedRoutes.includes(path) && !token) {
    alert('Anda harus login terlebih dahulu.');
    window.location.hash = '#/login';
    return;
  }
  
  if ((path === '/login' || path === '/register') && token) {
    window.location.hash = '#/';
    return;
  }

  const Page = routes[path] || routes['/'];
  
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      mainContent.innerHTML = '';
      mainContent.appendChild(new Page());
    });
  } else {
    if (mainContent.firstChild) {
      mainContent.classList.add('fade-out');
      setTimeout(() => {
        mainContent.innerHTML = '';
        mainContent.appendChild(new Page());
        mainContent.classList.remove('fade-out');
      }, 300);
    } else {
      mainContent.innerHTML = '';
      mainContent.appendChild(new Page());
    }
  }
};

export default router;