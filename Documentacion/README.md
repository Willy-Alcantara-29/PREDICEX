# PREDICEX Supply Control

Proyecto listo para demostracion con backend Node.js, frontend HTML/CSS/JS, integracion SQL Server y modo demostracion automatico.

## Modulos implementados

- Dashboard dinamico
- Productos
- Inventario multisucursal
- Proveedores
- Movimientos: entradas, salidas, transferencias y ajustes
- Alertas por bajo umbral
- Exportacion para Excel en listados principales

## CRUD terminados

- Productos: crear, listar, buscar, filtrar, editar, eliminar y exportar.
- Inventario: crear, listar, buscar, filtrar, editar, eliminar, registrar entrada, salida, transferencia, ajuste y exportar.
- Proveedores: crear, listar, buscar, filtrar, editar, eliminar y exportar.
- Movimientos: registro automatico y exportacion desde la logica del frontend.

## Como ejecutar

```bash
npm run db:init
npm run start:backend
```

Abrir:

```text
http://localhost:3000
```

## Como probar con base de datos

1. Verificar que SQL Server este disponible en `SQL_SERVER` o en el valor por defecto `ElerSync`.
2. Ejecutar `npm run db:init` para crear/actualizar tablas.
3. Ejecutar `npm run start:backend`.
4. Confirmar `GET /health`; debe responder `mode: sqlserver`.

## Como probar en modo demostracion

Si SQL Server no responde, el backend cae automaticamente a datos simulados persistidos en `src/database/data.json`.

Tambien se puede forzar:

```powershell
$env:PREDICEX_MODE="demo"; npm run start:backend
```

## Capturas sugeridas

- `01_Dashboard.png`
- `02_Productos_Listado.png`
- `03_Productos_Crear.png`
- `04_Productos_Editar.png`
- `05_Inventario_Listado.png`
- `06_Inventario_Entrada.png`
- `07_Inventario_Salida.png`
- `08_Inventario_Transferencia.png`
- `09_Proveedores_Listado.png`
- `10_Proveedores_Crear.png`
- `11_Exportar_Excel.png`
- `12_Dashboard_Actualizado.png`

## Modulos financieros agregados

- Clientes: registro, edicion, busqueda, filtro por estado, eliminacion y exportacion.
- Prestamos: registro por cliente, monto, tasa, plazo, balance, estado, busqueda, filtro y exportacion.
- Pagos: registro por prestamo, metodo, referencia, estado, busqueda, filtro y exportacion.

## Capturas adicionales sugeridas

- `13_Clientes_Listado.png`
- `14_Clientes_Crear.png`
- `15_Prestamos_Listado.png`
- `16_Prestamos_Crear.png`
- `17_Pagos_Listado.png`
- `18_Pagos_Crear.png`

## Arquitectura de datos

La integracion esta separada en:

- Model: `src/backend/models/seed-data.js`
- DAO: `src/backend/dao/repository-dao.js`
- Repository: `src/backend/repositories/demo-repository.js` y `src/backend/repositories/sql-repository.js`
- Service: `src/backend/services/supply-service.js`
- Controller: `src/backend/controllers/http-controller.js`

La interfaz consume endpoints HTTP y no contiene consultas SQL.
