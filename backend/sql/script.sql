CREATE DATABASE  sistema_academico;
USE sistema_academico;

-- ─── TABLA: usuarios ────────────────────────────────────────
CREATE TABLE usuarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  registro        VARCHAR(20)  NOT NULL UNIQUE,
  nombres         VARCHAR(80)  NOT NULL,
  apellidos       VARCHAR(80)  NOT NULL,
  correo          VARCHAR(120) NOT NULL UNIQUE,
  contrasena      VARCHAR(255) NOT NULL, 
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABLA: cursos ──────────────────────────────────────────
CREATE TABLE cursos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  creditos        INT          NOT NULL DEFAULT 5
);

-- ─── TABLA: catedraticos ────────────────────────────────────
CREATE TABLE catedraticos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL
);

-- ─── TABLA: publicaciones ───────────────────────────────────
CREATE TABLE  publicaciones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT          NOT NULL,
  tipo            ENUM('curso','catedratico') NOT NULL,
  referencia_id   INT          NOT NULL,   
  mensaje         TEXT         NOT NULL,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ─── TABLA: comentarios ─────────────────────────────────────
CREATE TABLE comentarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  publicacion_id  INT          NOT NULL,
  usuario_id      INT          NOT NULL,
  mensaje         TEXT         NOT NULL,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id),
  FOREIGN KEY (usuario_id)     REFERENCES usuarios(id)
);

-- ─── TABLA: cursos_aprobados ─────────────────────────────────
CREATE TABLE cursos_aprobados (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT NOT NULL,
  curso_id        INT NOT NULL,
  UNIQUE KEY uq_usuario_curso (usuario_id, curso_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (curso_id)   REFERENCES cursos(id)
);

-- ============================================================
--  Datos
-- ============================================================

-- Cursos 
INSERT INTO cursos (nombre, creditos) VALUES
  ('Introduccion a la programacion 2',            5),
  ('Logica de Sistemas',                       5),
  ('Practicas Iniciales',                     5),
  ('Lenguajes formales',             5);

-- Catedráticos
INSERT INTO catedraticos (nombre) VALUES
  ('Manuel Garcia'),
  ('Carmen Hernandez'),
  ('Raul Ramirez');


-- Usuarios   (contraseña real = "demo123", hasheada con bcrypt)
INSERT INTO usuarios (registro, nombres, apellidos, correo, contrasena) VALUES
  ('202359410', 'Ximena',  'Garcia',   'ximena@usac.edu.gt',  'ximena123'),
  ('202432545', 'Alexander',  'Lopez',   'Alex@usac.edu.gt',  'alex123'),
  ('202495001', 'Steven',  'Maldonado',  'Steven@usac.edu.gt',  'steven123');

-- Publicaciones 
INSERT INTO publicaciones (usuario_id, tipo, referencia_id, mensaje) VALUES
  (1, 'catedratico', 1, 'Todos los catedraticos dejan mucha tarea'),
  (2, 'curso',       3, 'IPC1 esta muy dificil'),
  (3, 'catedratico', 2, 'La Ing deja mucha tarea');

-- Comentarios 
INSERT INTO comentarios (publicacion_id, usuario_id, mensaje) VALUES
  (1, 2, 'No entendi la tarea de ayer'),
  (1, 3, 'Ya me canse de la ing'),
  (2, 1, 'Movieron el parcial para otra fecha');

-- Cursos aprobados
INSERT INTO cursos_aprobados (usuario_id, curso_id) VALUES
  (1, 1), (1, 4),
  (2, 1), (2, 2), (2, 3);