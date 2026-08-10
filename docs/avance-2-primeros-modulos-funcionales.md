# Avance 2: Primeros Modulos Funcionales

## Proyecto

PREDICEX - Plataforma de Optimizacion de Suministro y Logistica Predictiva.

## Objetivo del avance

Presentar los primeros componentes funcionales del sistema PREDICEX, incluyendo la interfaz inicial, la estructura de backend, las primeras rutas REST operativas y pruebas basicas de verificacion.

## 1. Frontend inicial

Estado: implementado.

Se desarrollo una primera interfaz web ubicada en:

`src/frontend/index.html`

La interfaz incluye:

- Pantalla de login con identidad visual de PREDICEX.
- Diseno SaaS empresarial con dos columnas.
- Panel informativo con indicadores logisticos y predictivos.
- Dashboard operativo.
- Modulo inicial de inventario multisucursal.
- Modulo inicial de proveedores homologados.
- Navegacion entre Dashboard, Inventario y Proveedores.

Indicadores visibles en el login:

- Inventario Total.
- Prediccion IA: 92%.
- Sucursales Activas.
- Alertas Pendientes.
- Riesgo de rotura de stock.
- Ordenes pendientes.

## 2. Backend inicial

Estado: implementado como backend inicial de demostracion.

Archivo principal:

`src/backend/server.js`

El backend fue construido con Node.js nativo para dejar rutas funcionales sin depender todavia de instalacion de frameworks. Esta base puede migrarse posteriormente a NestJS respetando la arquitectura planificada del proyecto.

Componentes logicos incluidos:

- Manejo de rutas HTTP.
- Respuestas JSON.
- Validacion de campos requeridos.
- Control de duplicidad para proveedores por RNC.
- Control de duplicidad para productos por SKU.
- Datos iniciales en memoria para proveedores, productos e inventarios.

## 3. Primeras rutas o endpoints funcionando

Estado: implementado.

| Metodo | Endpoint | Descripcion |
| --- | --- | --- |
| `GET` | `/health` | Verifica que el backend este activo. |
| `GET` | `/proveedores` | Lista proveedores registrados. |
| `POST` | `/proveedores` | Crea un proveedor nuevo. |
| `GET` | `/productos` | Lista productos registrados. |
| `POST` | `/productos` | Crea un producto nuevo. |
| `GET` | `/inventarios` | Lista inventario disponible. |
| `GET` | `/inventarios?alertas=true` | Lista productos bajo umbral de alerta. |

Comando para ejecutar el backend:

```bash
npm run start:backend
```

URL base:

```text
http://localhost:3000
```

## 4. Pruebas basicas

Estado: implementadas y ejecutadas correctamente.

Archivo de pruebas:

`tests/backend/api.test.js`

Las pruebas validan:

- Respuesta correcta de `GET /health`.
- Listado de proveedores.
- Creacion de proveedor.
- Rechazo de proveedor duplicado por RNC.
- Listado de productos.
- Consulta de inventario en alerta.

Comando:

```bash
npm run test:backend
```

Resultado verificado:

```text
Pruebas backend OK
```

## 5. Base de datos inicial

Estado: definida a nivel SQL.

Archivo:

`src/database/init.sql`

Tablas principales definidas:

- `proveedores`
- `sucursales`
- `productos`
- `inventarios`
- `ordenes_abastecimiento`
- `detalle_ordenes`
- `despachos`
- `detalle_despachos`
- `historial_movimientos`

## 6. Observaciones tecnicas

- El frontend actual es estatico y funciona abriendo `src/frontend/index.html` en el navegador.
- El backend actual usa datos en memoria; todavia no persiste informacion en PostgreSQL.
- La estructura preparada permite migrar el backend a NestJS con controladores, servicios, DTO y ORM.
- Las rutas iniciales ya permiten demostrar comunicacion REST y validaciones basicas.
- Las capturas del login, dashboard y modulo inicial pueden tomarse desde el navegador para anexarlas como evidencia visual.

## 7. Estado general del avance

| Elemento | Estado |
| --- | --- |
| Login visual | Hecho |
| Dashboard visual | Hecho |
| Modulo inicial de inventario | Hecho |
| Modulo inicial de proveedores | Hecho |
| Explicacion del backend | Hecho |
| Primeras rutas REST | Hecho |
| Pruebas basicas | Hecho |
| Persistencia PostgreSQL conectada | Pendiente |
| Migracion formal a NestJS | Pendiente |
