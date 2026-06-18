# Proyecto Grupo 13 - PREDICEX

Repositorio base para el desarrollo del proyecto del Grupo 13. PREDICEX es una Plataforma de Optimización de Suministro y Logística Predictiva diseñada para centralizar y automatizar la cadena de suministro multisucursal.

## Tecnologías y Arquitectura

[cite_start]El proyecto está estructurado bajo una arquitectura moderna y desacoplada, utilizando las siguientes herramientas:

### Backend (Capa de Servicios)
- **Node.js & NestJS**: Arquitectura modular y escalable basada en TypeScript para la creación de la API RESTful.
- **TypeORM / Prisma ORM**: Abstracción de consultas y migración de esquemas.
- **PostgreSQL**: Base de datos relacional encargada de garantizar la consistencia ACID y el manejo eficiente de transacciones.
- **JWT (JSON Web Tokens)**: Implementación de mecanismos de seguridad, autenticación y autorización cifrada.

### Frontend (Capa de Presentación)
- **React.js**: Librería principal bajo una arquitectura de componentes funcionales y Hooks.
- **Tailwind CSS**: Framework de estilos utilizado para construir interfaces fluidas y de diseño adaptativo.

### Inteligencia Artificial y Ciencia de Datos
- **Python**: Entorno de desarrollo especializado para la ejecución de modelos matemáticos.
- **Pandas, NumPy y Prophet (o Scikit-learn)**: Tecnologías aplicadas en la proyección analítica de series temporales para predecir la demanda futura del inventario.

### DevOps y Herramientas
- **Docker**: Containerización de los servicios backend, la base de datos relacional y los scripts de IA.
- **Git & GitHub**: Control de versiones y gestión de ramas.

## Estructura del Repositorio

- `.github/workflows/`: automatizaciones de GitHub Actions.
- `docs/propuesta/`: propuesta y documentos iniciales del proyecto.
- `docs/requisitos/`: levantamiento de requisitos, historias de usuario y casos de uso.
- `docs/diseno/`: diagramas, arquitectura, prototipos y decisiones de diseño.
- `docs/informes/`: avances, entregas e informes del proyecto.
- `src/frontend/`: código de la interfaz de usuario.
- `src/backend/`: código del servidor, API o lógica principal.
- `src/database/`: scripts, modelos o migraciones de base de datos.
- `tests/frontend/`: pruebas del frontend.
- `tests/backend/`: pruebas del backend.
- `assets/`: imágenes, diagramas y recursos visuales.
- `config/`: configuraciones del proyecto.
- `scripts/`: scripts de automatización.

## Entregables de avance

- `docs/avance-inicial.md`: capturas requeridas, explicacion del backend, primeras rutas o endpoints, pruebas basicas y observaciones tecnicas.
- `docs/avance-2-primeros-modulos-funcionales.md`: primeros modulos funcionales, frontend inicial, backend, endpoints y pruebas basicas.

## Ejecucion local

Backend inicial:

```bash
npm run start:backend
```

Pruebas basicas del backend:

```bash
npm run test:backend
```

## Flujo de trabajo Git

El repositorio queda preparado con estas ramas:

- `main`: versión estable y entregable.
- `develop`: integración del trabajo antes de pasar a `main`.
- `feature/backend-auth`: autenticación del backend.
- `feature/backend-suppliers`: módulo de suplidores/proveedores.
- `feature/backend-purchases-ncf`: módulo de compras y NCF.
- `feature/frontend-auth-ui`: interfaz de autenticación.
- `feature/frontend-dashboard`: dashboard principal.
- `feature/ai-prophet-model`: modelo predictivo con Prophet.
- `feature/ai-data-pipeline`: pipeline de datos para IA.

Para subirlo a GitHub:

```bash
git remote add origin [https://github.com/Willy-Alcantara-29/PREDICEX.git](https://github.com/Willy-Alcantara-29/PREDICEX.git)
git push -u origin main
git push -u origin develop
git push -u origin feature/backend-auth
git push -u origin feature/backend-suppliers
git push -u origin feature/backend-purchases-ncf
git push -u origin feature/frontend-auth-ui
git push -u origin feature/frontend-dashboard
git push -u origin feature/ai-prophet-model
git push -u origin feature/ai-data-pipeline
