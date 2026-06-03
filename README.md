# Proyecto Grupo 13

Repositorio base para el desarrollo del proyecto del Grupo 13.

## Estructura

- `.github/workflows/`: automatizaciones de GitHub Actions.
- `docs/propuesta/`: propuesta y documentos iniciales del proyecto.
- `docs/requisitos/`: levantamiento de requisitos, historias de usuario y casos de uso.
- `docs/diseno/`: diagramas, arquitectura, prototipos y decisiones de diseno.
- `docs/informes/`: avances, entregas e informes del proyecto.
- `src/frontend/`: codigo de la interfaz de usuario.
- `src/backend/`: codigo del servidor, API o logica principal.
- `src/database/`: scripts, modelos o migraciones de base de datos.
- `tests/frontend/`: pruebas del frontend.
- `tests/backend/`: pruebas del backend.
- `assets/`: imagenes, diagramas y recursos visuales.
- `config/`: configuraciones del proyecto.
- `scripts/`: scripts de automatizacion.

## Flujo de trabajo Git

El repositorio queda preparado con estas ramas:

- `main`: version estable y entregable.
- `develop`: integracion del trabajo antes de pasar a `main`.
- `feature/estructura-inicial`: rama de ejemplo para nuevas funcionalidades.
- `docs/propuesta`: rama para cambios de documentacion de la propuesta.

Para subirlo a GitHub:

```bash
git remote add origin https://github.com/USUARIO/NOMBRE-DEL-REPOSITORIO.git
git push -u origin main
git push -u origin develop
git push -u origin feature/estructura-inicial
git push -u origin docs/propuesta
```

