IF DB_ID(N'PREDICEX') IS NULL
BEGIN
    CREATE DATABASE PREDICEX;
END
GO

USE PREDICEX;
GO

IF OBJECT_ID(N'dbo.proveedores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.proveedores (
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        razon_social NVARCHAR(255) NOT NULL,
        rnc VARCHAR(20) NOT NULL UNIQUE,
        telefono VARCHAR(30) NULL,
        correo_electronico NVARCHAR(150) NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'Activo'
    );
END
GO

IF OBJECT_ID(N'dbo.productos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.productos (
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        sku VARCHAR(50) NOT NULL UNIQUE,
        codigo_barra VARCHAR(100) NULL,
        descripcion NVARCHAR(255) NOT NULL,
        categoria NVARCHAR(100) NOT NULL DEFAULT 'Sin categoria',
        precio DECIMAL(12,2) NOT NULL DEFAULT 0,
        estado VARCHAR(20) NOT NULL DEFAULT 'Activo'
    );
END
GO

IF COL_LENGTH('dbo.productos', 'precio') IS NULL
BEGIN
    ALTER TABLE dbo.productos ADD precio DECIMAL(12,2) NOT NULL CONSTRAINT DF_productos_precio DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.productos', 'estado') IS NULL
BEGIN
    ALTER TABLE dbo.productos ADD estado VARCHAR(20) NOT NULL CONSTRAINT DF_productos_estado DEFAULT 'Activo';
END
GO

IF OBJECT_ID(N'dbo.sucursales', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sucursales (
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        nombre NVARCHAR(150) NOT NULL UNIQUE
    );
END
GO

IF OBJECT_ID(N'dbo.inventarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventarios (
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        producto_id VARCHAR(20) NOT NULL,
        sucursal_id VARCHAR(20) NOT NULL,
        stock_neto INT NOT NULL DEFAULT 0,
        umbral_alerta INT NOT NULL DEFAULT 10,
        precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
        actualizado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_inventarios_productos FOREIGN KEY (producto_id) REFERENCES dbo.productos(id) ON DELETE CASCADE,
        CONSTRAINT FK_inventarios_sucursales FOREIGN KEY (sucursal_id) REFERENCES dbo.sucursales(id) ON DELETE CASCADE,
        CONSTRAINT UQ_inventarios_producto_sucursal UNIQUE (producto_id, sucursal_id)
    );
END
GO

IF COL_LENGTH('dbo.inventarios', 'precio_unitario') IS NULL
BEGIN
    ALTER TABLE dbo.inventarios ADD precio_unitario DECIMAL(12,2) NOT NULL CONSTRAINT DF_inventarios_precio_unitario DEFAULT 0;
END
GO

IF OBJECT_ID(N'dbo.movimientos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.movimientos (
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        tipo VARCHAR(30) NOT NULL,
        sku VARCHAR(50) NOT NULL,
        producto NVARCHAR(255) NOT NULL,
        sucursal_origen NVARCHAR(150) NULL,
        sucursal_destino NVARCHAR(150) NULL,
        cantidad INT NOT NULL,
        nota NVARCHAR(255) NULL,
        creado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.proveedores WHERE id = 'prov-001')
BEGIN
    INSERT INTO dbo.proveedores (id, razon_social, rnc, telefono, correo_electronico, estado)
    VALUES ('prov-001', N'Distribuidora Caribe SRL', '131245678', '809-555-0142', N'compras@caribe.example', 'Activo');
END
IF NOT EXISTS (SELECT 1 FROM dbo.proveedores WHERE id = 'prov-002')
BEGIN
    INSERT INTO dbo.proveedores (id, razon_social, rnc, telefono, correo_electronico, estado)
    VALUES ('prov-002', N'Suplidores del Norte', '101334455', '809-555-0188', N'ventas@norte.example', 'Activo');
END
IF NOT EXISTS (SELECT 1 FROM dbo.proveedores WHERE id = 'prov-003')
BEGIN
    INSERT INTO dbo.proveedores (id, razon_social, rnc, telefono, correo_electronico, estado)
    VALUES ('prov-003', N'Importadora Duarte', '130778899', '809-555-0120', N'ordenes@duarte.example', 'Inactivo');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE id = 'prd-001')
BEGIN
    INSERT INTO dbo.productos (id, sku, codigo_barra, descripcion, categoria, precio, estado)
    VALUES ('prd-001', 'SKU-PRD-018', '746000000018', N'Arroz premium 25 lb', N'Alimentos', 185.00, 'Activo');
END
IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE id = 'prd-002')
BEGIN
    INSERT INTO dbo.productos (id, sku, codigo_barra, descripcion, categoria, precio, estado)
    VALUES ('prd-002', 'SKU-PRD-104', '746000000104', N'Aceite vegetal 1 gal', N'Alimentos', 325.00, 'Activo');
END
IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE id = 'prd-003')
BEGIN
    INSERT INTO dbo.productos (id, sku, codigo_barra, descripcion, categoria, precio, estado)
    VALUES ('prd-003', 'SKU-PRD-210', '746000000210', N'Detergente industrial 5 kg', N'Limpieza', 480.00, 'Activo');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.sucursales WHERE id = 'suc-001')
BEGIN
    INSERT INTO dbo.sucursales (id, nombre) VALUES ('suc-001', N'Sucursal Norte');
END
IF NOT EXISTS (SELECT 1 FROM dbo.sucursales WHERE id = 'suc-002')
BEGIN
    INSERT INTO dbo.sucursales (id, nombre) VALUES ('suc-002', N'Almacen Central');
END
IF NOT EXISTS (SELECT 1 FROM dbo.sucursales WHERE id = 'suc-003')
BEGIN
    INSERT INTO dbo.sucursales (id, nombre) VALUES ('suc-003', N'Sucursal Este');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.inventarios WHERE id = 'inv-001')
BEGIN
    INSERT INTO dbo.inventarios (id, producto_id, sucursal_id, stock_neto, umbral_alerta, precio_unitario)
    VALUES ('inv-001', 'prd-001', 'suc-001', 8, 20, 185.00);
END
IF NOT EXISTS (SELECT 1 FROM dbo.inventarios WHERE id = 'inv-002')
BEGIN
    INSERT INTO dbo.inventarios (id, producto_id, sucursal_id, stock_neto, umbral_alerta, precio_unitario)
    VALUES ('inv-002', 'prd-002', 'suc-002', 240, 60, 325.00);
END
IF NOT EXISTS (SELECT 1 FROM dbo.inventarios WHERE id = 'inv-003')
BEGIN
    INSERT INTO dbo.inventarios (id, producto_id, sucursal_id, stock_neto, umbral_alerta, precio_unitario)
    VALUES ('inv-003', 'prd-003', 'suc-003', 34, 30, 480.00);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.movimientos WHERE id = 'mov-001')
BEGIN
    INSERT INTO dbo.movimientos (id, tipo, sku, producto, sucursal_origen, sucursal_destino, cantidad, nota)
    VALUES ('mov-001', 'Entrada', 'SKU-PRD-104', N'Aceite vegetal 1 gal', N'Proveedor', N'Almacen Central', 120, N'Recepcion de compra');
END
IF NOT EXISTS (SELECT 1 FROM dbo.movimientos WHERE id = 'mov-002')
BEGIN
    INSERT INTO dbo.movimientos (id, tipo, sku, producto, sucursal_origen, sucursal_destino, cantidad, nota)
    VALUES ('mov-002', 'Salida', 'SKU-PRD-018', N'Arroz premium 25 lb', N'Sucursal Norte', N'Cliente', 12, N'Despacho operativo');
END
IF NOT EXISTS (SELECT 1 FROM dbo.movimientos WHERE id = 'mov-003')
BEGIN
    INSERT INTO dbo.movimientos (id, tipo, sku, producto, sucursal_origen, sucursal_destino, cantidad, nota)
    VALUES ('mov-003', 'Transferencia', 'SKU-PRD-210', N'Detergente industrial 5 kg', N'Almacen Central', N'Sucursal Este', 18, N'Balance multisucursal');
END
GO

UPDATE dbo.productos SET precio = 185.00 WHERE id = 'prd-001' AND precio = 0;
UPDATE dbo.productos SET precio = 325.00 WHERE id = 'prd-002' AND precio = 0;
UPDATE dbo.productos SET precio = 480.00 WHERE id = 'prd-003' AND precio = 0;
GO

IF OBJECT_ID(N'dbo.clientes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.clientes (
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        nombre NVARCHAR(180) NOT NULL,
        documento VARCHAR(30) NOT NULL UNIQUE,
        telefono VARCHAR(30) NULL,
        correo NVARCHAR(150) NULL,
        direccion NVARCHAR(255) NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'Activo'
    );
END
GO

IF OBJECT_ID(N'dbo.prestamos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.prestamos (
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        cliente_id VARCHAR(20) NOT NULL,
        monto DECIMAL(14,2) NOT NULL,
        tasa DECIMAL(8,2) NOT NULL DEFAULT 0,
        plazo_meses INT NOT NULL,
        balance_pendiente DECIMAL(14,2) NOT NULL DEFAULT 0,
        estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
        fecha DATE NOT NULL DEFAULT CONVERT(date, SYSDATETIME()),
        CONSTRAINT FK_prestamos_clientes FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id)
    );
END
GO

IF OBJECT_ID(N'dbo.pagos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.pagos (
        id VARCHAR(20) NOT NULL PRIMARY KEY,
        prestamo_id VARCHAR(20) NOT NULL,
        monto DECIMAL(14,2) NOT NULL,
        metodo VARCHAR(40) NOT NULL,
        referencia VARCHAR(80) NULL,
        fecha DATE NOT NULL DEFAULT CONVERT(date, SYSDATETIME()),
        estado VARCHAR(20) NOT NULL DEFAULT 'Aplicado',
        CONSTRAINT FK_pagos_prestamos FOREIGN KEY (prestamo_id) REFERENCES dbo.prestamos(id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.clientes WHERE id = 'cli-001')
BEGIN
    INSERT INTO dbo.clientes (id, nombre, documento, telefono, correo, direccion, estado)
    VALUES ('cli-001', N'Maria Gonzalez', '001-1234567-8', '809-555-1100', N'maria.gonzalez@example.com', N'Santo Domingo Norte', 'Activo');
END
IF NOT EXISTS (SELECT 1 FROM dbo.clientes WHERE id = 'cli-002')
BEGIN
    INSERT INTO dbo.clientes (id, nombre, documento, telefono, correo, direccion, estado)
    VALUES ('cli-002', N'Carlos Ramirez', '001-9876543-2', '809-555-2200', N'carlos.ramirez@example.com', N'Santiago', 'Activo');
END
IF NOT EXISTS (SELECT 1 FROM dbo.clientes WHERE id = 'cli-003')
BEGIN
    INSERT INTO dbo.clientes (id, nombre, documento, telefono, correo, direccion, estado)
    VALUES ('cli-003', N'Ana Perez', '402-1122334-5', '809-555-3300', N'ana.perez@example.com', N'La Vega', 'Inactivo');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.prestamos WHERE id = 'pre-001')
BEGIN
    INSERT INTO dbo.prestamos (id, cliente_id, monto, tasa, plazo_meses, balance_pendiente, estado, fecha)
    VALUES ('pre-001', 'cli-001', 85000, 14, 12, 64200, 'Activo', '2026-06-10');
END
IF NOT EXISTS (SELECT 1 FROM dbo.prestamos WHERE id = 'pre-002')
BEGIN
    INSERT INTO dbo.prestamos (id, cliente_id, monto, tasa, plazo_meses, balance_pendiente, estado, fecha)
    VALUES ('pre-002', 'cli-002', 120000, 12, 18, 98000, 'Activo', '2026-06-18');
END
IF NOT EXISTS (SELECT 1 FROM dbo.prestamos WHERE id = 'pre-003')
BEGIN
    INSERT INTO dbo.prestamos (id, cliente_id, monto, tasa, plazo_meses, balance_pendiente, estado, fecha)
    VALUES ('pre-003', 'cli-003', 45000, 10, 6, 0, 'Cerrado', '2026-05-20');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.pagos WHERE id = 'pag-001')
BEGIN
    INSERT INTO dbo.pagos (id, prestamo_id, monto, metodo, referencia, fecha, estado)
    VALUES ('pag-001', 'pre-001', 7200, 'Transferencia', 'TRX-10021', '2026-07-01', 'Aplicado');
END
IF NOT EXISTS (SELECT 1 FROM dbo.pagos WHERE id = 'pag-002')
BEGIN
    INSERT INTO dbo.pagos (id, prestamo_id, monto, metodo, referencia, fecha, estado)
    VALUES ('pag-002', 'pre-002', 9500, 'Efectivo', 'CAJA-221', '2026-07-02', 'Aplicado');
END
IF NOT EXISTS (SELECT 1 FROM dbo.pagos WHERE id = 'pag-003')
BEGIN
    INSERT INTO dbo.pagos (id, prestamo_id, monto, metodo, referencia, fecha, estado)
    VALUES ('pag-003', 'pre-001', 6800, 'Tarjeta', 'POS-4419', '2026-07-03', 'Pendiente');
END
GO
