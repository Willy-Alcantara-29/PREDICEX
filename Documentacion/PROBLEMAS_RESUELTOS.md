# Problemas resueltos

- Problema: El sistema podia quedar vacio si SQL Server no estaba disponible.
- Causa: El acceso a datos dependia directamente de `sqlcmd`.
- Solucion aplicada: Se agrego `supply-service` con fallback automatico a `demo-repository` y datos semilla.
- Archivos modificados: `src/backend/services/supply-service.js`, `src/backend/repositories/demo-repository.js`, `src/backend/models/seed-data.js`.
- Validacion realizada: `GET /health` reporta modo `demo` o `sqlserver` y los listados siempre devuelven datos.

- Problema: La logica SQL estaba acoplada al servidor HTTP.
- Causa: Las consultas vivian cerca de las rutas.
- Solucion aplicada: Se separaron controladores, servicios y repositorios.
- Archivos modificados: `src/backend/server.js`, `src/backend/controllers/http-controller.js`, `src/backend/repositories/sql-repository.js`.
- Validacion realizada: Las rutas publicas se mantienen y las pruebas backend cubren CRUD principal.

- Problema: Productos no tenian precio ni estado.
- Causa: El esquema inicial solo contemplaba SKU, codigo, descripcion y categoria.
- Solucion aplicada: Se agregaron campos `precio` y `estado` al modelo demo, SQL y frontend.
- Archivos modificados: `src/database/sqlserver.sql`, `src/frontend/index.html`, `src/frontend/app.js`.
- Validacion realizada: Crear y editar productos actualiza listado y Dashboard.

- Problema: Inventario no tenia flujo explicito de entrada, salida, transferencia y ajuste.
- Causa: Solo existia edicion directa del stock.
- Solucion aplicada: Se agrego endpoint `POST /inventarios/movimientos`, tabla/coleccion de movimientos y formulario de movimiento.
- Archivos modificados: `src/backend/repositories/demo-repository.js`, `src/backend/repositories/sql-repository.js`, `src/frontend/index.html`, `src/frontend/app.js`.
- Validacion realizada: Los movimientos modifican stock y aparecen en movimientos recientes.

- Problema: No existian filtros ni exportacion real para todos los listados.
- Causa: Los controles eran visuales y no estaban conectados.
- Solucion aplicada: Se conectaron busquedas, filtros y exportacion CSV compatible con Excel.
- Archivos modificados: `src/frontend/app.js`, `src/frontend/index.html`.
- Validacion realizada: Los listados se filtran en pantalla y exportan los datos visibles.

- Problema: Faltaban modulos solicitados de clientes, prestamos y pagos.
- Causa: El alcance inicial estaba centrado en inventario, proveedores y productos.
- Solucion aplicada: Se agregaron colecciones demo, tablas SQL, endpoints CRUD y vistas frontend dinamicas para los tres modulos.
- Archivos modificados: `src/backend/models/seed-data.js`, `src/backend/repositories/demo-repository.js`, `src/backend/repositories/sql-repository.js`, `src/backend/controllers/http-controller.js`, `src/backend/services/supply-service.js`, `src/frontend/app.js`, `src/database/sqlserver.sql`.
- Validacion realizada: `GET /clientes`, `GET /prestamos`, `GET /pagos` responden con datos y las pruebas backend crean cliente, prestamo y pago.

- Problema: La rubrica solicitaba DAO explicito ademas de Repository, Service, Controller y Model.
- Causa: La seleccion de repositorio estaba dentro del servicio.
- Solucion aplicada: Se creo `src/backend/dao/repository-dao.js` para resolver SQL Server o modo demostracion y el servicio quedo concentrado en validacion y reglas de negocio.
- Archivos modificados: `src/backend/dao/repository-dao.js`, `src/backend/services/supply-service.js`.
- Validacion realizada: `node --check` y `npm run test:backend` pasaron correctamente.
