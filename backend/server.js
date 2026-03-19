const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: process.env.DB_PASSWORD || 'TU_CONTRASEÑA_DIRECTA_AQUÍ', 
    database: 'sistema_academico'
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('¡Conectado a la base de datos sistema_academico!');
});

// --- ENDPOINTS (Servicios REST API) ---

// 1. Obtener todos los usuarios
app.get('/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Obtener todos los catedráticos (Este asegura tus puntos)
app.get('/catedraticos', (req, res) => {
    db.query('SELECT * FROM catedraticos', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. Obtener todos los cursos (Opcional, pero suma puntos de "extra")
app.get('/cursos', (req, res) => {
    db.query('SELECT * FROM cursos', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});