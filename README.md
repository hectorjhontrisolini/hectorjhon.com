# Portafolio Web — Héctor Jhon Vargas Cerna
**hectorjhon.com** · Data Scientist & Consultor Tecnológico

---

## 📁 Estructura de archivos

```
/
├── index.html      ← Página principal
├── styles.css      ← Estilos completos
├── script.js       ← JavaScript (nav, animaciones, typed text, form)
└── README.md       ← Este archivo
```

---

## 🚀 Despliegue en GitHub Pages

### Paso 1 — Crear repositorio

1. Ve a [github.com/new](https://github.com/new)
2. Nómbralo `hectorjhon.github.io` (o cualquier nombre si usarás dominio propio)
3. Márcalo como **Public**
4. Clic en **Create repository**

### Paso 2 — Subir los archivos

**Opción A — Interfaz web (más fácil):**
1. Dentro del repositorio, clic en **Add file → Upload files**
2. Arrastra `index.html`, `styles.css` y `script.js`
3. Escribe un commit message: `"Initial portfolio deployment"`
4. Clic en **Commit changes**

**Opción B — Git CLI:**
```bash
git init
git add index.html styles.css script.js
git commit -m "Initial portfolio deployment"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### Paso 3 — Activar GitHub Pages

1. Ve a **Settings** → **Pages** (en el menú lateral)
2. En **Branch**, selecciona `main` y carpeta `/ (root)`
3. Clic en **Save**
4. Espera 1-2 minutos
5. Tu sitio estará en: `https://TU_USUARIO.github.io/TU_REPO/`

---

## 🌐 Conectar dominio personalizado (www.hectorjhon.com)

### Paso 1 — Configurar en GitHub Pages

1. Ve a **Settings → Pages → Custom domain**
2. Escribe `www.hectorjhon.com` y clic **Save**
3. GitHub creará automáticamente un archivo `CNAME`

### Paso 2 — Configurar DNS en tu proveedor de dominio

**Para `www.hectorjhon.com` (subdominio www):**
Añade un registro **CNAME** en tu panel DNS:

| Tipo  | Nombre | Valor                          |
|-------|--------|--------------------------------|
| CNAME | www    | `TU_USUARIO.github.io`         |

**Para `hectorjhon.com` (apex/raíz), añade registros A:**

| Tipo | Nombre | Valor          |
|------|--------|----------------|
| A    | @      | 185.199.108.153 |
| A    | @      | 185.199.109.153 |
| A    | @      | 185.199.110.153 |
| A    | @      | 185.199.111.153 |

### Paso 3 — Habilitar HTTPS

1. En **Settings → Pages**, marca **Enforce HTTPS**
2. Espera ~10 minutos para que el certificado SSL se emita

> ⚠️ La propagación de DNS puede tomar entre 10 min y 48 horas según tu proveedor.

---

## 🔗 Enlazar tu App ST-FONDES

En `index.html`, busca los comentarios `⚠️ REEMPLAZA` y actualiza la URL:

```html
<!-- Busca esto (aparece 2 veces): -->
href="https://ST-FONDES.streamlit.app"

<!-- Reemplaza con tu URL real, ejemplo: -->
href="https://hectorjhon-st-fondes.streamlit.app"
```

---

## ✏️ Personalizar el contenido

### Datos personales
Busca y reemplaza en `index.html`:
- `Héctor Jhon Vargas Cerna` → Tu nombre completo
- `hola@hectorjhon.com` → Tu email real
- `linkedin.com/in/hectorjhon` → Tu LinkedIn
- `github.com/hectorjhon` → Tu GitHub
- `+51 999 999 999` → Tu WhatsApp
- `Perú` → Tu país/ciudad

### Foto de perfil
Añade tu foto como `foto.jpg` en la misma carpeta y reemplaza el bloque `.photo-placeholder` en `index.html` por:
```html
<img src="foto.jpg" alt="Héctor Jhon" style="width:100%;height:100%;object-fit:cover;border-radius:20px;">
```

### Activar envío de emails (formulario de contacto)

1. Regístrate gratis en [formspree.io](https://formspree.io)
2. Crea un formulario y copia tu endpoint
3. En `index.html`, añade `action` al `<form>`:
```html
<form id="contactForm" action="https://formspree.io/f/TU_ID" method="POST">
```

### Colores de la paleta
En `styles.css`, cambia las variables de color globalmente:
- Azul acento: `#4f8ef7`
- Púrpura acento: `#8b5cf6`
- Fondo: `#07071a`

---

## 📦 Librerías externas (CDN, sin instalación)

| Librería | Uso |
|----------|-----|
| [Space Grotesk + Inter + JetBrains Mono](https://fonts.google.com) | Tipografías |
| [Tabler Icons](https://tabler.io/icons) | Iconografía |
| [AOS](https://michalsnik.github.io/aos/) | Animaciones al hacer scroll |

Todas se cargan vía CDN — no requieren `npm install` ni bundlers. ✅

---

## 🛠️ Actualizaciones futuras

Para actualizar el sitio después del despliegue inicial:
1. Edita los archivos localmente
2. Haz `git add . && git commit -m "Update" && git push`
3. GitHub Pages se actualiza automáticamente en ~1 minuto

---

*Portafolio construido con HTML + CSS + JS puro · 100% compatible con GitHub Pages*
