const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3001; 
const SECRET = 'clave_super_secreta_demo'; 

app.use(cors());
app.use(express.json());

// --- CONEXIÓN A BASE DE DATOS ---
const db = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: process.env.DB_PASSWORD || 'mysql', 
    database: 'sistema_academico', // Tu DB
    waitForConnections: true,
    connectionLimit: 10
});


app.post('/api/auth/registro', async (req, res) => {
    const { registro, nombres, apellidos, correo, contrasena } = req.body;
    try {
        const hash = await bcrypt.hash(contrasena, 10);
        await db.execute(
            'INSERT INTO usuarios (registro, nombres, apellidos, correo, contrasena) VALUES (?,?,?,?,?)',
            [registro, nombres, apellidos, correo, hash]
        );
        res.status(201).json({ mensaje: 'Usuario creado con éxito' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al registrar: ' + err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { registro, contrasena } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE registro = ?', [registro]);
        const usuario = rows[0];

        if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: usuario.id, registro: usuario.registro, nombres: usuario.nombres },
            SECRET,
            { expiresIn: '8h' }
        );

        res.json({ 
            token, 
            usuario: { 
                id: usuario.id, 
                nombres: usuario.nombres, 
                registro: usuario.registro 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/cursos', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM cursos ORDER BY nombre');
    res.json(rows);
});

app.get('/api/catedraticos', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM catedraticos ORDER BY nombre');
    res.json(rows);
});

app.get('/api/publicaciones', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, u.nombres, u.apellidos, u.registro
            FROM publicaciones p
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.creado_en DESC
        `);
        res.json(rows);
    } catch (err) {
        res.json([]); 
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor adaptado corriendo en http://localhost:${PORT}`);
});