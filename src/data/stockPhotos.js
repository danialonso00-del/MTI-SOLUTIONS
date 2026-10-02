/**
 * Fotografías de alta resolución que no vienen de las presentaciones.
 *
 * Las de la presentación corporativa para sectores y varios proyectos son de
 * 400-900 px: no aguantan ir a toda la altura o a sangre. Estas las sustituyen
 * (sectores) o las acompañan (fondo y «monitor» de cada proyecto).
 *
 * Procedencia: Wikimedia Commons (dominio público, CC0, CC BY y CC BY-SA, con
 * atribución en CREDITS.md). Las fotos de proyecto son del lugar real (T1 de
 * El Prat, línea 9 del metro, autobuses de TMB, un astillero de Navantia,
 * L'Hospitalet, KAFD, Doha, Kuala Lumpur); las de los «monitores» que no lo son
 * se rotulan como vista ilustrativa.
 *
 *   npm run deck:stock    descarga los originales a assets-src/stock/ (una vez)
 *   npm run deck:assets   los optimiza junto al resto de recursos
 */

export const STOCK_PHOTOS = [
  {
    id: "stock-sector-security",
    name: "sector-seguridad-camaras-cctv-noche",
    alt: "Cámaras CCTV en un poste de noche",
    altEn: "CCTV cameras on a pole at night",
    url: "https://upload.wikimedia.org/wikipedia/commons/3/33/CCTV_cameras_in_Mumbai.jpg",
    credit: {"creator":"Punit Rajpal","license":"CC0","source":"wikimedia","title":"CCTV cameras in Mumbai.jpg","landing":"https://commons.wikimedia.org/wiki/File:CCTV_cameras_in_Mumbai.jpg"},
  },
  {
    id: "stock-sector-smart-cities",
    name: "sector-smart-city-barcelona-noche",
    alt: "Barcelona de noche desde El Carmel",
    altEn: "Barcelona at night from El Carmel",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Barcelona_desde_El_Carmel_%281%29.JPG",
    credit: {"creator":"Jcca76","license":"CC BY-SA 4.0","source":"wikimedia","title":"Barcelona desde El Carmel (1).JPG","landing":"https://commons.wikimedia.org/wiki/File:Barcelona_desde_El_Carmel_(1).JPG"},
  },
  {
    id: "stock-sector-industry",
    name: "sector-industria-robots",
    alt: "Robots industriales en una línea automatizada",
    altEn: "Industrial robots on an automated line",
    url: "https://upload.wikimedia.org/wikipedia/commons/2/22/Factory_Automation_Robotics_Palettizing_Bread.jpg",
    credit: {"creator":"KUKA Roboter GmbH, Bachmann","license":"Public domain","source":"wikimedia","title":"Factory Automation Robotics Palettizing Bread.jpg","landing":"https://commons.wikimedia.org/wiki/File:Factory_Automation_Robotics_Palettizing_Bread.jpg"},
  },
  {
    id: "stock-sector-cyber",
    name: "sector-ciber-cables-red",
    alt: "Cables de red iluminados en un centro de datos",
    altEn: "Lit network cables in a data centre",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Wikimedia_Foundation_Servers_2015-88.jpg",
    credit: {"creator":"VGrigas (WMF)","license":"CC BY-SA 3.0","source":"wikimedia","title":"Wikimedia Foundation Servers 2015-88","landing":"https://commons.wikimedia.org/w/index.php?curid=44043649"},
  },
  {
    id: "stock-sector-venues",
    name: "sector-recintos-camp-nou",
    alt: "El Camp Nou lleno durante un partido",
    altEn: "A packed Camp Nou during a match",
    url: "https://upload.wikimedia.org/wikipedia/commons/8/81/Camp_Nou_during_El_Clasico_October_2012.jpg",
    credit: {"creator":"Jackpollock","license":"CC BY-SA 3.0","source":"wikimedia","title":"Camp Nou during El Clasico October 2012.jpg","landing":"https://commons.wikimedia.org/wiki/File:Camp_Nou_during_El_Clasico_October_2012.jpg"},
  },
  {
    id: "stock-sector-transport",
    name: "sector-transporte-tmb",
    alt: "Autobús articulado de TMB en Barcelona",
    altEn: "TMB articulated bus in Barcelona",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/ba/3409_TMB_-_Flickr_-_antoniovera1.jpg",
    credit: {"creator":"Antonio Vera","license":"CC BY-SA 2.0","source":"wikimedia","title":"3409 TMB - Flickr - antoniovera1.jpg","landing":"https://commons.wikimedia.org/wiki/File:3409_TMB_-_Flickr_-_antoniovera1.jpg"},
  },
  {
    id: "stock-aena-bg",
    name: "aena-t1-barcelona",
    alt: "Terminal 1 del aeropuerto de Barcelona-El Prat",
    altEn: "Terminal 1 at Barcelona-El Prat airport",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Terminal_1_of_Barcelona_Airport_-_23.jpg",
    credit: {"creator":"Little Savage","license":"CC BY-SA 3.0","source":"wikimedia","title":"Terminal 1 of Barcelona Airport - 23","landing":"https://commons.wikimedia.org/w/index.php?curid=27084032"},
  },
  {
    id: "stock-aena-feed",
    name: "aena-t1-pasajeros",
    alt: "Pasajeros en la Terminal 1 de Barcelona-El Prat",
    altEn: "Passengers in Terminal 1 at Barcelona-El Prat",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Terminal_1_of_Barcelona_Airport_-_07.JPG",
    credit: {"creator":"Little Savage","license":"CC BY-SA 3.0","source":"wikimedia","title":"Terminal 1 of Barcelona Airport - 07","landing":"https://commons.wikimedia.org/w/index.php?curid=27083849"},
  },
  {
    id: "stock-metro-bg",
    name: "metro-l9-tunel",
    alt: "Túnel de la línea 9 del metro de Barcelona",
    altEn: "Barcelona Metro Line 9 tunnel",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/11/Barcelona_Metro_Line_9_%2816049118954%29.jpg",
    credit: {"creator":"International Railway Summit","license":"CC BY-SA 2.0","source":"wikimedia","title":"Barcelona Metro Line 9 (16049118954)","landing":"https://commons.wikimedia.org/w/index.php?curid=78375052"},
  },
  {
    id: "stock-metro-feed",
    name: "metro-l9-vagon",
    alt: "Viajeros en un tren de la línea 9 del metro de Barcelona",
    altEn: "Passengers on a Barcelona Metro Line 9 train",
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Barcelona_Metro_Line_9_%2816645826306%29.jpg",
    credit: {"creator":"International Railway Summit","license":"CC BY-SA 2.0","source":"wikimedia","title":"Barcelona Metro Line 9 (16645826306)","landing":"https://commons.wikimedia.org/w/index.php?curid=78375069"},
  },
  {
    id: "stock-buses-bg",
    name: "tmb-autobus-noche",
    alt: "Autobús de TMB de noche en Barcelona",
    altEn: "TMB bus at night in Barcelona",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/58/TMB_%28Barcelona%29_driver_of_bus_1766_-_has_a_moment_to_himself_%2836696335140%29.jpg",
    credit: {"creator":"Paul Burroughs","license":"CC BY-SA 2.0","source":"wikimedia","title":"TMB (Barcelona) driver of bus 1766 - has a moment to himself (36696335140)","landing":"https://commons.wikimedia.org/w/index.php?curid=90077492"},
  },
  {
    id: "stock-buses-feed",
    name: "autobus-interior",
    alt: "Interior de un autobús urbano",
    altEn: "City bus interior",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Bus_interior_with_yellow_grabrails_and_handholds_BCC_bus_P1290479.jpg",
    credit: {"creator":"John Robert McPherson","license":"CC BY-SA 4.0","source":"wikimedia","title":"Bus interior with yellow grabrails and handholds BCC bus P1290479.jpg","landing":"https://commons.wikimedia.org/wiki/File:Bus_interior_with_yellow_grabrails_and_handholds_BCC_bus_P1290479.jpg"},
  },
  {
    id: "stock-hospitalet-bg",
    name: "hospitalet-plaza-europa",
    alt: "Torres de Plaza Europa en L'Hospitalet de Llobregat",
    altEn: "Plaza Europa towers in L'Hospitalet de Llobregat",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/56/Hospitalet_de_Llobregat_-_Plaza_de_Europa%2C_Torres_de_Toyo_Ito_%28Torres_Porta_Fira%29%2C_Hotel_Porta_Fira_y_Torre_Realia_BCN_08_edited.JPG",
    credit: {"creator":"Zarateman","license":"CC0 1.0","source":"wikimedia","title":"Hospitalet de Llobregat - Plaza de Europa, Torres de Toyo Ito (Torres Porta Fira), Hotel Porta Fira y Torre Realia BCN 08 edited","landing":"https://commons.wikimedia.org/w/index.php?curid=142924647"},
  },
  {
    id: "stock-control-room",
    name: "sala-de-control",
    alt: "Sala de control con monitores",
    altEn: "Control room with monitors",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/53/Celebro_Studios_Gallery.jpg",
    credit: {"creator":"RuslonV","license":"CC BY-SA 4.0","source":"wikimedia","title":"Celebro Studios Gallery","landing":"https://commons.wikimedia.org/w/index.php?curid=79812581"},
  },
  {
    id: "stock-navantia-bg",
    name: "navantia-astillero-bam",
    alt: "Grúas de astillero durante la puesta en quilla de un buque de Navantia",
    altEn: "Shipyard cranes at the keel laying of a Navantia ship",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/be/Puesta_en_quilla_del_BAM_%22Audaz%22.jpg",
    credit: {"creator":"PEPE GADEIRAS","license":"CC BY-SA 4.0","source":"wikimedia","title":"Puesta en quilla del BAM 'Audaz'","landing":"https://commons.wikimedia.org/w/index.php?curid=179371901"},
  },
  {
    id: "stock-navantia-feed",
    name: "soldadura-taller",
    alt: "Soldadura con chispas en un taller",
    altEn: "Welding sparks in a workshop",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/da/Making_sparks_for_parts_%288625884%29.jpg",
    credit: {"creator":"U.S. Air Force photo by Senior Airman Luis E. Rios Calderon","license":"Public domain","source":"wikimedia","title":"Making sparks for parts (8625884).jpg","landing":"https://commons.wikimedia.org/wiki/File:Making_sparks_for_parts_(8625884).jpg"},
  },
  {
    id: "stock-kafd-bg",
    name: "kafd-riad-noche",
    alt: "Distrito KAFD de Riad de noche",
    altEn: "KAFD district in Riyadh at night",
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/King_Abdullah_Financial_District_201553.jpg",
    credit: {"creator":"Ahmed","license":"CC BY-SA 4.0","source":"wikimedia","title":"King Abdullah Financial District 201553","landing":"https://commons.wikimedia.org/w/index.php?curid=120250309"},
  },
  {
    id: "stock-kafd-feed",
    name: "kafd-riad-dia",
    alt: "Distrito KAFD de Riad de día",
    altEn: "KAFD district in Riyadh by day",
    url: "https://upload.wikimedia.org/wikipedia/commons/6/64/King_Abdullah_Financial_District_20230411_114859.jpg",
    credit: {"creator":"Ahmed","license":"CC BY-SA 4.0","source":"wikimedia","title":"King Abdullah Financial District 20230411 114859","landing":"https://commons.wikimedia.org/w/index.php?curid=157318656"},
  },
  {
    id: "stock-qatar-bg",
    name: "doha-skyline-noche",
    alt: "Skyline de Doha de noche",
    altEn: "Doha skyline at night",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/16/Doha_Skyline_Nacht_night.jpg",
    credit: {"creator":"FLASHPACKER TRAVELGUIDE","license":"CC BY-SA 2.0","source":"wikimedia","title":"Doha Skyline Nacht night","landing":"https://commons.wikimedia.org/w/index.php?curid=87285877"},
  },
  {
    id: "stock-qatar-feed",
    name: "contenedores-reciclaje",
    alt: "Contenedores de reciclaje en la calle",
    altEn: "Street recycling bins",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Vancouver_street_recycling.JPG",
    credit: {"creator":"Daylen","license":"CC0 1.0","source":"wikimedia","title":"File:Vancouver street recycling.JPG","landing":"https://commons.wikimedia.org/w/index.php?curid=66184719"},
  },
  {
    id: "stock-malaysia-bg",
    name: "kuala-lumpur-noche",
    alt: "Skyline de Kuala Lumpur de noche",
    altEn: "Kuala Lumpur skyline at night",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Kuala_Lumpur_skyline_at_night_%282019%29.jpg",
    credit: {"creator":"Lee Wei","license":"CC BY 2.0","source":"wikimedia","title":"Kuala Lumpur skyline at night (2019)","landing":"https://commons.wikimedia.org/w/index.php?curid=115902236"},
  },
  {
    id: "stock-malaysia-feed",
    name: "kuala-lumpur-calima",
    alt: "Kuala Lumpur bajo un cielo cargado",
    altEn: "Kuala Lumpur under a heavy sky",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Kuala_Lumpur_skyline_thunderstorm_03.jpg",
    credit: {"creator":"Pradana Aumars (talk · contribs)","license":"CC BY-SA 4.0","source":"wikimedia","title":"Kuala Lumpur skyline thunderstorm 03","landing":"https://commons.wikimedia.org/w/index.php?curid=75362513"},
  },
];

export default STOCK_PHOTOS;
