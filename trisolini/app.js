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

let arbolZoom = {
  zoom: 1,
  panX: 0,
  panY: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  initialized: false
};

function abrirModalArbol() {
  const modal = document.getElementById('modalArbol');
  if (modal) {
    modal.classList.remove('oculto');
    arbolZoom.zoom = 1;
    arbolZoom.panX = 0;
    arbolZoom.panY = 0;
    actualizarArbol();
    if (!arbolZoom.initialized) {
      inicializarArbol();
      arbolZoom.initialized = true;
    }
  }
}

function cerrarModalArbol() {
  const modal = document.getElementById('modalArbol');
  if (modal) {
    modal.classList.add('oculto');
  }
}

function actualizarArbol() {
  const img = document.getElementById('arbolZoom');
  if (img) {
    img.style.transform = `translate(${arbolZoom.panX}px, ${arbolZoom.panY}px) scale(${arbolZoom.zoom})`;
  }
}

function inicializarArbol() {
  const img = document.getElementById('arbolZoom');
  const contenedor = document.querySelector('.modal-arbol-contenedor');
  const modal = document.getElementById('modalArbol');

  if (!img || !contenedor) return;

  // Cerrar al hacer clic en el fondo
  if (modal) {
    modal.onclick = function(e) {
      if (e.target === modal) cerrarModalArbol();
    };
  }

  // Zoom con rueda del mouse
  contenedor.onwheel = function(e) {
    e.preventDefault();
    const paso = 0.1;
    arbolZoom.zoom += e.deltaY > 0 ? -paso : paso;
    arbolZoom.zoom = Math.max(1, Math.min(arbolZoom.zoom, 5));
    actualizarArbol();
  };

  // Arrastrar con mouse
  img.onmousedown = function(e) {
    arbolZoom.isDragging = true;
    arbolZoom.startX = e.clientX - arbolZoom.panX;
    arbolZoom.startY = e.clientY - arbolZoom.panY;
  };

  document.onmousemove = function(e) {
    if (arbolZoom.isDragging && arbolZoom.zoom > 1) {
      arbolZoom.panX = e.clientX - arbolZoom.startX;
      arbolZoom.panY = e.clientY - arbolZoom.startY;
      actualizarArbol();
    }
  };

  document.onmouseup = function() {
    arbolZoom.isDragging = false;
  };
}
