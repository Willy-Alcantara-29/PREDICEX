# Informe de Avance Inicial - PREDICEX

## 1. Capturas del login, dashboard o modulo inicial

Estado actual: frontend inicial incorporado en `src/frontend/index.html`.

Para la primera entrega visual se deben incluir capturas de las pantallas principales del sistema:

- Login: pantalla de autenticacion de usuarios con campos de correo, contrasena y accion de ingreso.
- Dashboard: panel inicial con indicadores de inventario, alertas de stock, movimientos recientes y resumen de compras/despachos.
- Modulo inicial: vista base para proveedores, productos o inventario multisucursal, segun el primer modulo desarrollado por el equipo.

Ubicacion sugerida para guardar las capturas:

- `assets/capturas/login.png`
- `assets/capturas/dashboard.png`
- `assets/capturas/modulo-inicial.png`

Estas capturas pueden tomarse abriendo `src/frontend/index.html` en el navegador. La primera version incluye login, dashboard operativo, inventario multisucursal y proveedores homologados.

## 2. Explicacion del backend

El backend de PREDICEX se plantea con NestJS y TypeScript, siguiendo una arquitectura modular. Cada modulo debe separar responsabilidades en controladores, servicios, entidades/DTO y acceso a datos.

### Controladores

Los controladores reciben las peticiones HTTP de la API REST y exponen las rutas del sistema. Su responsabilidad principal es validar la entrada inicial, delegar la logica al servicio correspondiente y devolver una respuesta estructurada.

Ejemplos previstos:

- `AuthController`: login, validacion de credenciales y emision de JWT.
- `ProveedoresController`: registro, consulta, actualizacion y cambio de estado de proveedores.
- `ProductosController`: gestion del catalogo de productos, SKU y codigos de barra.
- `InventariosController`: consulta de existencias por producto y sucursal.
- `OrdenesAbastecimientoController`: registro de compras y recepciones.
- `DespachosController`: registro de salidas y descuento de inventario.

### Servicios

Los servicios contienen la logica de negocio. En PREDICEX deben encargarse de aplicar reglas como validacion de RNC/NCF, actualizacion sincronica del stock, generacion de movimientos de auditoria y deteccion de alertas por umbral minimo.

Ejemplos previstos:

- `ProveedoresService`: administra proveedores y verifica duplicidad de RNC.
- `InventariosService`: calcula stock disponible, entradas, salidas y alertas.
- `OrdenesAbastecimientoService`: registra compras y aumenta existencias al confirmar recepcion.
- `DespachosService`: valida disponibilidad y descuenta inventario cuando la salida es aprobada.
- `PrediccionService`: recibe resultados del motor Python y publica sugerencias de reabastecimiento.

### Persistencia y entidades

La base de datos inicial esta definida en `src/database/init.sql` y contempla las tablas principales:

- `proveedores`
- `sucursales`
- `productos`
- `inventarios`
- `ordenes_abastecimiento`
- `detalle_ordenes`
- `despachos`
- `detalle_despachos`
- `historial_movimientos`

Estas tablas deben mapearse posteriormente mediante Prisma o TypeORM, segun la decision final del equipo.

## 3. Primeras rutas o endpoints funcionando

Estado actual: primeras rutas funcionales implementadas en `src/backend/server.js` con Node.js nativo. Esta implementacion sirve como backend inicial de demostracion y puede migrarse posteriormente a NestJS.

Endpoints iniciales recomendados para validar el funcionamiento del backend:

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/proveedores` | Lista proveedores registrados. |
| `POST` | `/proveedores` | Crea un proveedor con RNC, contacto y estado. |
| `GET` | `/productos` | Lista el catalogo de productos. |
| `POST` | `/productos` | Registra un producto con SKU y categoria. |
| `GET` | `/inventarios` | Consulta existencias generales. |
| `GET` | `/inventarios?alertas=true` | Consulta productos por debajo del umbral de alerta. |

Criterio minimo de funcionamiento:

- El servidor debe responder correctamente en una ruta de salud, por ejemplo `GET /health`.
- Los endpoints de lectura deben devolver JSON.
- Los endpoints de escritura deben validar datos obligatorios.
- Las operaciones avanzadas de compra, despacho e historial quedan pendientes para la version NestJS.

## 4. Pruebas basicas

Estado actual: pendientes de implementacion.

Pruebas iniciales sugeridas:

- Prueba de salud del backend: validar que `GET /health` responda estado `200`.
- Prueba de creacion de proveedor: validar que un proveedor con RNC unico se guarde correctamente.
- Prueba de validacion de proveedor duplicado: impedir dos proveedores con el mismo RNC.
- Prueba de creacion de producto: validar SKU obligatorio y unico.
- Prueba de entrada de inventario: al registrar una orden recibida, el stock debe aumentar.
- Prueba de salida de inventario: al registrar un despacho valido, el stock debe disminuir.
- Prueba de stock insuficiente: impedir despachos cuando no exista inventario disponible.
- Prueba de historial: cada entrada o salida debe crear un registro en `historial_movimientos`.

Herramientas recomendadas:

- Jest para pruebas unitarias del backend NestJS.
- Supertest para pruebas de endpoints HTTP.
- Scripts SQL o migraciones controladas para preparar datos de prueba.
- Postman o Thunder Client para pruebas manuales tempranas.

## 5. Observaciones tecnicas

- El repositorio ya cuenta con una estructura base para `src/backend`, `src/frontend`, `src/database`, `tests/backend`, `tests/frontend`, `docs` y `assets`.
- Actualmente el backend y frontend aun no contienen implementacion funcional; solo existen archivos `.gitkeep` para conservar la estructura de carpetas.
- El archivo `src/database/init.sql` define un primer modelo relacional coherente con los modulos principales del proyecto.
- Antes de iniciar la API se debe elegir formalmente entre Prisma y TypeORM para evitar duplicidad en la capa de persistencia.
- Es recomendable crear primero el modulo de autenticacion y una ruta `GET /health` para validar despliegue y pruebas automatizadas.
- Las validaciones fiscales de RNC y NCF deben centralizarse en utilidades o servicios compartidos para no repetir logica en compras, despachos y proveedores.
- Las operaciones que modifiquen inventario deben ejecutarse dentro de transacciones de base de datos para evitar inconsistencias por concurrencia.
- El motor predictivo en Python debe integrarse mediante una interfaz clara: API interna, job programado o intercambio controlado de archivos/resultados.
- Las capturas del login, dashboard y modulo inicial deben versionarse en `assets/capturas` una vez exista el primer prototipo visual.
