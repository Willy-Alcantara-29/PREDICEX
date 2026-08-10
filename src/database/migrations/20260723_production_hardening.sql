-- PREDICEX production hardening migration
-- Apply: sqlcmd -S ElerSync -d PREDICEX -E -i src/database/migrations/20260723_production_hardening.sql
-- Rollback section is included at the bottom. Review before executing in production.

IF COL_LENGTH('dbo.proveedores', 'actualizado_en') IS NULL ALTER TABLE dbo.proveedores ADD actualizado_en DATETIME2 NOT NULL CONSTRAINT DF_proveedores_actualizado_en DEFAULT SYSDATETIME();
IF COL_LENGTH('dbo.productos', 'actualizado_en') IS NULL ALTER TABLE dbo.productos ADD actualizado_en DATETIME2 NOT NULL CONSTRAINT DF_productos_actualizado_en DEFAULT SYSDATETIME();
IF COL_LENGTH('dbo.clientes', 'actualizado_en') IS NULL ALTER TABLE dbo.clientes ADD actualizado_en DATETIME2 NOT NULL CONSTRAINT DF_clientes_actualizado_en DEFAULT SYSDATETIME();
IF COL_LENGTH('dbo.prestamos', 'actualizado_en') IS NULL ALTER TABLE dbo.prestamos ADD actualizado_en DATETIME2 NOT NULL CONSTRAINT DF_prestamos_actualizado_en DEFAULT SYSDATETIME();
IF COL_LENGTH('dbo.pagos', 'actualizado_en') IS NULL ALTER TABLE dbo.pagos ADD actualizado_en DATETIME2 NOT NULL CONSTRAINT DF_pagos_actualizado_en DEFAULT SYSDATETIME();
GO

IF OBJECT_ID(N'dbo.auditoria', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.auditoria (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    usuario NVARCHAR(150) NOT NULL,
    rol NVARCHAR(80) NULL,
    accion NVARCHAR(80) NOT NULL,
    modulo NVARCHAR(80) NOT NULL,
    registro_id VARCHAR(30) NULL,
    valores_anteriores NVARCHAR(MAX) NULL,
    valores_nuevos NVARCHAR(MAX) NULL,
    ip VARCHAR(80) NULL,
    resultado VARCHAR(30) NOT NULL,
    creado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END
GO

IF OBJECT_ID(N'dbo.respaldos', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.respaldos (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL,
    ubicacion NVARCHAR(500) NOT NULL,
    usuario NVARCHAR(150) NOT NULL,
    estado VARCHAR(30) NOT NULL,
    validado BIT NOT NULL DEFAULT 0,
    mensaje NVARCHAR(1000) NULL,
    creado_en DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_movimientos_sku_fecha') CREATE INDEX IX_movimientos_sku_fecha ON dbo.movimientos (sku, creado_en DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_pagos_prestamo_fecha') CREATE INDEX IX_pagos_prestamo_fecha ON dbo.pagos (prestamo_id, fecha DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_prestamos_cliente_estado') CREATE INDEX IX_prestamos_cliente_estado ON dbo.prestamos (cliente_id, estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_inventarios_sucursal_stock') CREATE INDEX IX_inventarios_sucursal_stock ON dbo.inventarios (sucursal_id, stock_neto);
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_productos_estado') ALTER TABLE dbo.productos ADD CONSTRAINT CK_productos_estado CHECK (estado IN ('Activo', 'Inactivo'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_proveedores_estado') ALTER TABLE dbo.proveedores ADD CONSTRAINT CK_proveedores_estado CHECK (estado IN ('Activo', 'Inactivo'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_clientes_estado') ALTER TABLE dbo.clientes ADD CONSTRAINT CK_clientes_estado CHECK (estado IN ('Activo', 'Inactivo'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_prestamos_estado') ALTER TABLE dbo.prestamos ADD CONSTRAINT CK_prestamos_estado CHECK (estado IN ('Activo', 'Pendiente', 'Cerrado', 'Anulado'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_pagos_estado') ALTER TABLE dbo.pagos ADD CONSTRAINT CK_pagos_estado CHECK (estado IN ('Pendiente', 'Aplicado', 'Anulado'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_inventarios_stock_no_negativo') ALTER TABLE dbo.inventarios ADD CONSTRAINT CK_inventarios_stock_no_negativo CHECK (stock_neto >= 0 AND umbral_alerta >= 0);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_prestamos_montos_validos') ALTER TABLE dbo.prestamos ADD CONSTRAINT CK_prestamos_montos_validos CHECK (monto > 0 AND tasa >= 0 AND plazo_meses > 0 AND balance_pendiente >= 0);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_pagos_monto_valido') ALTER TABLE dbo.pagos ADD CONSTRAINT CK_pagos_monto_valido CHECK (monto > 0);
GO

-- Rollback, execute manually if needed:
-- ALTER TABLE dbo.pagos DROP CONSTRAINT CK_pagos_monto_valido;
-- ALTER TABLE dbo.prestamos DROP CONSTRAINT CK_prestamos_montos_validos;
-- ALTER TABLE dbo.inventarios DROP CONSTRAINT CK_inventarios_stock_no_negativo;
-- ALTER TABLE dbo.pagos DROP CONSTRAINT CK_pagos_estado;
-- ALTER TABLE dbo.prestamos DROP CONSTRAINT CK_prestamos_estado;
-- ALTER TABLE dbo.clientes DROP CONSTRAINT CK_clientes_estado;
-- ALTER TABLE dbo.proveedores DROP CONSTRAINT CK_proveedores_estado;
-- ALTER TABLE dbo.productos DROP CONSTRAINT CK_productos_estado;
-- DROP INDEX IX_inventarios_sucursal_stock ON dbo.inventarios;
-- DROP INDEX IX_prestamos_cliente_estado ON dbo.prestamos;
-- DROP INDEX IX_pagos_prestamo_fecha ON dbo.pagos;
-- DROP INDEX IX_movimientos_sku_fecha ON dbo.movimientos;
-- DROP TABLE dbo.respaldos;
-- DROP TABLE dbo.auditoria;
