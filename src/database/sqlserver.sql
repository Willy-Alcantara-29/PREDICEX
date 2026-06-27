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
        categoria NVARCHAR(100) NOT NULL DEFAULT 'Sin categoria'
    );
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
    ALTER TABLE dbo.inventarios
    ADD precio_unitario DECIMAL(12,2) NOT NULL CONSTRAINT DF_inventarios_precio_unitario DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.proveedores WHERE id = 'prov-001')
BEGIN
    INSERT INTO dbo.proveedores (id, razon_social, rnc, telefono, correo_electronico, estado)
    VALUES
    ('prov-001', N'Distribuidora Caribe SRL', '131245678', '809-555-0142', N'compras@caribe.example', 'Activo'),
    ('prov-002', N'Suplidores del Norte', '101334455', '809-555-0188', N'ventas@norte.example', 'Activo');
END

IF NOT EXISTS (SELECT 1 FROM dbo.productos WHERE id = 'prd-001')
BEGIN
    INSERT INTO dbo.productos (id, sku, codigo_barra, descripcion, categoria)
    VALUES
    ('prd-001', 'SKU-PRD-018', '746000000018', N'Arroz premium 25 lb', N'Alimentos'),
    ('prd-002', 'SKU-PRD-104', '746000000104', N'Aceite vegetal 1 gal', N'Alimentos');
END

IF NOT EXISTS (SELECT 1 FROM dbo.sucursales WHERE id = 'suc-001')
BEGIN
    INSERT INTO dbo.sucursales (id, nombre)
    VALUES
    ('suc-001', N'Sucursal Norte'),
    ('suc-002', N'Almacen Central');
END

IF NOT EXISTS (SELECT 1 FROM dbo.inventarios WHERE id = 'inv-001')
BEGIN
    INSERT INTO dbo.inventarios (id, producto_id, sucursal_id, stock_neto, umbral_alerta, precio_unitario)
    VALUES
    ('inv-001', 'prd-001', 'suc-001', 8, 20, 185.00),
    ('inv-002', 'prd-002', 'suc-002', 240, 60, 325.00);
END
GO