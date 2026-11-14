-- Script de Base de Datos para Sistema de Estacionamiento de Vehículos
-- Motor: PostgreSQL

-- 1. Tabla de Tarifas por tipo de vehículo
CREATE TABLE IF NOT EXISTS tarifas (
    id SERIAL PRIMARY KEY,
    tipo_vehiculo VARCHAR(30) NOT NULL UNIQUE, -- 'Auto', 'Moto', 'Camioneta'
    precio_hora NUMERIC(10, 2) NOT NULL,
    precio_minuto NUMERIC(10, 2) NOT NULL,
    precio_mensualidad NUMERIC(10, 2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    ci_nit VARCHAR(25) NOT NULL UNIQUE,
    telefono VARCHAR(25),
    email VARCHAR(100),
    direccion TEXT,
    es_mensualidad BOOLEAN DEFAULT FALSE,
    fecha_inicio_mensualidad DATE,
    fecha_fin_mensualidad DATE,
    monto_mensualidad NUMERIC(10, 2) DEFAULT 0,
    estado_mensualidad VARCHAR(20) DEFAULT 'Sin Mensualidad', -- 'Al Día', 'Vencido', 'Sin Mensualidad'
    activo BOOLEAN DEFAULT TRUE, -- Borrado lógico
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(15) NOT NULL UNIQUE,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    color VARCHAR(30),
    tipo VARCHAR(30) NOT NULL, -- 'Auto', 'Moto', 'Camioneta'
    cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL, -- Propietario (opcional si es visitante)
    activo BOOLEAN DEFAULT TRUE, -- Borrado lógico
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Celdas / Espacios de Estacionamiento
CREATE TABLE IF NOT EXISTS celdas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- Ej: 'P1-S1-01'
    piso VARCHAR(20) NOT NULL,          -- Ej: 'Piso 1'
    sector VARCHAR(30) NOT NULL,        -- Ej: 'Sector A', 'Sector Norte'
    tipo_permitido VARCHAR(30) DEFAULT 'Auto', -- 'Auto', 'Moto', 'Camioneta', 'Mixto'
    estado VARCHAR(20) DEFAULT 'Disponible', -- 'Disponible', 'Ocupada', 'Mantenimiento'
    activo BOOLEAN DEFAULT TRUE, -- Borrado lógico
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Registros de Entrada y Salida (Operativa)
CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    ticket_numero VARCHAR(30) NOT NULL UNIQUE,
    placa VARCHAR(15) NOT NULL,
    tipo_vehiculo VARCHAR(30) NOT NULL,
    celda_id INT REFERENCES celdas(id),
    cliente_id INT REFERENCES clientes(id),
    fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_salida TIMESTAMP,
    tiempo_minutos INT DEFAULT 0,
    tarifa_tipo VARCHAR(20) DEFAULT 'Por Hora', -- 'Por Hora', 'Por Minuto', 'Mensualidad'
    monto_total NUMERIC(10, 2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'En Curso', -- 'En Curso', 'Finalizado', 'Anulado'
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Caja y Cobros (Transacciones)
CREATE TABLE IF NOT EXISTS transacciones_caja (
    id SERIAL PRIMARY KEY,
    registro_id INT REFERENCES registros(id),
    cliente_id INT REFERENCES clientes(id),
    concepto VARCHAR(100) NOT NULL, -- 'Cobro de Estacionamiento', 'Pago de Mensualidad', etc.
    metodo_pago VARCHAR(30) NOT NULL, -- 'Efectivo', 'Simulación QR'
    monto NUMERIC(10, 2) NOT NULL,
    monto_recibido NUMERIC(10, 2) DEFAULT 0,
    cambio NUMERIC(10, 2) DEFAULT 0,
    comprobante_numero VARCHAR(30) UNIQUE,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de tarifas iniciales
INSERT INTO tarifas (tipo_vehiculo, precio_hora, precio_minuto, precio_mensualidad)
VALUES 
    ('Auto', 10.00, 0.20, 300.00),
    ('Moto', 5.00, 0.10, 150.00),
    ('Camioneta', 15.00, 0.30, 400.00)
ON CONFLICT (tipo_vehiculo) DO NOTHING;

-- Inserción de celdas iniciales (Piso 1 y Piso 2)
INSERT INTO celdas (codigo, piso, sector, tipo_permitido, estado)
VALUES
    ('P1-A01', 'Piso 1', 'Sector A', 'Auto', 'Disponible'),
    ('P1-A02', 'Piso 1', 'Sector A', 'Auto', 'Disponible'),
    ('P1-A03', 'Piso 1', 'Sector A', 'Auto', 'Disponible'),
    ('P1-A04', 'Piso 1', 'Sector A', 'Camioneta', 'Disponible'),
    ('P1-B01', 'Piso 1', 'Sector B', 'Moto', 'Disponible'),
    ('P1-B02', 'Piso 1', 'Sector B', 'Moto', 'Disponible'),
    ('P2-A01', 'Piso 2', 'Sector A', 'Auto', 'Disponible'),
    ('P2-A02', 'Piso 2', 'Sector A', 'Auto', 'Disponible'),
    ('P2-B01', 'Piso 2', 'Sector B', 'Auto', 'Disponible'),
    ('P2-B02', 'Piso 2', 'Sector B', 'Moto', 'Disponible')
ON CONFLICT (codigo) DO NOTHING;
