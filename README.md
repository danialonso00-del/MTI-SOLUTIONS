# MTI · Solutions Explorer

Plataforma web para presentar las soluciones de **Mingo Things** en reuniones: una
ciudad 3D viva donde cada caso de uso tiene su punto luminoso, su ficha animada,
su documentación en PDF y su enlace a demo.

![stack](https://img.shields.io/badge/React_19-Vite_5-0ea5e9?style=flat-square) ![stack](https://img.shields.io/badge/three.js-R3F-E6A817?style=flat-square) ![stack](https://img.shields.io/badge/Node-Express_5-10b981?style=flat-square)

## Arrancar

```bash
npm install
npm run dev          # API (5181) + web (5180) a la vez → abre http://localhost:5180
```

Para presentar desde un equipo sin entorno de desarrollo:

```bash
npm run build
npm start            # sirve web + API en http://localhost:5181
```

## Los dos ejes: industrias × soluciones

El catálogo no es una lista plana. Cada caso de uso pertenece a **una industria**
(dónde se aplica) y combina **varias soluciones** (qué se despliega):

| Industrias                                                            | Soluciones                                                                                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Smart Cities · Transporte y Movilidad · Medio Ambiente y Residuos · Estadios y Grandes Recintos · Edificios y Facilities · Construcción y Obra | Centro de Control · IoT y Sensórica · Seguridad y Videovigilancia · Agentic AI · Analítica y Predictivo · Integración · Conectividad y Edge · Gemelo Digital |

Ocho casos de uso: **Smart Hypervisor** (centro de control), **agua y contadores
inteligentes**, **videovigilancia urbana**, **smart lighting**, **gestión de
edificios**, **flota y transporte público**, **waste management** y **smart
stadium**. Así se responde en reunión a "¿y esto en un estadio?": el **Centro de
Control** aparece en ciudad, en recinto y en edificio; el **IoT** en agua,
alumbrado, residuos, edificios y flota. La tecla `M` abre la **matriz** completa:
pulsar una celda salta al caso concreto, pulsar una columna muestra esa solución en
todas las industrias.

## El mismo catálogo sobre un mapa (MapLibre)

El botón **Mapa** de la barra superior abre una segunda lectura del explorer:
en vez de la ciudad construida y guardada en el proyecto, un **mapa vectorial**
(MapLibre GL con estilos de CARTO, gratis y sin clave) al que se le levantan los
edificios con `fill-extrusion`. Tres estilos: oscuro, claro y callejero.

No es un mapa muerto:

- **Modelos 3D de verdad encima del mapa**: MapLibre admite una *capa
  personalizada* que te entrega el contexto WebGL y la matriz de la cámara, así
  que se monta una escena de three.js con los mismos GLB de la ciudad. Hay un
  **autobús** parado en la Estació del Nord, un **camión de la basura** que
  recorre de verdad una calle del Fort Pienc —se le pasa el viario del volcado
  y lo sigue, ida y vuelta— y una **grúa torre** girando en las obras de La
  Sagrera. Al pulsar cualquiera de los tres se abre su caso y arranca su
  relato; la zona de clic del camión viaja con él. Añadir más es una línea en
  la lista `MODELOS` de `MapView.jsx`.
- **Dos capas de datos reales, sin clave y sin registro**:
  **Bicing en vivo** (formato GBFS del sistema de bicicleta pública de
  Barcelona: 545 estaciones con disponibilidad real, refrescadas cada 30 s) y
  **lluvia** (radar de RainViewer, las últimas dos horas animadas). Sirven para
  enseñar el argumento de fondo: la plataforma se alimenta de lo que ya hay, no
  solo de sus propios sensores.

- **Capas vivas**: coches, taxis, autobuses y camiones circulan por el **mismo
  viario real** que usa la ciudad 3D (`public/city/barcelona.json`, invirtiendo
  su proyección a latitud/longitud), y los contenedores se pintan con su color
  según el llenado. Dos fuentes GeoJSON refrescadas a 12 Hz con un temporizador
  —no con `requestAnimationFrame`, que en equipos justos se lo queda la ciudad
  3D y la flota se paraba.
- **El relato completo**: al elegir un caso —desde el mapa, desde el panel
  lateral o pulsando su modelo 3D— arranca el mismo guion de cuatro tiempos.
  Aquí va más rápido (primera tarjeta a los 2,5 s) y **mucho más cerca** (zoom
  17,4-17,9): lo que se cuenta pasa en una calle, no en la comarca. En pantalla
  hay dos piezas: una **chapa de alerta con el icono, clavada sobre el sitio**
  donde ocurre, y la **tarjeta al lado**, unidas por un hilo. La tarjeta se
  coloca midiendo los paneles de la interfaz, así que nunca se sale del hueco
  libre, y tanto ella como el cuadro de mando **crecen con la pantalla**
  (`clamp` sobre `vw`): en un monitor grande pesan lo mismo que los paneles de
  la ciudad 3D.
- **El mismo cuadro de mando**: el panel del caso —foto real del activo, tres
  cifras que laten, gráfica y registro— también se pinta sobre el mapa, en HTML.
  Los datos salen de `src/data/panels.js`, que comparten las dos lecturas: se
  escriben una vez y se ven igual en la ciudad 3D y en el mapa.
- **El panel lateral y la ficha mandan sobre el mapa**: se filtra y se elige
  caso igual que en la ciudad 3D.

Dos decisiones de rendimiento que se notan:

1. El radar se pide hasta zoom 9 y por encima se amplía la tesela: pedir zoom
   de calle a un radar meteorológico es pedir imágenes que no existen (y llenar
   la consola de 429).
2. El mapa **se prepara con la aplicación**, no al pulsar el botón: cuando la
   ciudad 3D termina de cargar, el mapa ya está descargando su estilo y sus
   teselas de fondo. Abrirlo tarda menos de un segundo en vez de quince.
3. Solo Barcelona: `maxBounds` sobre la extensión del volcado y zoom entre 13 y
   18,5. No se descargan teselas de medio mundo, y con el mapa delante **la
   ciudad 3D deja de dibujar** (`frameloop="never"`), así que la GPU es toda
   para MapLibre.

Sirve para comparar los dos caminos:

| | Ciudad 3D (la principal) | Mapa MapLibre |
| --- | --- | --- |
| Conexión | **no hace falta**, todo descargado | obligatoria, las teselas llegan en directo |
| Alcance | la zona preparada de Barcelona | el mundo entero, sin preparar nada |
| Aspecto | maqueta, ortofoto real, tráfico y escenas animadas | mapa con etiquetas de calle, volúmenes y flota viva |
| Relato | los cuatro tiempos, con la escena animada detrás | los mismos cuatro tiempos, sobre el mapa |

Detalle de montaje: MapLibre carga su *worker* con una ruta relativa a su
propio paquete, que Vite no emite. Por eso el worker y su módulo compartido se
sirven desde `public/maplibre/` y la aplicación se lo indica con
`setWorkerUrl()`. Sin eso el mapa se queda cargando para siempre, y sin dar
ningún error.

## Dos idiomas

En la portada se elige **castellano o inglés** antes de entrar, y la elección se
recuerda para la próxima vez. Cambia todo lo que se lee: la interfaz, el
catálogo, los relatos de las escenas y los cuadros de mando. Los textos de la
interfaz están en `src/i18n.js` —con el castellano como clave, así que si falta
una traducción se ve el original y nunca una clave rota— y el contenido de venta
en `src/data/en.js`.

## Dónde está cada caso

Solo dos casos están donde de verdad se hicieron: el **Camp Nou** y los
**autobuses de TMB**. Esos llevan `realPlace: true` en el catálogo y su
ubicación se rotula en pantalla. Los demás se colocan por la ciudad únicamente
para poder enseñarlos, así que **no se rotula dónde están**: sería vender un
proyecto que no existe.

## La ciudad es Barcelona de verdad

Nada está inventado. Todo se descarga y se deja en el proyecto:

```bash
npm run city:fetch     # geometría de OpenStreetMap  → public/city/barcelona.json
npm run city:ortho     # ortofoto aérea del ICGC     → public/city/barcelona-ortho/
npm run city:photos    # fotos de los paneles        → public/photos/
```

- **Geometría** (OSM, ODbL): **29.962 edificios** con sus huellas y alturas reales,
  7.244 calles y 1.006 zonas verdes de una zona de **6,6 × 4,3 km** que va del
  **Camp Nou** a **Glòries**.
- **Ortofoto** (ICGC, CC BY 4.0): 15 teselas a **0,76 m/píxel**. Es el suelo —calles,
  plazas, patios de manzana, arbolado— y también la **cubierta de cada edificio**:
  cada tejado lleva proyectada su propia foto aérea.
- **Fachadas y relieve**: módulo dibujado con las proporciones del Eixample (planta de
  3,3 m, hueco vertical, balcón de forja y línea de forjado). El volumen se refuerza
  horneando en los vértices el sombreado por orientación de cada fachada, una cornisa en
  el remate y oclusión en el arranque; encima van sombras reales cuya caja sigue al punto
  que mira la cámara, así son nítidas aunque la ciudad mida kilómetros.
- **Tráfico**: circula por el **grafo de calles real**; en cada cruce el vehículo elige
  una calle conectada de verdad.

Los casos de uso se anclan por **coordenadas geográficas** (`latlon` en
`solutions.js`), así que se pueden cambiar de zona sin tocar nada: Camp Nou, Torre
Glòries, Parc de la Ciutadella, Mercat dels Encants, Estació del Nord, Mercat del
Fort Pienc…

### Cada caso se cuenta como un relato

Al abrir un caso no se enciende todo a la vez. Primero entra el **rótulo grande**
en el centro y se lee con calma; después la escena va contando la historia en
cuatro tiempos, con tarjetas que brotan del punto donde pasa algo y un hilo de
datos que sube hasta la plataforma:

1. **pasa algo** — el contenedor se llena, el acceso se satura, el contador no para
2. **llega a Smart Hypervisor** — la señal sube y se cruza con el resto de sistemas
3. **se decide** — ruta recalculada, tornos abiertos, orden de trabajo
4. **se resuelve** — el camión llega, el flujo se normaliza, el sector se estabiliza

Cada tarjeta lleva su paso (`1/4 · SUCEDE`, `2/4 · PLATAFORMA`…), así que la
secuencia se sigue sin explicarla. El texto se dibuja en un lienzo de 620×168
que reserva la columna derecha para la chapa del paso y la hora, encoge el
título lo justo y parte el subtítulo en dos líneas: ningún texto se sale ni se
monta encima de otro (comprobado sobre los 96 textos del catálogo). Y mientras un caso está abierto la ciudad
**se queda solo con él**: los puntos y las etiquetas de los demás se apagan para
que nada compita con lo que se está contando.

La regla que hace legible todo esto: **mientras hay una tarjeta en pantalla la
cámara no se mueve**. Se planta delante, a la distancia a la que esa tarjeta se
lee —el tamaño se calcula a partir de la distancia del plano, así que ocupa lo
mismo en un contenedor que en un estadio entero— y espera. Entre tarjeta y
tarjeta hay un travelling corto de dos segundos hasta el siguiente encuadre. Los
planos se colocan **a lo largo del eje de la calle**, nunca de frente contra una
medianera.

Cada caso tiene además **varias tandas de casuísticas** que se van turnando en
cada vuelta: el estadio cuenta gente, energía y seguridad; el agua, fuga,
consumo anómalo y telelectura; el autobús, la tecnología a bordo, la operación
de la línea y el mantenimiento predictivo.

Para cambiar de zona: edita el preset en `scripts/fetch-city.mjs`, lanza los tres
scripts y listo. Con `?city=test` se carga una zona mínima para equipos sin GPU.

### Modo fotorrealista (opcional)

Con una clave de Google Maps Platform (Map Tiles API) en `.env`:

```
VITE_GOOGLE_TILES_KEY=AIza...
```

aparece el botón **Fotorrealista** (tecla `P`), que sustituye la ciudad de OSM por las
**Photorealistic 3D Tiles de Google** — la misma malla fotogramétrica de Google Earth,
reorientada para que encaje con las coordenadas de la app.

**Cuidado con el coste**: no es gratis. Es un SKU Enterprise con **1.000 peticiones
gratis al mes** y **6 $ por cada 1.000** a partir de ahí; el antiguo crédito de 200 $/mes
desapareció el 28/02/2025. Cada tesela descargada cuenta, así que una demo moviéndose por
la ciudad consume miles. Antes de activarlo: restringir la clave por dominio, poner
presupuesto con alertas en Google Cloud y dejar OSM como modo por defecto. La atribución
de Google se pinta sola; no la quites.

Encima de la ciudad se cargan modelos 3D (~3 MB) para el detalle cercano:

- **Tráfico**: ~480 vehículos (coches, taxis, furgonetas, autobuses, camión de recogida,
  policía y ambulancia con sirena) circulando por las calles reales
- **70 peatones** con animación esquelética caminando por las aceras reales
- **Mobiliario urbano**: farolas, semáforos, bancos, arbolado, contenedores portuarios
- **Red de videovigilancia**: cámaras que barren la escena y muestran su cono de visión
  al activar cualquier caso de seguridad
- Las torres de la Sagrada Família, que OSM no modela, se añaden por código
- Modo **día / noche** con ventanas encendidas, farolas, faros y bloom

Los modelos son CC0 / CC-BY de [poly.pizza](https://poly.pizza) y los datos de ciudad son
ODbL de OpenStreetMap — atribución completa en [CREDITS.md](CREDITS.md), en el pie de la
web y en Ayuda → Créditos. Si un `.glb` falta, la ciudad se dibuja igual con primitivas:
la demo nunca se rompe.

## Escenas: cada caso de uso se cuenta solo

Al abrir un caso no se hace solo zoom: se monta una **escena** con su coreografía de
cámara y su panel de datos en vivo (KPIs, gráfico y registro de eventos que se mueven).

| Caso de uso | Qué se ve |
| ----------- | --------- |
| **Videovigilancia** | travelling por el eje de la calle hasta una cámara real, con un **monitor en vivo** que renderiza la escena desde el punto de vista de la propia cámara: dentro se ven los peatones y sus recuadros de detección, con rótulo, testigo de grabación y reloj |
| **Smart Stadium** | vuelo alrededor del **Camp Nou** con la operación del recinto |
| **Flota conectada** | cámara de persecución detrás de un autobús con su telemetría a bordo |
| **ITS y tráfico** | línea de aforo sobre el cruce y un contador 3D de vehículos/hora que va subiendo |
| **Residuos** | contenedores con su nivel de llenado y el **camión de recogida** recorriendo la ruta, trazada **por calles reales** (no en línea recta), con la cámara persiguiéndolo |
| **Alumbrado** | atardece, y un frente de encendido recorre las **farolas reales** del sector alejándose del punto de mando |
| **Gemelo digital** | plano de escaneo recorriendo el distrito sobre una malla de referencia |
| **Resto** | pulsos de sensor sobre el edificio y panel con los KPIs del caso |

Al abrir un caso entra un **rótulo de escena** con barras cinematográficas, como el
título de un plano. Cada panel lleva una **foto real** del activo del que habla (la cámara, el autobús, los
contenedores, el Camp Nou…), tres cifras con su **icono** —energía, personas, vehículos,
alertas, ruta…—, una serie temporal en movimiento y el registro de eventos. Además se
resalta con una caja luminosa el edificio del que se está hablando. Cada escena es una **secuencia de planos** —general para situar, aproximación con el campo
de visión cerrándose, travelling y plano de detalle— con enlaces suaves entre ellos. Si el
salto entre escenas es largo, se **corta con un fundido** en vez de volar medio minuto por
encima de la ciudad. Algunas escenas cambian el ambiente: el alumbrado atardece solo, y al
salir se recupera la hora anterior.

La coreografía va con **reloj real**, así que dura lo mismo en un portátil flojo que en
una estación de trabajo. En cuanto arrastras el ratón, la cámara vuelve a ser tuya.

## Estilos de ciudad

La misma geometría real, tres lecturas (tecla `T`, o el panel *Vista de la ciudad*):

| Estilo | Qué es | Cuándo usarlo |
| ------ | ------ | ------------- |
| **Foto aérea** | Ortofoto real del ICGC en suelo y cubiertas | Máximo realismo, el que impresiona |
| **Maqueta** | Sin fotografía: volúmenes claros sobre calles dibujadas | Se lee mejor al señalar cosas; va muy suelto en equipos flojos |
| **Técnico** | Plano oscuro de sala de control, calles luminosas | Hablar de gemelo digital y centro de mando |

Cambiar de estilo no reconstruye nada: solo intercambia materiales, es instantáneo.

### Nitidez al acercarse

La ortofoto base cubre 7,8 × 5,1 km a 0,76 m/píxel, que se ve pixelada a pie de calle. Por
eso hay una **segunda capa de detalle** sobre el corredor Sagrada Família–Glòries a
**0,24 m/píxel** (3× más nítida), que se descarga y se muestra sola cuando la cámara baja
de 420 m, y se retira al subir. Se genera con:

```bash
npm run city:ortho -- --detail --span=2000 --cols=4 --rows=4 --x=2200 --z=-860
```

Ajustando `--x`, `--z` y `--span` se puede poner la zona de detalle donde interese.

## Capas de datos

Cinco lecturas de la misma ciudad, generadas a partir de sus datos reales y proyectadas
sobre el suelo con un barrido de entrada:

| Capa | Se calcula a partir de |
| ---- | ---------------------- |
| Intensidad de tráfico | jerarquía real de la trama viaria (primarias, secundarias…) |
| Cobertura de cámaras | posiciones reales de la red de videovigilancia |
| Consumo energético | volumen construido de cada edificio |
| Llenado de contenedores | puntos de acera repartidos por la ciudad |
| Calidad del aire | campo continuo sobre la zona |

Tecla `L` para recorrerlas. Debajo, la **línea de tiempo del día**: mueve el sol —con sus
sombras largas a primera y última hora—, el encendido del alumbrado y el modo noche.

## Simulación de incidente

El botón **Incidente** (tecla `I`) lanza una secuencia de 45 segundos que enseña cómo
encajan las verticales entre sí, con narración paso a paso:

1. La videoanalítica detecta una colisión y genera el aviso
2. El centro de mando correlaciona cámaras, aforo y sensores
3. Se despacha la ambulancia más cercana, que **conduce hasta el punto por calles reales**
   (enrutado voraz sobre el grafo viario) con prioridad semafórica
4. Se dibuja el corredor de desvío del tráfico
5. Se cierra el aviso y queda trazado

Es el argumento que no se puede contar enseñando las verticales por separado.

## Rendimiento

La ciudad son ~30.000 edificios y ~480 vehículos. Además del modo reducido manual, el motor
**se ajusta solo**: mide los fotogramas por segundo cada segundo y medio y, si no llega a
30, recorta primero las sombras y después la resolución de render; si sobra músculo, las
recupera. A eso se suman:

- **Peatones por nivel de detalle**: se animan los esqueletos cercanos, a media frecuencia
  los intermedios, y los lejanos ni se dibujan
- **Faros solo de noche**: de día no se recalculan 480 matrices por frame
- **Ortofoto de detalle bajo demanda**: se carga al bajar de 420 m y se retira al subir
- **Paneles a 10 Hz**: repintar el canvas a 60 fps no aporta nada

Para portátiles antiguos o proyectores hay además el modo reducido manual (sin sombras ni
post-proceso y con menos tráfico):

```
http://localhost:5181/?quality=baja      # se recuerda en el navegador
http://localhost:5181/?city=test         # zona mínima, para equipos sin GPU
http://localhost:5181/?ortho=off         # sin foto aérea (solo volúmenes)
```

## Cómo se usa en una reunión

| Acción              | Atajo                                          |
| ------------------- | ---------------------------------------------- |
| Girar / zoom        | arrastrar · rueda                              |
| Abrir un caso de uso| clic en el punto luminoso, la etiqueta o la lista |
| Matriz industrias × soluciones | `M`                                 |
| Modo presentación   | `Espacio` (recorre los casos cada 14 s)        |
| Ciudad OSM ↔ fotorrealista | `P` (si hay clave de Google configurada) |
| Día / noche         | `N`                                            |
| Volver atrás        | `Esc`                                          |
| Ir al caso N        | `1` … `9`                                      |
| Ayuda               | `H`                                            |

## Añadir o editar un caso de uso

Todo el catálogo vive en un único archivo: [`src/data/solutions.js`](src/data/solutions.js).
Cada entrada genera automáticamente el hotspot 3D, la tarjeta del panel, la celda de la
matriz y la ficha.

```js
{
  id: 'mi-caso',
  industry: 'industry',                       // clave de INDUSTRIES (define color e icono)
  capabilities: ['digital-twin', 'iot'],      // claves de CAPABILITIES
  title: 'Título del caso de uso',
  tagline: 'Frase corta con gancho.',
  anchor: [x, y, z],                          // dónde aparece el punto luminoso
  camera: [x, y, z],                          // desde dónde lo mira la cámara
  summary: '…',
  bullets: ['…'],
  kpis: [{ value: 62, suffix: '%', label: 'Ahorro energético' }],
  stack: ['thethings.io'],
  references: ['Cliente o proyecto'],
  pdf: 'docs/mi-caso.pdf',                    // archivo dentro de server/docs/
  demo: 'https://…',                          // enlace externo (o null)
}
```

- **PDFs**: se dejan en [`server/docs/`](server/docs/README.md) con el nombre indicado en `pdf`.
  El backend detecta si existe y el visor lo abre embebido; si falta, la ficha explica
  dónde ponerlo en vez de dar error.
- **Demos**: cualquier URL externa; se abre en una pestaña nueva.

## Estructura

```
scripts/fetch-city.mjs      descarga y hornea la geometría real de OSM
src/
  data/solutions.js         catálogo: industrias, soluciones y casos de uso
  three/realcity.js         ciudad real: edificios, calles, parques, cámaras CCTV
  three/realtraffic.js      tráfico y peatones sobre el grafo de calles real
  three/assets.js           carga de modelos glTF, normalizado e instanciado
  three/hotspots.js         marcadores 3D por caso de uso
  three/theme.js            interpolación día ↔ noche
  components/CityScene.jsx  escena react-three-fiber (cámara, luces, bloom, loop)
  components/PhotoCity.jsx  modo fotorrealista con Google 3D Tiles (opcional)
  components/Overlays.jsx   loader, intro, barra, filtros, matriz, ficha, visor PDF
  store.js                  estado global (zustand) y objetivo de cámara
server/index.js             API Express + servidor de PDFs + build de producción
public/city/                geometría real de la ciudad (generada, ver CREDITS.md)
public/models/              modelos 3D (ver CREDITS.md)
```

## API

| Endpoint                 | Devuelve                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `GET /api/solutions`     | industrias, soluciones, matriz y casos con `docUrl`/`docAvailable` |
| `GET /api/solutions/:id` | un caso de uso                                                |
| `GET /api/health`        | estado del servicio                                           |
| `GET /docs/:archivo`     | PDF de documentación                                          |

Si la API no está levantada, la web sigue funcionando con el catálogo local
(el punto junto al logo indica si la API está conectada).
