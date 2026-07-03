# Flujos de demostracion

## Flujo Producto

1. Ingresar al sistema desde la pantalla de login.
2. Abrir el modulo Productos.
3. Crear un producto con SKU, descripcion, categoria, precio y estado.
4. Buscar el producto por SKU o descripcion.
5. Editar precio o estado y guardar.
6. Eliminar con confirmacion.
7. Volver al Dashboard y validar que Productos activos se actualiza.

## Flujo Inventario

1. Abrir Inventario.
2. Crear o editar un registro con SKU, producto, sucursal, stock, umbral y precio.
3. Registrar Entrada desde el formulario de movimientos.
4. Registrar Salida para descontar stock.
5. Registrar Transferencia indicando sucursal destino.
6. Registrar Ajuste para establecer un stock exacto.
7. Validar que un producto bajo umbral aparece con estado `Bajo Umbral`.
8. Confirmar que el Dashboard y movimientos recientes reflejan el cambio.

## Flujo Proveedor

1. Abrir Proveedores.
2. Crear proveedor con razon social, RNC, telefono, correo y estado.
3. Buscar por razon social, RNC o correo.
4. Editar telefono, correo o estado.
5. Cambiar estado a Activo/Inactivo.
6. Eliminar con confirmacion.

## Flujo Exportar Excel

1. Abrir Productos, Inventario o Proveedores.
2. Aplicar busqueda o filtro si se desea.
3. Presionar Exportar Excel.
4. Abrir el archivo CSV generado desde Excel.

## Flujo Cliente

1. Abrir Clientes.
2. Crear cliente con nombre, documento, telefono, correo, direccion y estado.
3. Buscar por nombre, documento o correo.
4. Filtrar por estado.
5. Editar datos y guardar.
6. Eliminar con confirmacion.

## Flujo Prestamo

1. Abrir Prestamos.
2. Seleccionar cliente.
3. Registrar monto, tasa, plazo, balance, fecha y estado.
4. Buscar por cliente o estado.
5. Editar balance o estado.
6. Eliminar con confirmacion si aplica.

## Flujo Pago

1. Abrir Pagos.
2. Seleccionar prestamo.
3. Registrar monto, metodo, referencia, fecha y estado.
4. Buscar por cliente, metodo o referencia.
5. Filtrar por estado.
6. Exportar el listado para Excel.
