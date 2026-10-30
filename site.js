/**
 * Infinite Cyberspace Hub — shared site behaviour
 * Mobile nav, active links, navbar scroll, safe helpers
 */
(function () {
  'use strict';

  const SITE = {
    name: 'Infinite Cyberspace Hub',
    whatsapp: '254768741052',
    phoneDisplay: '+254 768 741 052'
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function currentPage() {
    let path = window.location.pathname.split('/').pop() || 'index.html';
    if (!path || path === '/') path = 'index.html';
    return path.toLowerCase();
  }

  function setActiveNav() {
    const page = currentPage();
    $$('.nav-link').forEach((link) => {
      const href = (link.getAttribute('href') || '').split('/').pop().toLowerCase();
      const isHome = page === 'index.html' && (href === 'index.html' || href === '' || href === '/');
      const match = href === page || isHome;
      link.classList.toggle('active', match);
      // Remove hard-coded "always cyan" on Home from HTML if present
      if (!match) link.classList.remove('text-cyan-300');
      if (match) link.classList.add('text-cyan-300');
    });
  }

  function toggleMenu() {
    const menu = $('#mobile-menu');
    const btn = $('#menu-btn');
    if (!menu) return;

    const open = menu.classList.toggle('hidden') === false; // after toggle: visible if not hidden
    // classList.toggle returns true if class is now present
    // We toggled 'hidden': if now has 'hidden', menu is closed
    const isClosed = menu.classList.contains('hidden');

    const icon = btn && btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars', isClosed);
      icon.classList.toggle('fa-times', !isClosed);
    }
    btn && btn.setAttribute('aria-expanded', isClosed ? 'false' : 'true');
  }

  function bindMobileNav() {
    const btn = $('#menu-btn');
    if (btn) {
      btn.removeAttribute('onclick'); // prefer JS listener
      btn.setAttribute('aria-controls', 'mobile-menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
      });
    }

    $$('#mobile-menu a').forEach((a) => {
      a.addEventListener('click', () => {
        const menu = $('#mobile-menu');
        if (menu && !menu.classList.contains('hidden')) toggleMenu();
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const menu = $('#mobile-menu');
        if (menu && !menu.classList.contains('hidden')) toggleMenu();
      }
    });

    // Expose for any residual inline handlers
    window.toggleMenu = toggleMenu;
  }

  function bindNavbarScroll() {
    const navbar = $('.navbar');
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function fixNavbarOverflow() {
    // Runtime safety if CSS still has overflow:hidden
    const navbar = $('.navbar');
    if (navbar) navbar.style.overflow = 'visible';
  }

  function waLink(text) {
    return 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(text || '');
  }

  window.ICH = {
    SITE,
    waLink,
    toggleMenu,
    currentPage
  };

  document.addEventListener('DOMContentLoaded', () => {
    fixNavbarOverflow();
    bindMobileNav();
    bindNavbarScroll();
    setActiveNav();
  });
})();
