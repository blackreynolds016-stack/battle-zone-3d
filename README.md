# Battle Zone 3D — Versión 2.0

Prototipo original de supervivencia 3D para navegador móvil y escritorio. Construido con HTML, CSS, JavaScript y Three.js.

## Publicar con GitHub Pages

Este proyecto conserva los archivos separados y se publica desde la raíz del repositorio. Si usas el flujo de GitHub Actions, en **Configuración → Páginas → Compilar e implementar → Origen** selecciona **GitHub Actions**.

El repositorio incluye `.github/workflows/main.yml`. Al subir los cambios a la rama `main`, GitHub Actions prepara y publica el sitio.

## Controles

- **Móvil:** joystick izquierdo para moverse; arrastra la zona derecha para girar la cámara; botones para disparar, saltar, recargar, cambiar arma y usar un botiquín.
- **PC:** WASD o flechas para moverse; ratón/arrastre para mirar; Espacio para saltar; clic o botón Disparar; R para recargar; Q para cambiar arma; Escape para pausar.

## Funciones de la versión 2.0

- Escenario 3D ampliado con árboles, rocas, montañas, edificios, iluminación y sombras.
- Personaje 3D con equipamiento y arma visible.
- Tres armas con cargadores y munición de reserva: rifle, escopeta y pistola.
- Ocho enemigos controlados por IA sencilla que se acercan y atacan.
- Botín recogible: munición, botiquines y placas de escudo.
- Zona segura que se reduce; permanecer fuera causa daño.
- HUD de vida, escudo, arma, munición, supervivientes y temporizador.

## Limitaciones

Es un prototipo individual: no incluye multijugador en línea, animaciones capturadas, modelos externos de alta fidelidad ni APK nativo. Los personajes, armas y edificios se construyen con geometría 3D de Three.js. Three.js se carga desde jsDelivr, por lo que se necesita conexión a internet.
