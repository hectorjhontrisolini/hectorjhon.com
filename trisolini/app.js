// ═══════════════════════════════════════════════════════════
// Archivo Familiar Trisolini — Autenticación y navegación
// ═══════════════════════════════════════════════════════════

// Respuesta correcta ofuscada (base64 de "guiseppe")
const RESPUESTA_OFUSCADA = 'Z3Vpc2VwcGU=';

// Normaliza texto: minúsculas, sin tildes, sin espacios extra
function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Verifica si hay una sesión de acceso activa
function tieneAcceso() {
  return sessionStorage.getItem('trisolini_access') === 'true';
}

// Otorga acceso y guarda la sesión
function otorgarAcceso() {
  sessionStorage.setItem('trisolini_access', 'true');
}

// Cierra la sesión y redirige al login
function cerrarSesion() {
  sessionStorage.removeItem('trisolini_access');
  window.location.href = 'index.html';
}

// Verifica la respuesta del formulario de login
function verificarRespuesta(valorIngresado) {
  const respuestasValidas = ['giuseppe', 'guiseppe'];
  const normalizado = normalizarTexto(valorIngresado);
  const respuestaCorrecta = normalizarTexto(atob(RESPUESTA_OFUSCADA));
  return normalizado === respuestaCorrecta || respuestasValidas.includes(normalizado);
}

// Inicializa el formulario de login (llamado solo desde index.html)
function inicializarLogin() {
  const form = document.getElementById('form-login');
  const input = document.getElementById('input-respuesta');
  const errorMsg = document.getElementById('login-error');
  const loginPantalla = document.getElementById('login-pantalla');
  const contenidoPrincipal = document.getElementById('contenido-principal');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (verificarRespuesta(input.value)) {
      otorgarAcceso();
      loginPantalla.classList.add('oculto');
      contenidoPrincipal.classList.remove('oculto');
    } else {
      errorMsg.textContent = 'El archivo no reconoce ese nombre. Consulta nuevamente el registro familiar.';
      loginPantalla.querySelector('.login-caja').classList.remove('shake');
      void loginPantalla.offsetWidth; // reinicia la animación
      loginPantalla.querySelector('.login-caja').classList.add('shake');
      input.value = '';
      input.focus();
    }
  });
}

// Protege páginas internas: redirige a index.html si no hay acceso
function protegerPagina() {
  if (!tieneAcceso()) {
    window.location.href = 'index.html';
  }
}

// ═══════════════════════════════════════════════════════════
// Modal con Zoom Interactivo para Árbol Genealógico
// ═══════════════════════════════════════════════════════════

let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

function abrirModalArbol() {
  const modal = document.getElementById('modalArbol');
  if (modal) {
    modal.classList.remove('oculto');
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    actualizarTransformacion();
    inicializarEventosZoom();
  }
}

function cerrarModalArbol() {
  const modal = document.getElementById('modalArbol');
  if (modal) {
    modal.classList.add('oculto');
  }
}

function actualizarTransformacion() {
  const img = document.getElementById('arbolZoom');
  if (img) {
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  }
}

function inicializarEventosZoom() {
  const modal = document.getElementById('modalArbol');
  const contenedor = document.querySelector('.modal-arbol-contenedor');
  const img = document.getElementById('arbolZoom');

  if (!img || !contenedor) return;

  // Cerrar modal al hacer clic afuera de la imagen
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      cerrarModalArbol();
    }
  });

  // Zoom con scroll
  contenedor.addEventListener('wheel', function(e) {
    e.preventDefault();
    const oldZoom = zoomLevel;
    const zoomSpeed = 0.1;
    zoomLevel += e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    zoomLevel = Math.max(1, Math.min(zoomLevel, 5));

    if (zoomLevel !== oldZoom) {
      actualizarTransformacion();
    }
  }, { passive: false });

  // Pan (arrastrar) con mouse
  img.addEventListener('mousedown', function(e) {
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    img.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', function(e) {
    if (isDragging && zoomLevel > 1) {
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      actualizarTransformacion();
    }
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
    const img = document.getElementById('arbolZoom');
    if (img) img.style.cursor = 'grab';
  });

  // Touch support para móvil
  let lastDistance = 0;
  img.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      lastDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - panX;
      startY = e.touches[0].clientY - panY;
    }
  }, { passive: true });

  img.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2 && lastDistance > 0) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      zoomLevel *= distance / lastDistance;
      zoomLevel = Math.max(1, Math.min(zoomLevel, 5));
      lastDistance = distance;
      actualizarTransformacion();
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      panX = e.touches[0].clientX - startX;
      panY = e.touches[0].clientY - startY;
      actualizarTransformacion();
    }
  }, { passive: true });

  img.addEventListener('touchend', function() {
    isDragging = false;
    lastDistance = 0;
  }, { passive: true });
}
