const lamparas = [
    // Línea Iluminación Decorativa
    { id: 1, nombre: "Lámpara Luna 3D", precio: 45.00, oldPrice: 55.00, desc: "Diseño esférico con textura lunar.", img: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=500&q=80", badge: "🔥 Bestseller" },
    { id: 2, nombre: "Lámpara Coral Orgánica", precio: 55.00, oldPrice: null, desc: "Estructura orgánica inspirada en el mar.", img: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=500&q=80", badge: null },
    { id: 3, nombre: "Lámpara Geometrik", precio: 40.00, oldPrice: 50.00, desc: "Líneas rectas y sombras modernas.", img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500&q=80", badge: "-20%" },
    
    // Línea Supervivencia / Herramientas 3D
    { id: 4, nombre: "Linterna Táctica de Mano X9", precio: 60.00, oldPrice: null, desc: "Cuerpo impreso en 3D, resistente al agua, 1000 lúmenes.", img: "https://images.unsplash.com/photo-1595238356350-2a6e2d0b5b1d?auto=format&fit=crop&w=500&q=80", badge: "Nuevo" },
    { id: 5, nombre: "Linterna Frontal para Casco", precio: 35.00, oldPrice: 45.00, desc: "Soporte ergonómico impreso en 3D. Ideal para trabajo y aventura.", img: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=500&q=80", badge: "Top Ventas" },
    { id: 6, nombre: "Linterna con Sensor de Movimiento", precio: 50.00, oldPrice: null, desc: "Activación por proximidad. Carcasa impresa en 3D personalizable.", img: "https://images.unsplash.com/photo-1581092160607-4e6a5a2e5c1c?auto=format&fit=crop&w=500&q=80", badge: null }
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function renderCatalog() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = lamparas.map(l => `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl transition duration-300 relative">
            ${l.badge ? `<span class="absolute top-4 left-4 z-10 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">${l.badge}</span>` : ''}
            <div class="relative overflow-hidden h-64 bg-slate-100">
                <img src="${l.img}" alt="${l.nombre}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" loading="lazy">
                <!-- Acción rápida en Hover -->
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button onclick="addToCart(${l.id})" class="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-600 hover:text-white transition transform translate-y-4 group-hover:translate-y-0">Añadir al carrito</button>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-lg font-bold text-slate-900">${l.nombre}</h3>
                <p class="mt-1 text-slate-500 text-sm line-clamp-1">${l.desc}</p>
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

// ... (El resto de las funciones openModal, addToCart, updateCart, checkoutWhatsApp, sendOrderToAdmin se mantienen EXACTAMENTE IGUAL que en la respuesta anterior) ...
// Solo asegúrate de tenerlas al final del archivo para que el carrito funcione.

function openModal(id) {
    const l = lamparas.find(x => x.id === id);
    document.getElementById('modal-img').src = l.img;
    document.getElementById('modal-title').innerText = l.nombre;
    document.getElementById('modal-desc').innerText = l.desc;
    document.getElementById('modal-price').innerText = `$${l.precio.toFixed(2)}`;
    document.getElementById('modal-add-btn').onclick = () => { addToCart(l.id); closeModal(); };
    document.getElementById('modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function addToCart(id) {
    const item = cart.find(x => x.id === id);
    if (item) { item.qty += 1; } else { cart.push({ id, qty: 1 }); }
    updateCart();
}
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    const count = cart.reduce((acc, curr) => acc + curr.qty, 0);
    document.getElementById('cart-count').innerText = count;
    const itemsDiv = document.getElementById('cart-items');
    let total = 0;
    itemsDiv.innerHTML = cart.map(c => {
        const l = lamparas.find(x => x.id === c.id);
        total += l.precio * c.qty;
        return `<div class="flex justify-between items-center border-b border-slate-100 pb-3"><div class="flex items-center gap-3"><img src="${l.img}" class="w-12 h-12 rounded-lg object-cover"><div><p class="font-bold text-sm text-slate-800">${l.nombre}</p><p class="text-xs text-slate-500">Cant: ${c.qty}</p></div></div><p class="font-bold text-slate-800">$${(l.precio * c.qty).toFixed(2)}</p></div>`;
    }).join('');
    document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
}

// Eventos UI (Protegidos contra nulos)
const cartBtn = document.getElementById('cart-btn');
if (cartBtn) cartBtn.onclick = () => document.getElementById('cart-drawer').classList.remove('translate-x-full');

const closeCartBtn = document.getElementById('close-cart');
if (closeCartBtn) closeCartBtn.onclick = () => document.getElementById('cart-drawer').classList.add('translate-x-full');

const closeModalBtn = document.getElementById('close-modal');
if (closeModalBtn) closeModalBtn.onclick = closeModal;

const modalContainer = document.getElementById('modal');
if (modalContainer) {
    modalContainer.onclick = (e) => { if(e.target.id === 'modal') closeModal(); };
}

renderCatalog();
updateCart();