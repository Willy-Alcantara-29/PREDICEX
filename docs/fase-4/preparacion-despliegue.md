# Fase 4 - Preparacion de despliegue PREDICEX

## Pruebas de integracion

- Autenticacion: login valido, login invalido, expiracion de sesion y logout.
- Permisos: lectura, escritura, eliminacion logica, exportacion, reportes, respaldo y endpoints predictivos.
- Sucursales: crear, listar paginado, consultar por id, actualizar, duplicados y bloqueo por relaciones.
- Inventario: entrada, salida, transferencia, ajuste, stock insuficiente y concurrencia.
- Finanzas: prestamo, pago parcial, pago total, pago superior al balance y anulacion.
- Reportes: inventario, bajo stock, movimientos, transferencias, productos, proveedores, clientes, prestamos, balances y pagos.
- Predictivo: entrenamiento, metricas, alertas de stock, estado sin datos y actualizacion posterior a movimientos.

## Auditoria de seguridad

- Verificar que ningun endpoint protegido responda sin token.
- Confirmar que los permisos se validan en backend y no solo en la UI.
- Revisar que contrasenas, tokens y cabeceras Authorization no se guarden en logs ni respuestas.
- Confirmar expiracion de sesion y limpieza en logout.
- Revisar inyeccion SQL en campos de texto, filtros y busquedas.
- Validar CORS para ambiente final antes de publicar.

## Optimizacion

- Revisar indices SQL de inventarios, movimientos, pagos y prestamos.
- Medir tiempos de respuesta de listados paginados con 1k, 10k y 100k registros.
- Mantener exportaciones basadas en los mismos filtros de pantalla.
- Evitar recalculos de metricas en frontend; consumir `/metrics` y `/predictivo/metricas`.
- Evaluar cache corto para metricas si el volumen crece.

## Documentacion tecnica final

- Variables de entorno: `SQL_SERVER`, `SQL_DATABASE`, `PREDICEX_MODE`, `PREDICEX_ADMIN_EMAIL`, `PREDICEX_ADMIN_PASSWORD_HASH`, `PREDICEX_BACKUP_DIR`.
- Scripts: `npm run start:backend`, `npm run test:backend`, `npm run db:init`.
- Migraciones: aplicar scripts en `src/database/migrations` con `sqlcmd` y conservar rollback documentado.
- Respaldo: usar `POST /backups` con token administrador y validar registro en `dbo.respaldos`.
- Auditoria: revisar `src/database/audit.log`; para produccion migrar escritura directa a `dbo.auditoria`.

## Criterios de salida

- Pruebas automatizadas OK.
- Pruebas manuales responsive completadas en resoluciones objetivo.
- Backup validado con `RESTORE VERIFYONLY`.
- Auditoria revisada con eventos exitosos y fallidos.
- Reportes exportados y comparados contra listados filtrados.
- Metricas del Dashboard comparadas contra consultas SQL.
