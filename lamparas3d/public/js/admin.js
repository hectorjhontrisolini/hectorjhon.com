// --- LÓGICA DE PEDIDOS ---
async function loadOrders() {
    const res = await fetch('/api/orders');
    if (res.status === 401 || res.status === 403) { window.location.href = '/login'; return; }
    const orders = await res.json();
    const tbody = document.getElementById('orders-table');
    
    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">No hay pedidos aún</td></tr>`;
        return;
    }
    
    tbody.innerHTML = orders.map(o => {
        let items = [];
        try { items = JSON.parse(o.items); } catch(e) {}
        const itemsStr = items.map(i => `${i.nombre} (x${i.qty})`).join(', ');
        return `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#${o.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${o.client_email}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${itemsStr}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">$${o.total.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <select onchange="updateStatus(${o.id}, this.value)" class="border rounded p-1 text-sm">
                    <option value="Pendiente" ${o.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En impresión" ${o.status === 'En impresión' ? 'selected' : ''}>En impresión</option>
                    <option value="Enviado" ${o.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="Entregado" ${o.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
                </select>
            </td>
        </tr>`;
    }).join('');
}

async function updateStatus(id, status) {
    await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    loadOrders();
}

// --- LÓGICA DE PRODUCTOS ---
async function loadProducts() {
    const res = await fetch('/api/products');
    const products = await res.json();
    const tbody = document.getElementById('products-table');
    
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">No hay productos en la base de datos. Añade el primero arriba.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td class="px-6 py-4"><img src="${p.img}" class="w-12 h-12 rounded object-cover border border-gray-200"></td>
            <td class="px-6 py-4 text-sm font-bold text-gray-800">${p.nombre}</td>
            <td class="px-6 py-4 text-sm text-gray-500">$${p.precio.toFixed(2)}</td>
            <td class="px-6 py-4 text-sm">
                <button onclick="deleteProduct(${p.id})" class="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold transition">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const oldPriceInput = document.getElementById('p-oldPrice').value;
    const badgeInput = document.getElementById('p-badge').value;
    
    const newProduct = {
        nombre: document.getElementById('p-nombre').value,
        precio: parseFloat(document.getElementById('p-precio').value),
        oldPrice: oldPriceInput ? parseFloat(oldPriceInput) : null,
        descripcion: document.getElementById('p-desc').value,
        img: document.getElementById('p-img').value,
        badge: badgeInput ? badgeInput : null
    };

    const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
    });
    
    if (res.ok) {
        document.getElementById('product-form').reset();
        loadProducts(); // Recargar la tabla
    } else {
        alert("Error al guardar el producto. Verifica tu sesión.");
    }
});

async function deleteProduct(id) {
    if(confirm("¿Seguro que quieres eliminar este producto? Esta acción no se puede deshacer.")) {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        loadProducts();
    }
}

// --- NAVEGACIÓN Y LOGOUT ---
function switchTab(tab) {
    if (tab === 'orders') {
        document.getElementById('section-orders').classList.remove('hidden');
        document.getElementById('section-products').classList.add('hidden');
        document.getElementById('tab-orders').className = "px-4 py-2 text-indigo-600 border-b-2 border-indigo-600 font-bold";
        document.getElementById('tab-products').className = "px-4 py-2 text-gray-500 hover:text-indigo-600 font-bold transition";
    } else {
        document.getElementById('section-orders').classList.add('hidden');
        document.getElementById('section-products').classList.remove('hidden');
        document.getElementById('tab-products').className = "px-4 py-2 text-indigo-600 border-b-2 border-indigo-600 font-bold";
        document.getElementById('tab-orders').className = "px-4 py-2 text-gray-500 hover:text-indigo-600 font-bold transition";
        loadProducts(); // Cargar productos cada vez que se entra a la pestaña
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
}

// Iniciar cargando los pedidos por defecto
loadOrders();