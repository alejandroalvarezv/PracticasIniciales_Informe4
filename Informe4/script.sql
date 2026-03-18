-- Crear Base de Datos
CREATE DATABASE IF NOT EXISTS sistema_academico;
USE sistema_academico;

-- 1. Tabla Catedratico
CREATE TABLE Catedratico (
    id_catedratico VARCHAR(10) PRIMARY KEY,
    Nombres VARCHAR(250),
    Apellidos VARCHAR(250),
    Correo VARCHAR(250)
);

-- 2. Tabla Usuario
CREATE TABLE Usuario (
    id_usuario VARCHAR(10) NOT NULL,
    Registro_academico VARCHAR(10) NOT NULL,
    Nombres VARCHAR(250),
    Apellidos VARCHAR(250),
    correo VARCHAR(250),
    Contrasena VARCHAR(20),
    PRIMARY KEY (id_usuario, Registro_academico)
);

-- 3. Tabla Curso
CREATE TABLE Curso (
    id_curso VARCHAR(25) PRIMARY KEY,
    nombre_curso VARCHAR(250),
    Creditos INT,
    Area VARCHAR(250),
    id_catedratico VARCHAR(10),
    CONSTRAINT Curso_Catedratico_FK FOREIGN KEY (id_catedratico) REFERENCES Catedratico(id_catedratico)
);

-- 4. Tabla Publicacion
CREATE TABLE Publicacion (
    id_publicacion VARCHAR(250) PRIMARY KEY,
    id_usuario VARCHAR(10),
    Registro_academico VARCHAR(10),
    id_curso VARCHAR(25),
    mensaje TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT Publicacion_Usuario_FK FOREIGN KEY (id_usuario, Registro_academico) REFERENCES Usuario(id_usuario, Registro_academico),
    CONSTRAINT Publicacion_Curso_FK FOREIGN KEY (id_curso) REFERENCES Curso(id_curso)
);

-- 5. Tabla Comentario
CREATE TABLE Comentario (
    id_comentario VARCHAR(250) PRIMARY KEY,
    id_publicacion VARCHAR(250),
    mensaje TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT Comentario_Publicacion_FK FOREIGN KEY (id_publicacion) REFERENCES Publicacion(id_publicacion)
);

-- 6. Tabla Cursos Aprobados
CREATE TABLE CURSO_APROBADO (
    id_registro VARCHAR(250) PRIMARY KEY,
    id_usuario VARCHAR(10),
    Registro_academico VARCHAR(10),
    id_curso VARCHAR(25),
    fecha_aprobacion DATE,
    CONSTRAINT CA_Usuario_FK FOREIGN KEY (id_usuario, Registro_academico) REFERENCES Usuario(id_usuario, Registro_academico),
    CONSTRAINT CA_Curso_FK FOREIGN KEY (id_curso) REFERENCES Curso(id_curso)
);