-- Base de Datos: PREDICEX (PostgreSQL)

-- 1. Subsistema de Homologación de Proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social VARCHAR(255) NOT NULL, 
    rnc VARCHAR(20) UNIQUE NOT NULL, 
    direccion_fisica TEXT, 
    geolocalizacion VARCHAR(255), 
    telefono VARCHAR(20), 
    correo_electronico VARCHAR(150), 
    estado VARCHAR(20) CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido')) DEFAULT 'Activo' 
);

-- Sucursales (Implícito por el modelo multisucursal para la distribución) 
CREATE TABLE sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT
);

-- 2. Módulo Central de Productos e Inventarios
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL, 
    codigo_barra VARCHAR(100) UNIQUE, 
    descripcion_tecnica TEXT NOT NULL, 
    categoria VARCHAR(100) 
);

CREATE TABLE inventarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE CASCADE,
    stock_neto INT DEFAULT 0,
    umbral_alerta INT DEFAULT 10, 
    UNIQUE(producto_id, sucursal_id)
);

-- 3. Módulo de Gestión y Fiscalización de Órdenes de Abastecimiento (Compras)
CREATE TABLE ordenes_abastecimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID REFERENCES proveedores(id),
    sucursal_destino_id UUID REFERENCES sucursales(id), 
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion TIMESTAMP, 
    rnc_proveedor VARCHAR(20), 
    ncf VARCHAR(20), 
    telefono_logistico VARCHAR(20) 
);

CREATE TABLE detalle_ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID REFERENCES ordenes_abastecimiento(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id), 
    cantidad_fisica INT NOT NULL CHECK (cantidad_fisica > 0), 
    costo_unitario_base DECIMAL(10,2) NOT NULL, 
    impuestos_aplicados DECIMAL(10,2) DEFAULT 0 
);

-- 4. Módulo de Procesamiento de Despachos y Salidas (Consumo/Ventas)
CREATE TABLE despachos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_origen_id UUID REFERENCES sucursales(id),
    solicitante_cliente VARCHAR(255) NOT NULL,
    fecha_salida TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    rnc_cliente VARCHAR(20), 
    ncf_corporativo VARCHAR(20) 
);

CREATE TABLE detalle_despachos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despacho_id UUID REFERENCES despachos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad_neta INT NOT NULL CHECK (cantidad_neta > 0) 
);

-- 5. Historial Completo y Logs de Auditoría 
CREATE TABLE historial_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id),
    sucursal_id UUID REFERENCES sucursales(id),
    tipo_movimiento VARCHAR(20) CHECK (tipo_movimiento IN ('Entrada', 'Salida', 'Transferencia')),
    cantidad INT NOT NULL,
    referencia_origen_id UUID, 
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);