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
    database: 'sistema_academico',
    waitForConnections: true,
    connectionLimit: 10
});

// --- MIDDLEWARE PARA VERIFICAR TOKEN ---
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token no válido' });
        req.user = user;
        next();
    });
};

// --- AUTH: REGISTRO ---
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

// --- AUTH: LOGIN ---
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
                apellidos: usuario.apellidos,
                correo: usuario.correo,
                registro: usuario.registro 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// --- RESET PASSWORD ---
app.post('/api/auth/reset-password', async (req, res) => {
    const { registro, correo, nuevaContrasena } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM usuarios WHERE registro = ? AND correo = ?', 
            [registro, correo]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Los datos no coinciden.' });
        const nuevoHash = await bcrypt.hash(nuevaContrasena, 10);
        await db.execute('UPDATE usuarios SET contrasena = ? WHERE registro = ?', [nuevoHash, registro]);
        res.json({ mensaje: 'Contraseña actualizada con éxito.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al procesar la solicitud.' });
    }
});

// --- CURSOS Y CATEDRÁTICOS ---
app.get('/api/cursos', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM cursos ORDER BY nombre');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener cursos' });
    }
});

app.get('/api/catedraticos', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM catedraticos ORDER BY nombre');
    res.json(rows);
});

// --- PUBLICACIONES: OBTENER ---
app.get('/api/publicaciones', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT p.*, 
                   CONCAT(u.nombres, ' ', u.apellidos) AS autor_nombre,
                   COALESCE(c.nombre, cat.nombre) AS referencia_nombre
            FROM publicaciones p
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN cursos c ON p.tipo = 'curso' AND p.referencia_id = c.id
            LEFT JOIN catedraticos cat ON p.tipo = 'catedratico' AND p.referencia_id = cat.id
            ORDER BY p.creado_en DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.json([]); 
    }
});

// --- PUBLICACIONES: CREAR ---
app.post('/api/publicaciones', verificarToken, async (req, res) => {
    const { tipo, referencia_id, mensaje } = req.body;
    const usuario_id = req.user.id; 

    if (!tipo || !referencia_id || !mensaje) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        await db.execute(
            'INSERT INTO publicaciones (usuario_id, tipo, referencia_id, mensaje) VALUES (?, ?, ?, ?)',
            [usuario_id, tipo, referencia_id, mensaje]
        );
        res.status(201).json({ mensaje: 'Publicación creada exitosamente' });
    } catch (err) {
        console.error("Error SQL:", err);
        res.status(500).json({ error: 'Error en la BD: ' + err.message });
    }
});

// --- COMENTARIOS: OBTENER ---
app.get('/api/publicaciones/:id/comentarios', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT c.id, c.publicacion_id, c.usuario_id, c.mensaje, c.creado_en, 
                   CONCAT(u.nombres, ' ', u.apellidos) AS autor_nombre
            FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.publicacion_id = ?
            ORDER BY c.creado_en ASC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener comentarios' });
    }
});

// --- COMENTARIOS: CREAR ---
app.post('/api/publicaciones/:id/comentarios', verificarToken, async (req, res) => {
    const { texto } = req.body; 
    const publicacion_id = req.params.id;
    const usuario_id = req.user.id; 

    if (!texto) return res.status(400).json({ error: 'El comentario no puede estar vacío' });

    try {
        await db.execute(
            'INSERT INTO comentarios (publicacion_id, usuario_id, mensaje) VALUES (?, ?, ?)',
            [publicacion_id, usuario_id, texto]
        );
        res.status(201).json({ mensaje: 'Comentario agregado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar el comentario' });
    }
});

// --- USUARIOS: BUSCAR POR REGISTRO ---
app.get('/api/usuarios/:registro', verificarToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, registro, nombres, apellidos, correo FROM usuarios WHERE registro = ?',
            [req.params.registro]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al buscar usuario' });
    }
});

// --- USUARIOS: ACTUALIZAR PERFIL ---
app.put('/api/usuarios/:registro', verificarToken, async (req, res) => {
    const { nombres, apellidos, correo } = req.body;
    const registroURL = req.params.registro;

    if (req.user.registro !== registroURL) {
        return res.status(403).json({ error: 'No tienes permiso para editar este perfil' });
    }

    try {
        await db.execute(
            'UPDATE usuarios SET nombres = ?, apellidos = ?, correo = ? WHERE registro = ?',
            [nombres, apellidos, correo, registroURL]
        );
        res.json({ mensaje: 'Perfil actualizado con éxito' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
});

// --- CURSOS APROBADOS: OBTENER  ---
app.get('/api/usuarios/:registro/cursos-aprobados', verificarToken, async (req, res) => {
    try {
        const [user] = await db.execute('SELECT id FROM usuarios WHERE registro = ?', [req.params.registro]);
        if (user.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        const userId = user[0].id;

        const [rows] = await db.execute(`
            SELECT c.id, c.nombre, c.creditos 
            FROM cursos_aprobados ca
            JOIN cursos c ON ca.curso_id = c.id
            WHERE ca.usuario_id = ?`, 
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener cursos' });
    }
});

// --- CURSOS APROBADOS: AGREGAR  ---
app.post('/api/usuarios/:registro/cursos-aprobados', verificarToken, async (req, res) => {
    const { curso_id } = req.body;
    const registro = req.params.registro;

    if (req.user.registro !== registro) {
        return res.status(403).json({ error: 'No puedes modificar cursos ajenos' });
    }

    try {
        await db.execute(
            'INSERT INTO cursos_aprobados (usuario_id, curso_id) VALUES (?, ?)',
            [req.user.id, curso_id]
        );
        res.json({ mensaje: 'Curso aprobado registrado' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya aprobaste este curso anteriormente' });
        }
        res.status(500).json({ error: 'Error al registrar curso' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});