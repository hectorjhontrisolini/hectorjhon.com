const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'tu_clave_secreta_super_segura_123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- BASE DE DATOS ---
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'client'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_email TEXT,
        items TEXT,
        total REAL,
        status TEXT DEFAULT 'Pendiente',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.get(`SELECT * FROM users WHERE role = 'admin'`, (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`, ['admin@lumina.com', hash, 'admin']);
            console.log('✅ Admin por defecto creado: admin@lumina.com / admin123');
        }
    });
});

// --- AUTH ---
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Acceso denegado. Inicia sesión.' });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requiere permisos de administrador' });
    next();
};

// --- RUTAS AUTH ---
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (email, password, role) VALUES (?, ?, 'client')`, [email, hash], function(err) {
            if (err) return res.status(400).json({ error: 'El correo ya está registrado' });
            res.status(201).json({ message: 'Usuario registrado exitosamente' });
        });
    } catch (e) { res.status(500).json({ error: 'Error en el servidor' }); }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Contraseña incorrecta' });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '2h' });
        res.cookie('token', token, { httpOnly: true, secure: false });
        res.json({ message: 'Login exitoso', role: user.role });
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada' });
});

// --- RUTAS PEDIDOS ---
app.get('/api/orders', authenticateToken, isAdmin, (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/orders/:id', authenticateToken, isAdmin, (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Estado actualizado' });
    });
});

app.post('/api/orders', (req, res) => {
    const { email, items, total } = req.body;
    db.run(`INSERT INTO orders (client_email, items, total, status) VALUES (?, ?, ?, 'Pendiente')`, 
        [email || 'Invitado', JSON.stringify(items), total], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Pedido creado', id: this.lastID });
    });
});

// Páginas
app.get('/admin', authenticateToken, isAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});