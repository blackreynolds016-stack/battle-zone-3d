# EGO ZNE

Battle Royale 3D de supervivencia hecho con Three.js. Se juega en el navegador (GitHub Pages) y se puede instalar en Android.

## Controles
- Joystick: moverse · arrastrar a la derecha: mirar
- DISPARAR, SALTAR, RECARGAR, ARMA (cambiar), APUNTAR (mira), + VIDA, 🎒 (mochila / accesorios)
- Teclado: WASD, Espacio (saltar), Shift (correr), C (agacharse), Z (acostarse), R, Q, E (apuntar), B (mochila), Esc (pausa)
- Botones en pantalla: CORRER, AGACHAR, ACOSTAR (agachado x0.55 de velocidad, acostado x0.28, corriendo x1.5; correr se cancela al disparar o apuntar)

## Personajes
- ZANE (soldado): equilibrado · LYRA (exploradora): rápida y recarga veloz · BRUNO (tanque): lento pero resistente

## Armas y accesorios
Rifle, escopeta, pistola, subfusil, sniper y revólver. Accesorios: miras, cargador ampliado, empuñadura y silenciador.

## Modos
- Todos contra todos (por defecto) · por equipos: añade `?equipos` al enlace

## Instalar en Android
- App web: abrir en Chrome → menú ⋮ → «Instalar app» / «Añadir a pantalla de inicio»
- APK: pestaña Actions → «Construir APK (EGO ZNE)» → Run workflow → descargar el artefacto `EGO-ZNE-APK`

## Mapa
- Isla de 240 × 240 m basada en la imagen del mapa (costa, ciudad central, fortaleza al sureste y cinco pueblos). Los datos están en `js/mapdata.js`.
- Optimizado: terreno en una sola malla, árboles y rocas como instancias (3 dibujos para ~1 300 árboles), edificios fusionados en 2 mallas, colisiones y balas con una rejilla espacial (sin Raycaster contra cientos de objetos).
- Botín por zonas: armas y escudos en la fortaleza; munición, botiquines y accesorios en ciudad y pueblos; 70 cajas sueltas por toda la isla. Se reparte de nuevo en cada partida.
- 14 enemigos, zona segura de 105 m que se cierra hasta 25 m en 5 min 30 s. Toca el minimapa para abrir el mapa completo.
