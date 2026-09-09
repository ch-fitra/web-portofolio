/**
 * app.js
 * Main bootstrap script:
 * Theme management, toast notifications, UI helpers, and initializing showcase + CMS.
 */

import { db } from './db.js';
import { PortfolioShowcase } from './portfolio.js';
import { AdminCMS } from './admin.js';

// Global Toast Notification Helper
window.showToast = function(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };

  toast.innerHTML = `
    <i class="${iconMap[type] || 'fas fa-info-circle'}" style="font-size: 1.1rem;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Global Theme Management Helper
window.setTheme = function(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  if (themeToggleIcon) {
    if (themeName === 'light') {
      themeToggleIcon.className = 'fas fa-moon';
    } else if (themeName === 'cyber') {
      themeToggleIcon.className = 'fas fa-bolt';
    } else {
      themeToggleIcon.className = 'fas fa-sun';
    }
  }
};

// Application Bootstrap
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Database & default theme
  const settings = db.getSettings();
  const profile = db.getProfile();
  const initialTheme = settings.theme || 'dark';
  window.setTheme(initialTheme);
  document.title = settings.siteTitle || 'Rani Nuraini Atelier — Feed Koleksi';

  // 2. Initialize Visitor Showcase
  const showcase = new PortfolioShowcase();
  await showcase.loadAndRender();

  // 3. Initialize Admin CMS
  const admin = new AdminCMS(showcase);

  // 4. Header Scroll Effect (if header exists)
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // 5. Theme Toggle Button
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      let nextTheme = 'light';
      if (currentTheme === 'dark') nextTheme = 'light';
      else if (currentTheme === 'light') nextTheme = 'cyber';
      else nextTheme = 'dark';

      window.setTheme(nextTheme);
      const curSettings = db.getSettings();
      curSettings.theme = nextTheme;
      db.saveSettings(curSettings);
      window.showToast(`Mode tema diubah ke: ${nextTheme.toUpperCase()}`, 'info', 2000);
    });
  }

  // 6. Mobile Menu Drawer
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navLinksList = document.querySelector('.nav-links');
  if (mobileMenuToggle && navLinksList) {
    mobileMenuToggle.addEventListener('click', () => {
      const isVisible = navLinksList.style.display === 'flex';
      navLinksList.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinksList.style.position = 'absolute';
        navLinksList.style.top = '76px';
        navLinksList.style.left = '0';
        navLinksList.style.width = '100%';
        navLinksList.style.background = 'var(--bg-secondary)';
        navLinksList.style.flexDirection = 'column';
        navLinksList.style.padding = '1.5rem';
        navLinksList.style.borderBottom = '1px solid var(--border-color)';
      }
    });
  }

  // 7. Active Nav Link on Scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const navLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);
      if (navLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          navLink.classList.add('active');
        }
      }
    });
  });

  // Footer Year
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear().toString();
  }
});
