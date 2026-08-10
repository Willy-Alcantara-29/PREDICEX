# Avance 3: Integracion de Datos y Nuevos Modulos

## Proyecto

PREDICEX - Plataforma de Optimizacion de Suministro y Logistica Predictiva.

## Objetivo del avance

Verificar el funcionamiento con datos simulados persistentes, formularios conectados al backend, listados operativos y flujos completos de crear, leer, actualizar y eliminar.

## 1. Modulos adicionales

Estado: completo.

Se completaron los modulos funcionales de:

- Inventario multisucursal.
- Proveedores homologados.
- Productos.

Cada modulo incluye:

- Listado conectado al backend.
- Formulario de registro.
- Accion de edicion.
- Accion de eliminacion.
- Refresco visual despues de cada cambio.

Archivos principales:

- `src/frontend/index.html`
- `src/frontend/app.js`
- `src/frontend/styles.css`

## 2. CRUD completo

Estado: completo.

El backend implementa crear, leer, actualizar y eliminar para los modulos principales.

| Metodo | Endpoint | Descripcion |
| --- | --- | --- |
| `GET` | `/proveedores` | Lista proveedores. |
| `GET` | `/proveedores/:id` | Consulta un proveedor. |
| `POST` | `/proveedores` | Crea un proveedor. |
| `PUT` | `/proveedores/:id` | Actualiza un proveedor. |
| `DELETE` | `/proveedores/:id` | Elimina un proveedor. |
| `GET` | `/productos` | Lista productos. |
| `GET` | `/productos/:id` | Consulta un producto. |
| `POST` | `/productos` | Crea un producto. |
| `PUT` | `/productos/:id` | Actualiza un producto. |
| `DELETE` | `/productos/:id` | Elimina un producto. |
| `GET` | `/inventarios` | Lista inventarios. |
| `GET` | `/inventarios/:id` | Consulta un registro de inventario. |
| `POST` | `/inventarios` | Crea inventario. |
| `PUT` | `/inventarios/:id` | Actualiza inventario. |
| `DELETE` | `/inventarios/:id` | Elimina inventario. |
| `GET` | `/inventarios?alertas=true` | Lista inventario bajo umbral. |

## 3. Integracion con base de datos

Estado: completo para datos simulados.

Se agrego una base local persistente en formato JSON:

`src/database/data.json`

El backend lee y escribe en ese archivo para mantener los cambios realizados desde la API y desde el frontend. Tambien se conserva el esquema relacional planificado en:

`src/database/init.sql`

Esta solucion permite demostrar integracion de datos sin instalar dependencias externas. La migracion posterior a PostgreSQL puede reutilizar los mismos endpoints REST.

## 4. Flujos completos

Estado: completo.

Flujos disponibles desde la interfaz:

- Login demo.
- Dashboard con metricas calculadas desde datos del backend.
- Crear proveedor, verlo en tabla, editarlo y eliminarlo.
- Crear producto, verlo en tabla, editarlo y eliminarlo.
- Crear inventario, verlo en tabla, editarlo, simular entrada y eliminarlo.
- Consultar alertas de inventario bajo umbral.

Para ejecutar:

```bash
npm run start:backend
```

Luego abrir:

```text
src/frontend/index.html
```

## 5. Pruebas

Estado: completo.

Archivo:

`tests/backend/api.test.js`

La prueba valida:

- Salud del backend.
- Integracion con la base JSON local.
- CRUD completo de proveedores.
- CRUD completo de productos.
- CRUD completo de inventario.
- Filtro de inventario bajo umbral.

Comando:

```bash
npm run test:backend
```

Resultado esperado:

```text
Pruebas backend OK
```

## 6. Problemas resueltos

Estado: completo.

| Problema | Solucion aplicada |
| --- | --- |
| El backend solo tenia datos en memoria. | Se agrego `src/database/data.json` y funciones de lectura/escritura persistente. |
| Solo existian rutas `GET` y `POST`. | Se agregaron rutas `GET/:id`, `PUT/:id` y `DELETE/:id`. |
| El frontend no consumia la API. | Se conectaron los modulos con `fetch` hacia `http://localhost:3000`. |
| Proveedores solo se mostraban como tarjetas estaticas. | Se reemplazo por tabla con formulario y acciones CRUD. |
| No existia modulo visual de productos. | Se agrego vista Productos con formulario, tabla y acciones CRUD. |
| Las metricas del dashboard eran fijas. | Se calculan desde proveedores, productos e inventario cargados desde el backend. |
| Las pruebas cubrian solo casos iniciales. | Se ampliaron para validar crear, leer, actualizar y eliminar. |

## 7. Estado general del avance

| Elemento | Estado |
| --- | --- |
| Modulos adicionales CRUDs, listados y formularios | Completo |
| Crear, leer, actualizar y eliminar | Completo |
| Integracion con base de datos simulada | Completo |
| Frontend conectado al backend | Completo |
| Problemas resueltos documentados | Completo |
| Capturas de flujos completos | Pendiente de tomar desde el navegador |
