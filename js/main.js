/* ============================================
   SENTINEL IA — Main JavaScript
   Landing Page Interactions
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // Navbar Scroll Effect
  // ============================================
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (!navbar) return;
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  // Run once on load
  handleNavbarScroll();

  // ============================================
  // Mobile Menu Toggle
  // ============================================
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      // Animate hamburger
      navToggle.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
      });
    });

    // Close menu on outside click
    document.addEventListener('click', function (e) {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('active');
      }
    });
  }

  // ============================================
  // Scroll Reveal Animation (IntersectionObserver)
  // ============================================
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    };

    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Once revealed, stop observing
          revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // ============================================
  // Animated Counter for Stats
  // ============================================
  function animateCounter(element) {
    const target = parseFloat(element.getAttribute('data-target'));
    const suffix = element.getAttribute('data-suffix') || '';
    const isDecimal = element.getAttribute('data-decimal') === 'true';
    const format = element.getAttribute('data-format');
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    function formatNumber(num) {
      if (format === 'abbr') {
        // Abbreviate large numbers
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
          return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
      }
      if (isDecimal) {
        return num.toFixed(1);
      }
      return Math.floor(num).toLocaleString('pt-BR');
    }

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = easedProgress * target;

      element.textContent = formatNumber(currentValue) + suffix;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        // Ensure final value is exact
        element.textContent = formatNumber(target) + suffix;
      }
    }

    requestAnimationFrame(updateCounter);
  }

  function initCounters() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    if (statNumbers.length === 0) return;

    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });

    statNumbers.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return; // Skip top-of-page links

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ============================================
  // Active Navigation Link Highlight
  // ============================================
  function initActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    if (sections.length === 0 || !navbar) return;

    function updateActiveLink() {
      const scrollY = window.pageYOffset;
      const navHeight = navbar.offsetHeight;

      sections.forEach(function (section) {
        const sectionTop = section.offsetTop - navHeight - 100;
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionBottom) {
          // Remove active from all navbar links
          document.querySelectorAll('.navbar-links a').forEach(function (link) {
            link.classList.remove('active');
          });
          // Add active to matching link
          const activeLink = document.querySelector('.navbar-links a[href="#' + sectionId + '"]');
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });

      // If at the very top, set Início as active
      if (scrollY < 100) {
        document.querySelectorAll('.navbar-links a').forEach(function (link) {
          link.classList.remove('active');
        });
        const homeLink = document.querySelector('.navbar-links a[href="#"]');
        if (homeLink) {
          homeLink.classList.add('active');
        }
      }
    }

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();
  }

  // ============================================
  // Parallax effect on Hero Orbs
  // ============================================
  function initParallax() {
    const orbs = document.querySelectorAll('.hero-orb');
    if (orbs.length === 0) return;

    let ticking = false;

    window.addEventListener('mousemove', function (e) {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const moveX = (e.clientX - centerX) / centerX;
        const moveY = (e.clientY - centerY) / centerY;

        orbs.forEach(function (orb, index) {
          const depth = (index + 1) * 15;
          orb.style.transform = 'translate(' + (moveX * depth) + 'px, ' + (moveY * depth) + 'px)';
        });

        ticking = false;
      });
    }, { passive: true });
  }

  // ============================================
  // Typing effect for hero (subtle)
  // ============================================
  function initTerminalGlow() {
    const heroBadge = document.querySelector('.hero-badge');
    if (!heroBadge) return;

    // Subtle pulsing glow
    setInterval(function () {
      heroBadge.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.2)';
      setTimeout(function () {
        heroBadge.style.boxShadow = 'none';
      }, 1000);
    }, 3000);
  }

  // ============================================
  // Initialize Everything on DOM Ready
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    initScrollReveal();
    initCounters();
    initSmoothScroll();
    initActiveNavHighlight();
    initParallax();
    initTerminalGlow();
  });

})();
