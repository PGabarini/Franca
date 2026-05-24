## Auditoría mobile (390×844)

Revisé las pantallas principales en viewport mobile: Home (`/`), Colección (`/catalogo`), Producto (`/producto/$slug`), Carrito (`/carrito`), Login (`/login`), Contacto (`/contacto`) y FAQs (`/faqs`).

### Estado por pantalla

- **Home** — OK (issue conocido del watermark del hero es aparte).
- **Colección** — OK. Filtros se apilan correctamente.
- **Carrito** (vacío) — OK.
- **Login / Registro** — OK.
- **Contacto** — OK.
- **FAQs** — OK pero con poco aire entre el botón "Volver" y el eyebrow "AYUDA".
- **Producto** — **Bug visible**: en la sección "Preguntas y respuestas" para usuarios deslogueados, los botones `Ingresar` + `Crear cuenta` (`size="lg"`) se ponen en una fila con `flex gap-3` y **el segundo botón se sale del contenedor** a ~390px de ancho.

## Cambios

1. **`src/components/ProductQuestions.tsx`** (línea ~116)
   - Cambiar `flex gap-3` por `flex flex-wrap gap-3` y hacer que cada `<Link>` ocupe ancho completo en mobile (`className="w-full sm:w-auto"`), para que en pantallas chicas los botones se apilen y no se desborden.

2. **`src/routes/faqs.tsx`** (línea ~68)
   - Aumentar el margen inferior del botón "Volver" (de `mb-6` a `mb-8`) para separar mejor del eyebrow "AYUDA".

## Verificación

- Re-screenshot de `/producto/pantalon-roma` a 390px confirmando que ambos botones quedan dentro del viewport.
- Re-screenshot de `/faqs` confirmando separación.
- Pasada rápida por `/`, `/catalogo`, `/carrito`, `/login`, `/contacto` para asegurar que nada se rompió.

No se tocan estilos globales ni lógica de negocio.
