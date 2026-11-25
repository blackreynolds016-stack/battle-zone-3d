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

## Modelos 3D con esqueleto (`models/`)

`models/zane.glb`, `models/lyra.glb` y `models/bruno.glb` son los personajes con **esqueleto de 19 huesos** y 26 animaciones. Si el juego los encuentra, sustituyen a los personajes hechos con formas básicas; si falta alguno, ese personaje se ve como antes.

- **Capa de cuerpo y piernas:** `idle`, `walk`, `run`, `sprint`, `crouch`, `crouch_walk`, `prone`, `crawl`, `stand_up`, `jump`, `fall`, `land`, `die`.
- **Capa de brazos con el arma:** `arm_hold`, `arm_run`, `arm_sprint`, `arm_aim`, `arm_air`, `arm_crouch`, `arm_prone`, `arm_crawl`, `arm_relax` y las de un solo uso `arm_shoot`, `arm_reload`, `arm_switch`, `arm_hit`.
- El arma se monta en el hueso `Hand_R` (cañón hacia delante). Huesos: `Root`, `Hips`, `Spine`, `Chest`, `Neck`, `Head`, `Tail`, `UpperArm_L/R`, `LowerArm_L/R`, `Hand_L/R`, `UpperLeg_L/R`, `LowerLeg_L/R`, `Foot_L/R`.
- Para usar tus propios modelos (por ejemplo de Mixamo o Blender) basta con exportarlos como `.glb` con esos nombres de hueso y de animación y reemplazar el archivo.
