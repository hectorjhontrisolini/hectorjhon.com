/* ═══════════════════════════════════════════════
   Héctor Jhon Portfolio — script.js
═══════════════════════════════════════════════ */

/* ── AOS Init ── */
AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });

/* ── Nav scroll behavior ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── Mobile menu ── */
const hamburger = document.getElementById('hamburger');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburgerIcon.className = isOpen ? 'ti ti-x' : 'ti ti-menu-2';
});

navLinks.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburgerIcon.className = 'ti ti-menu-2';
  });
});

/* ── Typed text effect ── */
(function startTyped() {
  const roles = [
    'Data Scientist',
    'Analista de Sistemas',
    'Consultor Tecnológico',
    'Desarrollador Python',
    'Experto en Power BI'
  ];
  let idx = 0, charIdx = 0, deleting = false;
  const el = document.getElementById('typed-text');
  if (!el) return;

  function tick() {
    const word = roles[idx];
    if (deleting) { charIdx--; } else { charIdx++; }
    el.textContent = word.substring(0, charIdx);
    let delay = deleting ? 55 : 105;
    if (!deleting && charIdx === word.length) { delay = 2200; deleting = true; }
    else if (deleting && charIdx === 0) { deleting = false; idx = (idx + 1) % roles.length; delay = 380; }
    setTimeout(tick, delay);
  }
  setTimeout(tick, 900);
})();

/* ── Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ── Contact form ── */
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    /* 
      Para enviar emails reales, integra uno de estos servicios gratuitos:
      - Formspree: https://formspree.io  (añade action="https://formspree.io/f/YOUR_ID" al <form>)
      - EmailJS: https://emailjs.com
      - Netlify Forms: Si alojas en Netlify, añade data-netlify="true" al <form>
    */
    submitBtn.innerHTML = '<i class="ti ti-check"></i> ¡Mensaje enviado!';
    submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    submitBtn.disabled = true;
    form.reset();
  });
}

/* ── Animate skill bars on scroll ── */
(function animateSkillBars() {
  const fills = document.querySelectorAll('.skill-fill');
  if (!fills.length) return;

  // Store target widths and set to 0 initially
  fills.forEach(fill => {
    fill._targetWidth = fill.style.width;
    fill.style.width = '0%';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target._targetWidth;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  fills.forEach(fill => observer.observe(fill));
})();

/* ── Stats counter animation ── */
(function animateCounters() {
  const counters = document.querySelectorAll('.stat-num');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const text = el.textContent;
      const match = text.match(/^(\d+)(.*)$/);
      if (!match) return;

      const target = parseInt(match[1]);
      const suffix = match[2];
      let current = 0;
      const step = Math.ceil(target / 50);
      const interval = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + suffix;
        if (current >= target) clearInterval(interval);
      }, 30);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

/* ── Active nav link on scroll ── */
(function highlightNav() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.pageYOffset >= top) current = section.id;
    });
    links.forEach(link => {
      link.style.color = link.getAttribute('href') === '#' + current ? '#4f8ef7' : '';
    });
  }, { passive: true });
})();
