# Guía para contribuir

## Antes de empezar

1. Actualiza tu copia local de `main`.
2. Crea una rama para una sola funcionalidad.
3. Comprueba qué archivos están siendo modificados por otros compañeros.

```bash
git switch main
git pull origin main
git switch -c feature/nombre-de-la-tarea-asignada
```

## Durante el trabajo

- Mantén los commits pequeños y relacionados con la tarea.
- No mezcles cambios de otras funcionalidades.
- Evita editar archivos compartidos sin avisar.
- Prueba la página en escritorio y móvil.

## Pull Request

El Pull Request debe explicar qué se cambió

La rama se puede fusionar después de una revisión y de resolver los
conflictos que aparezcan. Si `main` cambió mientras trabajabas, actualiza tu
rama antes de solicitar la revisión:

```bash
git fetch origin
git rebase origin/main
```
