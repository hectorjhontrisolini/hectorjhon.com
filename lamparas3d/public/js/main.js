// Variable global que almacenará los productos
let lamparas = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Función para obtener los productos desde la base de datos
async function fetchProducts() {
    try {
        // Usamos ruta relativa para que funcione en local y en Render
        const response = await fetch('/api/products'); 
        const data = await response.json();

        // Si la base de datos está vacía, cargamos los productos de ejemplo
        if (data.length === 0) {
            lamparas = [
                { id: 1, nombre: "Lámpara Luna 3D", precio: 45.00, oldPrice: 55.00, descripcion: "Diseño esférico con textura lunar.", img: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=500&q=80", badge: "🔥 Bestseller" },
                { id: 2, nombre: "Lámpara Coral Orgánica", precio: 55.00, oldPrice: null, descripcion: "Estructura orgánica inspirada en el mar.", img: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=500&q=80", badge: null },
                { id: 3, nombre: "Lámpara Geometrik", precio: 40.00, oldPrice: 50.00, descripcion: "Líneas rectas y sombras modernas.", img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500&q=80", badge: "-20%" },
                { id: 4, nombre: "Linterna Táctica de Mano X9", precio: 60.00, oldPrice: null, descripcion: "Cuerpo impreso en 3D, resistente al agua, 1000 lúmenes.", img: "https://images.unsplash.com/photo-1595238356350-2a6e2d0b5b1d?auto=format&fit=crop&w=500&q=80", badge: "Nuevo" },
                { id: 5, nombre: "Linterna Frontal para Casco", precio: 35.00, oldPrice: 45.00, descripcion: "Soporte ergonómico impreso en 3D. Ideal para trabajo y aventura.", img: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=500&q=80", badge: "Top Ventas" },
                { id: 6, nombre: "Linterna con Sensor de Movimiento", precio: 50.00, oldPrice: null, descripcion: "Activación por proximidad. Carcasa impresa en 3D personalizable.", img: "https://images.unsplash.com/photo-1581092160607-4e6a5a2e5c1c?auto=format&fit=crop&w=500&q=80", badge: null }
            ];
        } else {
            lamparas = data;
        }
        
        renderCatalog();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        alert("Error de conexión al cargar el catálogo.");
    }
}

function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;
    
    grid.innerHTML = lamparas.map(l => `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl transition duration-300 relative">
            ${l.badge ? `<span class="absolute top-4 left-4 z-10 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">${l.badge}</span>` : ''}
            <div class="relative overflow-hidden h-64 bg-slate-100">
                <img src="${l.img}" alt="${l.nombre}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" loading="lazy">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button onclick="addToCart(${l.id})" class="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-600 hover:text-white transition transform translate-y-4 group-hover:translate-y-0">Añadir al carrito</button>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-lg font-bold text-slate-900">${l.nombre}</h3>
                <p class="mt-1 text-slate-500 text-sm line-clamp-1">${l.descripcion}</p>
                <div class="mt-4 flex items-end justify-between">
                    <div>
                        ${l.oldPrice ? `<span class="text-sm text-slate-400 line-through block">$${l.oldPrice.toFixed(2)}</span>` : ''}
                        <span class="text-2xl font-extrabold text-slate-900">$${l.precio.toFixed(2)}</span>
                    </div>
                    <button onclick="openModal(${l.id})" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Ver detalles</button>
                </div>
            </div>
        </div>
    `).join('');
}

function openModal(id) {
    const l = lamparas.find(x => x.id === id);
    const modalImg = document.getElementById('modal-img');
    if (!modalImg) return; // Seguridad por si el modal no está en el HTML

    modalImg.src = l.img;
    document.getElementById('modal-title').innerText = l.nombre;
    document.getElementById('modal-desc').innerText = l.descripcion; // Usamos descripcion
    document.getElementById('modal-price').innerText = `$${l.precio.toFixed(2)}`;
    document.getElementById('modal-add-btn').onclick = () => { addToCart(l.id); closeModal(); };
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() { 
    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('hidden'); 
}

function addToCart(id) {
    const item = cart.find(x => x.id === id);
    if (item) { 
        item.qty += 1; 
    } else { 
        const producto = lamparas.find(x => x.id === id);
        cart.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, img: producto.img, qty: 1 }); 
    }
    updateCart();
}

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    const cartCount = document.getElementById('cart-count');
    const itemsDiv = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartCount || !itemsDiv || !cartTotal) return;

    const count = cart.reduce((acc, curr) => acc + curr.qty, 0);
    cartCount.innerText = count;
    
    let total = 0;
    itemsDiv.innerHTML = cart.map(c => {
        total += c.precio * c.qty;
        return `<div class="flex justify-between items-center border-b border-slate-100 pb-3"><div class="flex items-center gap-3"><img src="${c.img}" class="w-12 h-12 rounded-lg object-cover"><div><p class="font-bold text-sm text-slate-800">${c.nombre}</p><p class="text-xs text-slate-500">Cant: ${c.qty}</p></div></div><p class="font-bold text-slate-800">$${(c.precio * c.qty).toFixed(2)}</p></div>`;
    }).join('');
    cartTotal.innerText = `$${total.toFixed(2)}`;
}

// EVENTOS UI (Protegidos para evitar errores si falta un elemento)
const btnCart = document.getElementById('cart-btn');
if (btnCart) btnCart.onclick = () => document.getElementById('cart-drawer').classList.remove('translate-x-full');

const btnCloseCart = document.getElementById('close-cart');
if (btnCloseCart) btnCloseCart.onclick = () => document.getElementById('cart-drawer').classList.add('translate-x-full');

const btnCloseModal = document.getElementById('close-modal');
if (btnCloseModal) btnCloseModal.onclick = closeModal;

const modalContainer = document.getElementById('modal');
if (modalContainer) {
    modalContainer.onclick = (e) => { if(e.target.id === 'modal') closeModal(); };
}

function checkoutWhatsApp() {
    if(cart.length === 0) return alert("Tu carrito está vacío");
    let msg = "Hola, quiero pedir los siguientes productos:%0A";
    cart.forEach(c => {
        msg += `- ${c.nombre} (x${c.qty}) - $${(c.precio * c.qty).toFixed(2)}%0A`;
    });
    const total = cart.reduce((acc, c) => acc + (c.precio * c.qty), 0);
    msg += `%0A*Total: $${total.toFixed(2)}*`;
    window.open(`https://wa.me/51999999999?text=${msg}`, '_blank');
}

async function sendOrderToAdmin() {
    if (cart.length === 0) return alert("Tu carrito está vacío");
    const email = prompt("Ingresa tu correo (o deja vacío para 'Invitado'):") || 'Invitado';
    
    const total = cart.reduce((acc, c) => acc + (c.precio * c.qty), 0);
    
    try {
        const res = await fetch('/api/orders', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, items: cart, total })
        });
        if (res.ok) {
            alert("✅ Pedido enviado. Revisa el panel de admin.");
            cart = []; updateCart();
        } else { alert("❌ Error al enviar."); }
    } catch (error) {
        alert("❌ Error de conexión.");
    }
}

// INICIALIZACIÓN
fetchProducts(); // Llamamos a la base de datos al cargar
updateCart();    // Actualizamos el carrito guardado