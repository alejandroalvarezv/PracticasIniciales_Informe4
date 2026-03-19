const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a tu base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'mysql', // <--- CAMBIA ESTO POR TU CLAVE DE MYSQL
    database: 'sistema_academico'
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('¡Conectado a la base de datos sistema_academico!');
});

// Ruta de prueba para ver tus usuarios (como Ximena o Alexander)
app.get('/usuarios', (err, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});