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
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
}
loadOrders();