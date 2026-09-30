/**
 * Recorrido «Agentify AI» (IA Agentiva de MTi)
 * =============================================
 *
 * Contenido sacado de public/MTi_Group_IA_Agentiva_Recort_v.01.pptx. La
 * aplicación nunca abre ese archivo: todo lo que necesita está aquí.
 *
 * Reglas, las mismas que en el recorrido corporativo:
 *   - solo se usa lo que dice la presentación; nada de cifras, clientes ni
 *     integraciones nuevas
 *   - lo dudoso lleva `review` (se ve con la tecla F, nunca en pantalla)
 *   - `src` son las diapositivas de origen
 *   - los datos de las vistas de producto (borrador de correo, hoja de
 *     pre-cierre…) son los ejemplos de la propia presentación y se marcan
 *     como ilustrativos en pantalla
 */

export const AG_META = {
  file: 'MTi_Group_IA_Agentiva_Recort_v.01',
  name: 'Agentify AI',
  kicker: 'IA Agentiva',
  review:
    'Nombre comercial: el usuario lo llama «MTI Agentify AI»; la presentación dice «IA Agentiva» y «Agentive AI». Confirmar cuál se enseña al cliente.',
  src: [1, 8],
};

/* ================================================================== */
/* Capítulos del recorrido                                             */
/* ================================================================== */

export const AG_CHAPTERS = [
  { id: 'ag-intro', num: '01', label: 'IA que actúa', short: 'Agentify', steps: 3, src: [1, 9, 10] },
  { id: 'ag-arch', num: '02', label: 'Cómo funciona', short: 'Arquitectura', steps: 3, src: [12] },
  { id: 'ag-agents', num: '03', label: 'Ocho agentes', short: 'Agentes', steps: 9, src: [13, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46] },
  { id: 'ag-cases', num: '04', label: 'Catorce despliegues', short: 'Casos', steps: 15, src: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28] },
  { id: 'ag-delivery', num: '05', label: 'Cómo lo entregamos', short: 'Entrega', steps: 5, src: [47, 48] },
  { id: 'ag-why', num: '06', label: 'Por qué MTi', short: 'Por qué', steps: 3, src: [49, 50, 51] },
];

/* ================================================================== */
/* 1 · IA que actúa                                                     */
/* ================================================================== */

export const AG_INTRO = {
  kicker: 'IA Agentiva · Casos de uso 2026',
  title: ['Despliegues IA.', 'Autonomía real.'],
  line: 'Una plataforma.',
  lead:
    'Diseñamos e implantamos soluciones de IA Agentiva industrial: digitalización de procesos, agentes autónomos, inteligencia documental y asistentes conversacionales conectados a tu ERP, IoT y datos reales.',
  stats: [
    { value: '14', label: 'Despliegues en producción' },
    { value: '8', label: 'Agentes productivizados' },
    { value: '11', label: 'Sectores cubiertos' },
    { value: '6–14', unit: 'sem', label: 'Tiempo a producción' },
  ],
  review:
    'La presentación dice «14 despliegues en producción» (portada, capítulo de casos) y «12+ despliegues en vivo» (resultados agregados). Sectores: 11 en la diapositiva 30 y 5 en la diapositiva oculta 11. Se usan 14 y 11; confirmar.',
  belief: {
    kicker: 'Lo que creemos',
    title: ['La mayoría de la «IA» se queda en un chat.', 'La nuestra empieza donde ocurre el trabajo.'],
    body:
      'No construimos demos. Construimos IA agentiva que se integra con tus sistemas, conecta datos y procesos, automatiza tareas entre ERP, CRM y otras plataformas, y ejecuta acciones directamente sobre tus herramientas de negocio. Todos los días, en operaciones reales.',
    chat: ['Pregunta', 'Respuesta', 'Fin'],
    work: ['Lee el pedido', 'Consulta el ERP', 'Escribe la respuesta', 'Registra la acción'],
    chatLabel: 'Un chat',
    workLabel: 'Un agente MTi',
    workLogos: [['gmail', 'outlook'], ['sap', 'odoo'], ['outlook'], []],
    promises: [
      { id: 'result', num: '01', label: 'Resultado', text: 'Hecho para ROI medible, no para presentaciones.', icon: 'chart' },
      { id: 'integration', num: '02', label: 'Integración', text: 'Nativo con tu ERP, IoT, CRM y stack documental.', icon: 'integration' },
      { id: 'trust', num: '03', label: 'Confianza', text: 'Cada decisión auditable. Cada acción trazable.', icon: 'shield' },
    ],
  },
  traits: {
    kicker: 'Qué es la IA agentiva',
    title: ['Agentes que', 'actúan por ti.'],
    items: [
      {
        id: 'autonomous',
        num: '01',
        label: 'Autónomo',
        head: 'Decide, y luego actúa.',
        body: 'Planifica trabajo de varios pasos, llama a las herramientas adecuadas, se recupera de errores y pide ayuda solo cuando una persona es realmente necesaria.',
      },
      {
        id: 'integrated',
        num: '02',
        label: 'Integrado',
        head: 'Habla con tus sistemas.',
        body: 'Conectores nativos a SAP, Odoo, Dynamics, SAGE, SharePoint, HubSpot, Salesforce, IMAP, servidores MCP y hubs IoT.',
      },
      {
        id: 'explainable',
        num: '03',
        label: 'Explicable',
        head: 'Muestra su trabajo.',
        body: 'Cada decisión queda registrada con entradas, fuentes y confianza. Trazas de auditoría que tu equipo de compliance puede defender en un concurso.',
      },
      {
        id: 'productized',
        num: '04',
        label: 'Productivizado',
        head: 'Reutilizable, no a medida.',
        body: 'Ocho agentes probados en producción, cada uno construido con despliegues reales, configurado a tus datos y desplegado en semanas, no trimestres.',
      },
    ],
  },
  src: [1, 9, 10],
};

/** Conectores que nombra la presentación (diapositiva 10). */
export const AG_CONNECTORS = ['SAP', 'Odoo', 'Dynamics', 'SAGE', 'SharePoint', 'HubSpot', 'Salesforce', 'IMAP', 'MCP', 'IoT'];

/* ================================================================== */
/* 2 · Cómo funciona                                                    */
/* ================================================================== */

export const AG_ARCH = {
  kicker: 'Arquitectura',
  title: ['Un orquestador.', 'Muchos especialistas.'],
  lead:
    'Una capa central de razonamiento lee cada petición, planifica el camino y llama al agente adecuado. Cada especialista es auditable: cada paso se explica, cada salida se traza.',
  steps: [
    { id: 'detect', num: '01', title: 'Detectar la petición', body: 'Lee PDFs, correos, eventos IoT, disparadores de CRM y notas de voz, en paralelo.' },
    { id: 'route', num: '02', title: 'Encaminar al especialista', body: 'Planifica, llama y valida. Cada paso deja una traza de auditoría completa.' },
    { id: 'act', num: '03', title: 'Actuar y explicar', body: 'Escribe en el ERP, envía el correo, abre el ticket. Nunca en silencio, siempre con fuentes.' },
  ],
  // lo que entra y lo que sale en la escena 3D: solo lo que nombra la diapositiva 12
  inputs: [
    { id: 'pdf', label: 'PDF', icon: 'doc', logos: ['pdf'] },
    { id: 'mail', label: 'Correo', icon: 'mail', logos: ['gmail', 'outlook'] },
    { id: 'iot', label: 'Evento IoT', icon: 'sensor' },
    { id: 'crm', label: 'CRM', icon: 'user', logos: ['hubspot', 'salesforce'] },
    { id: 'voice', label: 'Nota de voz', icon: 'mic' },
  ],
  outputs: [
    { id: 'erp', label: 'Escribe en el ERP', icon: 'database', logos: ['sap', 'odoo'] },
    { id: 'send', label: 'Envía el correo', icon: 'send', logos: ['outlook'] },
    { id: 'ticket', label: 'Abre el ticket', icon: 'ticket' },
  ],
  core: 'Orquestador',
  ring: 'Capa de datos · Traza · Memoria · Auditoría',
  src: [12],
};

/* ================================================================== */
/* 3 · Ocho agentes                                                     */
/* ================================================================== */

export const AG_AGENTS_META = {
  kicker: 'Catálogo de agentes',
  title: ['Ocho agentes.', 'Una plataforma.'],
  lead: 'Cada agente es software real: construido a partir de despliegues operativos, configurado a tu stack y desplegado en producción.',
  stats: [
    { value: '08', label: 'Agentes' },
    { value: '14+', label: 'Casos en producción' },
    { value: '11', label: 'Sectores cubiertos' },
    { value: '6–14', unit: 'sem', label: 'Tiempo a producción' },
  ],
  capabilities: 'Capacidades clave',
  stack: 'Stack técnico',
  production: 'En producción',
  preview: 'Vista del producto',
  seeCase: 'Ver el caso',
  flowLabels: { in: 'Entra', core: 'Plataforma MTi', out: 'Sale' },
  hint: 'Pulsa un agente para verlo por dentro',
  src: [13, 30],
};

/**
 * Cada agente, tal y como lo describe su pareja de diapositivas (ficha +
 * «qué entra, qué sale»). `cases` enlaza con los casos donde aparece.
 */
export const AG_AGENTS = [
  {
    id: 'C01',
    short: 'Email',
    icon: 'mail',
    area: 'Operaciones de email',
    name: 'Agente de Correo',
    tagline: 'Su buzón corporativo trabajando solo, 24/7.',
    catalog: 'Bandeja operativa 24/7, en su idioma.',
    body: 'Vigila el buzón, lee cada correo, extrae la intención y compone un borrador fundamentado en su documentación. El operario revisa, no redacta.',
    capabilities: [
      'Atención 24/7 del correo entrante',
      'Respuestas con RAG sobre su documentación',
      'Trazabilidad completa por conversación',
      'Bandeja de validación con un clic',
      'Aprende sus plantillas y su tono',
      'Escribe en el ERP desde la conversación',
    ],
    stack: ['LangGraph', 'LLM', 'IMAP', 'RAG', 'Microsoft Graph', 'ERP'],
    clients: ['GALMETEC', 'RCFIL'],
    inputs: [
      { icon: 'mail', logos: ['gmail'], label: 'Gmail', sub: 'Buzón vía IMAP' },
      { icon: 'mail', logos: ['outlook'], label: 'Outlook / 365', sub: 'Microsoft Graph' },
      { icon: 'doc', logos: ['pdf'], label: 'Adjuntos', sub: 'Pedidos, PDFs, planos' },
      { icon: 'book', label: 'Su documentación', sub: 'Base de conocimiento' },
    ],
    steps: ['Extrae la intención de cada correo', 'Recupera contexto con RAG', 'Redacta el borrador con su tono', 'Bandeja de validación con un clic'],
    outputs: [
      { icon: 'send', label: 'Respuesta enviada', sub: 'Aprobada por el operario' },
      { icon: 'database', logos: ['odoo', 'sap'], label: 'Odoo · SAP', sub: 'Acción escrita en el ERP' },
      { icon: 'check', label: 'Traza completa', sub: 'Por conversación' },
    ],
    mockup: {
      kind: 'email',
      title: 'Vista del borrador',
      from: 'comercial@cliente.eu',
      message: '¿Confirmáis que el pedido 2024-0871 ha salido? Necesito el albarán.',
      draftLabel: 'Borrador generado',
      draft: 'Sí, salió ayer a las 14:20. Adjunto albarán A-9981. Quedamos a su disposición.',
      approve: 'Aprobar',
      edit: 'Editar',
    },
    src: [31, 32],
  },
  {
    id: 'C02',
    short: 'Ofertas',
    icon: 'table',
    area: 'Licitaciones y ofertas',
    name: 'Licitación & Oferta',
    tagline: 'Del expediente de licitación al BC3 firmado en dos horas.',
    catalog: 'Pliego a BC3 firmado en dos horas.',
    body: 'Recibe el pliego, rescata precios reales de su histórico, calcula la oferta y emite una hoja de pre-cierre con go/no-go. No es una respuesta genérica: es una oferta defendible.',
    capabilities: [
      'Análisis automático de PCAP, PPT y anexos',
      'Recuperación de precios por similitud',
      'Rango de incertidumbre por partida',
      'Hoja de pre-cierre con go/no-go',
      'Salidas BC3, Excel y PDF',
      'Trazabilidad hasta la fuente histórica',
    ],
    stack: ['LLM', 'RAG', 'OCR', 'BC3', 'Python'],
    clients: ['FERRI', 'COPEGAL'],
    review: 'La ficha del agente (diapositiva 33) dice «COPECAL» y la de entradas y salidas (34) «COPEGAL». Se usa COPEGAL; confirmar.',
    inputs: [
      { icon: 'doc', logos: ['pdf'], label: 'Pliego PCAP', sub: 'Cláusulas administrativas' },
      { icon: 'doc', logos: ['word'], label: 'PPT y anexos', sub: 'Prescripciones técnicas' },
      { icon: 'database', logos: ['excel'], label: 'Histórico de precios', sub: 'Sus ofertas anteriores' },
      { icon: 'image', label: 'Escaneados', sub: 'Lectura OCR' },
    ],
    steps: ['Analiza pliego, capítulos y partidas', 'Recupera precios por similitud', 'Rango de incertidumbre por partida', 'Recomendación go / no-go'],
    outputs: [
      { icon: 'table', label: 'Fichero BC3', sub: 'Presupuesto estándar' },
      { icon: 'doc', logos: ['excel', 'pdf'], label: 'Pre-cierre · PDF', sub: 'Excel por partida, oferta defendible' },
      { icon: 'check', label: 'Go / no-go', sub: 'Concurrir o no' },
    ],
    mockup: {
      kind: 'tender',
      title: 'Hoja de pre-cierre',
      rows: [
        ['Expediente', 'Rehabilitación CEIP-248'],
        ['Base', '1 243 800 €'],
        ['Rango', '± 4,8%'],
        ['Capítulos', '14'],
        ['Baja temeraria', '−12,4%'],
      ],
      verdictLabel: 'Recomendación',
      verdict: 'Concurrir',
      note: '3 partidas sin histórico · verificación recomendada · 4 días',
    },
    src: [33, 34],
  },
  {
    id: 'C03',
    short: 'Voz',
    icon: 'mic',
    area: 'Operaciones de voz',
    name: 'Agente de Voz',
    tagline: 'Atención telefónica autónoma sobre su centralita actual.',
    catalog: 'Llamadas atendidas, estructuradas, escaladas.',
    body: 'Se integra como extensión SIP en su centralita existente. Atiende en español e inglés, registra datos estructurados y transfiere al humano con todo el contexto.',
    capabilities: [
      'Conversación natural 24/7 en español e inglés',
      'Hasta cinco llamadas concurrentes en el caso base',
      'Registro estructurado con grabación y transcripción',
      'Traspaso inteligente al humano con contexto',
      'Extensión SIP, sin cambiar la centralita',
      'Dashboard con transcripción y métricas',
    ],
    stack: ['FreeSWITCH', 'Whisper', 'LangGraph', 'Azure TTS', 'SIP'],
    clients: ['FRIOTEIS', 'ASPOL'],
    inputs: [
      { icon: 'phone', label: 'Llamada entrante', sub: 'Extensión SIP' },
      { icon: 'network', label: 'Su centralita', sub: 'Sin cambiarla' },
      { icon: 'mic', logos: ['openai'], label: 'Voz del cliente', sub: 'Español e inglés' },
    ],
    steps: ['Transcribe la voz en tiempo real', 'Conversa y decide 24/7', 'Responde con voz natural', 'Hasta 5 llamadas concurrentes'],
    outputs: [
      { icon: 'mic', logos: ['azure'], label: 'Respuesta hablada', sub: 'Azure TTS' },
      { icon: 'user', label: 'Traspaso al humano', sub: 'Con todo el contexto' },
      { icon: 'doc', label: 'Registro estructurado', sub: 'Grabación y transcripción' },
      { icon: 'chart', label: 'Dashboard', sub: 'Transcripción y métricas' },
    ],
    mockup: {
      kind: 'call',
      title: 'Llamada en curso',
      live: 'En vivo',
      time: '02:14',
      callerLabel: 'Llamante',
      // el número de la presentación se enmascara: no se enseña un teléfono completo
      caller: '+34 612 ··· 290',
      transcriptLabel: 'Transcripción',
      transcript: '«Es la unidad AX-2204, lleva fallando desde ayer; la pantalla marca 28 °C.»',
    },
    src: [35, 36],
  },
  {
    id: 'C04',
    short: 'CRM',
    icon: 'user',
    area: 'Inteligencia comercial',
    name: 'Agente CRM',
    tagline: 'Tu CRM al día sin que el comercial lo toque.',
    catalog: 'CRM al día. Pipeline enriquecido.',
    body: 'Lee el correo de los comerciales, extrae la señal y actualiza Odoo: actividades, etapas, tareas. Detecta oportunidades inactivas y emite alertas. El comercial deja de transcribir y se dedica a vender.',
    capabilities: [
      'CRM siempre actualizado',
      'Detección de oportunidades inactivas',
      'Alertas accionables al comercial',
      'Modos automático y supervisado',
      'Trazabilidad por acción',
      'Log inmutable para auditoría',
    ],
    stack: ['LangGraph', 'LLM', 'IMAP', 'Odoo API'],
    clients: ['MU Córtex', 'RCFIL'],
    inputs: [
      { icon: 'mail', logos: ['gmail'], label: 'Gmail', sub: 'Correo comercial vía IMAP' },
      { icon: 'mail', logos: ['outlook'], label: 'Outlook / 365', sub: 'Correo comercial' },
      { icon: 'message', label: 'Hilos con clientes', sub: 'Señales de venta' },
    ],
    steps: ['Extrae la señal de cada correo', 'Actualiza actividades, etapas y tareas', 'Detecta oportunidades inactivas', 'Modo automático o supervisado'],
    outputs: [
      { icon: 'database', logos: ['odoo'], label: 'Odoo CRM', sub: 'Siempre actualizado' },
      { icon: 'network', logos: ['hubspot', 'salesforce'], label: 'HubSpot · Salesforce', sub: 'CRM sincronizado' },
      { icon: 'alert', label: 'Alertas al comercial', sub: 'Accionables, con log' },
    ],
    mockup: {
      kind: 'crm',
      title: 'Panel de actividad',
      kpis: [
        ['147', 'Actividades'],
        ['38', 'Tareas'],
        ['12', 'Alertas'],
        ['09', 'Inactivas'],
      ],
      lastLabel: 'Última actividad',
      last: 'Oportunidad NAUTIA-2025-118 movida a Negociación; tarea creada.',
    },
    src: [37, 38],
  },
  {
    id: 'C05',
    short: 'Pedidos',
    icon: 'cart',
    area: 'Pedidos multicanal',
    name: 'Pedidos Multicanal',
    tagline: 'Adiós al grabado manual de pedidos.',
    catalog: 'Correos a ERP, con el stock en cuenta.',
    body: 'Lee los correos de pedido, los interpreta en lenguaje natural, los cruza con el catálogo y el stock y crea el pedido en su ERP. Si el ERP no escribe por API, lo deja en su propio módulo.',
    capabilities: [
      'Fin del grabado nocturno manual',
      'Aprende patrones por cliente',
      'Cruce con catálogo y stock',
      'Detecta inconsistencias antes de comprometer stock',
      'Modos automático y supervisado',
      'Módulo propio de respaldo si el ERP no escribe',
    ],
    stack: ['LangGraph', 'LLM', 'IMAP', 'Odoo API', 'WhatsApp'],
    clients: ['PROMEGA', 'UCALSA'],
    inputs: [
      { icon: 'mail', logos: ['gmail', 'outlook'], label: 'Email · Outlook', sub: 'Pedidos por correo' },
      { icon: 'message', logos: ['whatsapp'], label: 'WhatsApp', sub: 'Pedidos por mensaje' },
      { icon: 'doc', logos: ['pdf'], label: 'Pedido adjunto', sub: 'PDF del cliente' },
    ],
    steps: ['Interpreta el pedido en lenguaje natural', 'Aprende los patrones de cada cliente', 'Cruza con catálogo y stock', 'Detecta inconsistencias'],
    outputs: [
      { icon: 'database', logos: ['odoo', 'sap'], label: 'Pedido en Odoo · SAP', sub: 'Alta vía API' },
      { icon: 'alert', label: 'Incidencia de stock', sub: 'Antes de comprometer' },
      { icon: 'box', label: 'Módulo de respaldo', sub: 'Si el ERP no escribe' },
    ],
    mockup: {
      kind: 'order',
      title: 'Pedido detectado',
      clientLabel: 'Cliente',
      client: 'PROMEGA',
      lines: [
        ['Ref. A-2204', '× 50', 'ok'],
        ['Ref. A-1188', '× 30', 'ok'],
        ['Ref. A-3001', '12 / 20', 'warn'],
      ],
      statusLabel: 'Estado',
      status: 'Incidencia de stock',
      action: 'Revisar',
    },
    src: [39, 40],
  },
  {
    id: 'C06',
    short: 'Documentos',
    icon: 'truck',
    area: 'Albaranes y documentación',
    name: 'Albaranes Automáticos',
    tagline: 'Genera, envía y concilia. Sin Excel.',
    catalog: 'Notas, facturas, conciliación.',
    body: 'Cuando se cierra una expedición, el sistema genera el albarán, lo envía al cliente y al cierre del día concilia expedido contra facturado. Las discrepancias se elevan al responsable.',
    capabilities: [
      'Generación en PDF, Excel y EDI',
      'Plantilla con su logo y datos',
      'Envío al contacto del cliente',
      'Conciliación expedido vs facturado',
      'Detección de discrepancias en tiempo real',
      'Trazabilidad documental auditable',
    ],
    stack: ['LLM', 'LangGraph', 'Odoo API', 'SMTP / Graph', 'EDI'],
    clients: ['GALPI', 'PRISA'],
    inputs: [
      { icon: 'truck', logos: ['odoo'], label: 'Expedición cerrada', sub: 'Odoo API' },
      { icon: 'box', label: 'Datos de envío', sub: 'Bultos, unidades, kg' },
      { icon: 'image', label: 'Su plantilla', sub: 'Logo y datos de empresa' },
    ],
    steps: ['Genera el albarán', 'Formato según cada cliente', 'Envía y registra el acuse', 'Concilia expedido vs facturado'],
    outputs: [
      { icon: 'doc', logos: ['pdf', 'excel'], label: 'Albarán PDF · Excel', sub: 'Con su plantilla' },
      { icon: 'send', logos: ['outlook'], label: 'Enviado al cliente', sub: 'SMTP / Graph' },
      { icon: 'alert', label: 'Discrepancias', sub: 'Conciliación del día' },
    ],
    mockup: {
      kind: 'delivery',
      title: 'Albarán en proceso',
      rows: [
        ['Documento', 'Albarán A-9981 · PDF + XLS'],
        ['Cliente', 'GALPI'],
        ['Pedido', '2025-1042'],
        ['Líneas', '3 · 220 uds · 1.847 kg'],
      ],
      sent: 'Enviado',
      ack: 'Acuse',
      recLabel: 'Conciliación del día',
      rec: ['47', 'expediciones', '1 discrepancia'],
    },
    src: [41, 42],
  },
  {
    id: 'C07',
    short: 'Conocimiento',
    icon: 'book',
    area: 'Inteligencia documental',
    name: 'Asistente de Conocimiento',
    tagline: 'Tu documentación interna, consultable en lenguaje natural.',
    catalog: 'Tu documentación, localizable al instante.',
    body: 'Convierte manuales, normativa y procedimientos en una base consultable en lenguaje natural. Cada respuesta cita el documento y la sección. Combina búsqueda vectorial y grafo.',
    capabilities: [
      'Acceso instantáneo a la información interna',
      'Citas al documento y a la sección',
      'Búsqueda híbrida: vectorial + grafo',
      'Detección automática de huecos documentales',
      'Permisos por colección y por usuario',
      'Chat web + extensión de navegador',
    ],
    stack: ['RAG', 'LLM', 'Neo4j', 'Qdrant', 'Embeddings', 'OCR'],
    clients: ['REGENASA', 'FERRI'],
    inputs: [
      { icon: 'book', logos: ['pdf'], label: 'Manuales', sub: 'Documentación técnica' },
      { icon: 'doc', logos: ['word'], label: 'Procedimientos', sub: 'Instrucciones internas' },
      { icon: 'shield', label: 'Normativa', sub: 'Requisitos aplicables' },
      { icon: 'image', label: 'Escaneados', sub: 'Lectura OCR' },
    ],
    steps: ['Indexa con embeddings vectoriales', 'Relaciona el contenido en grafo', 'Búsqueda híbrida: vector + grafo', 'Permisos por colección y usuario'],
    outputs: [
      { icon: 'message', logos: ['chrome'], label: 'Respuesta con fuentes', sub: 'Documento y sección' },
      { icon: 'alert', label: 'Huecos documentales', sub: 'Detectados solos' },
      { icon: 'lock', label: 'Acceso controlado', sub: 'Por colección y usuario' },
    ],
    mockup: {
      kind: 'rag',
      title: 'Pregunta',
      question: '¿Qué controles hay que hacer antes de expedir y qué normativa los exige?',
      answerLabel: 'Respuesta con fuentes',
      answer: 'Cámara a ≤ 4 °C. Verificación visual antes del cierre. Firma del responsable en la hoja.',
      sources: ['Manual de calidad §4.2', 'ISO 22000 §8.4.1', 'CE 853/2004 Anexo II'],
    },
    src: [43, 44],
  },
  {
    id: 'C08',
    short: 'Calidad',
    icon: 'alert',
    area: 'Calidad y respuesta',
    name: 'Incidencias & Calidad',
    tagline: 'Del reporte por voz al cierre con causa raíz documentada.',
    catalog: 'Cada incidencia capturada, clasificada y resuelta.',
    body: 'El operario reporta desde el móvil: formulario, voz o foto. El sistema clasifica, asigna al responsable y consulta la normativa aplicable. Cierre con acción correctiva trazable.',
    capabilities: [
      'Captura multimodal: formulario, voz, foto',
      'Clasificación y priorización automática',
      'Agente normativo con cita aplicable',
      'Flujo de resolución configurable',
      'Notificaciones con SLA por gravedad',
      'Informes automáticos de calidad',
    ],
    stack: ['LangGraph', 'LLM', 'RAG', 'Whisper', 'OCR', 'React'],
    clients: ['FRIOTEIS', 'NAUTIA'],
    inputs: [
      { icon: 'phone', label: 'Formulario móvil', sub: 'App del operario' },
      { icon: 'mic', logos: ['openai'], label: 'Reporte por voz', sub: 'Transcrito con Whisper' },
      { icon: 'image', label: 'Foto de la incidencia', sub: 'Lectura OCR' },
    ],
    steps: ['Clasifica y prioriza la incidencia', 'Cita la normativa aplicable', 'Flujo de resolución configurable', 'Notifica según SLA de gravedad'],
    outputs: [
      { icon: 'alert', label: 'Notificación', sub: 'Al responsable, con SLA' },
      { icon: 'wrench', label: 'Acción correctiva', sub: 'Cierre trazable' },
      { icon: 'chart', label: 'Informe de calidad', sub: 'Generado automáticamente' },
    ],
    mockup: {
      kind: 'nc',
      title: 'NC reportada',
      area: 'Recepción',
      code: 'NC-2025-0418',
      severity: 'Alta',
      finding: 'Salmón a 6 °C · máximo 4 °C',
      productLabel: 'Producto',
      product: 'Salmón fresco',
      sla: 'SLA 24 h',
      normLabel: 'Normativa citada',
      norms: ['ISO 22000 §8.4.1', 'Reglamento CE 853/2004'],
    },
    src: [45, 46],
  },
];

/* ================================================================== */
/* 4 · Catorce despliegues                                              */
/* ================================================================== */

export const AG_CASES_META = {
  kicker: 'Catorce despliegues en producción',
  title: ['Clientes reales.', 'Números reales.'],
  lead: 'Integración real con sus sistemas existentes. Filtra por agente para ver dónde trabaja cada uno.',
  all: 'Todos',
  agentsLabel: 'Agentes en este caso',
  doesLabel: 'Qué hace',
  connectedLabel: 'Conectado a',
  open: 'Abrir el caso',
  back: 'Todos los casos',
  flowTitle: 'Cómo funciona',
  flowLabels: { in: 'Entra', core: 'Solución MTi', out: 'Sale' },
  src: [14],
};

/**
 * Casos, en el orden de la presentación. `visual` es la imagen de fondo
 * (fotografía o gráfico de la propia diapositiva); si no hay, se compone con
 * el logo. Las cifras cualitativas («Alto ↓», «Cero»…) se enseñan tal cual.
 */
export const AG_CASES = [
  {
    id: 'coplegal',
    client: 'COPLEGAL',
    aliases: ['COPEGAL', 'COPECAL'],
    sector: 'Fabricación · racores y herrajes',
    solution: 'Agente de configuración y cálculo',
    title: 'Cotizaciones que se construyen solas.',
    body: 'Estandariza y agiliza la preparación de cotizaciones integrando datos del ERP, documentación histórica y tarifas. Lee cada PDF, extrae parámetros, calcula cada línea y devuelve la oferta al ERP con trazabilidad completa.',
    profile: 'Fabricante de racores, soportes y herrajes de precisión.',
    since: 'En producción desde 2024',
    agents: [
      { id: 'C02', role: 'Composición de oferta' },
      { id: 'C07', role: 'Tarifas e histórico' },
      { id: 'C06', role: 'Salida justificada' },
      { id: 'C01', role: 'Solicitudes entrantes' },
    ],
    metrics: [
      { value: '−80%', label: 'Ciclo de cotización' },
      { value: '−40%', label: 'Errores manuales' },
      { value: '100%', label: 'Trazable' },
      { value: '24/7', label: 'Capacidad de cotización' },
    ],
    does: ['Lee PDFs y planos', 'Extrae el material', 'Calcula línea, tiempo estándar y margen', 'Aplica tarifas e histórico', 'Documento final con justificación'],
    visual: 'ag-case-coplegal',
    logo: 'client-copegal',
    review:
      'La diapositiva 15 dice «COPLEGAL»; la portada, los resultados agregados y el logo dicen «COPEGAL». El −80% coincide con el de COPEGAL. Confirmar si es el mismo cliente y unificar el nombre.',
    src: [15],
  },
  {
    id: 'rcfil',
    client: 'RCFIL',
    sector: 'Logística y freight',
    solution: 'Suite de automatización logística',
    title: 'Consultas convertidas en pedidos, automáticamente.',
    body: 'Lee cada solicitud de transporte, consulta APIs de freight, calcula reposiciones, redacta la respuesta y la escribe en CRM y ERP, con trazabilidad completa.',
    profile: 'Operador logístico: gestiona solicitudes, ciclos de reposición y respuestas.',
    agents: [{ id: 'C01' }, { id: 'C05' }, { id: 'C04' }],
    metrics: [
      { value: '−65%', label: 'Gestión de consultas' },
      { value: '24/7', label: 'Captura' },
      { value: '100%', label: 'Trazable' },
      { value: '3×', label: 'Uptime de reservas' },
    ],
    does: ['Clasifica consultas', 'Detecta reposiciones', 'Consulta tarifas y APIs', 'Reserva y responde'],
    visual: 'ag-graphic-rcfil',
    visualKind: 'graphic',
    logo: 'client-rcfil',
    src: [16],
  },
  {
    id: 'ferri',
    client: 'FERRI',
    sector: 'Maquinaria industrial',
    solution: 'Configurador inteligente de ofertas',
    title: 'Ofertas técnicas, procesadas.',
    body: 'Analiza documentación técnica, identifica parámetros, busca el histórico del ERP y ejecuta el motor de analogía sobre coste y horas, elaborando la oferta lista para revisión.',
    profile: 'Fabricante de maquinaria industrial para mercados marino e industrial.',
    agents: [
      { id: 'C02', role: 'Estructuración de ofertas' },
      { id: 'C07', role: 'Proyectos históricos' },
      { id: 'C06', role: 'Salidas y reportes' },
      { id: 'C08', role: 'Control de variabilidad' },
    ],
    metrics: [
      { value: '−70%', label: 'Tiempo de preparación de oferta' },
      { value: '−40%', label: 'Variabilidad' },
      { value: '100%', label: 'Reuso de know-how' },
    ],
    pipeline: {
      label: 'Flujo de especialistas',
      items: ['Reader', 'Parameters', 'Historical', 'Project', 'Estimating', 'Departures'],
      note: 'Seis especialistas orquestados en un único flujo de oferta.',
    },
    logo: 'client-ferri',
    src: [17],
  },
  {
    id: 'regenasa',
    client: 'REGENASA',
    sector: 'Outfitting naval',
    solution: 'Workspace de ofertas',
    title: 'Ciclos más cortos. Menos desajustes.',
    body: 'Centraliza información dispersa (correos, planos DWG/PDF, especificaciones), detecta versiones automáticamente, asiste ante planos incompletos con históricos navales y redacta memorandos técnicos listos para revisión experta.',
    agents: [
      { id: 'C02', role: 'Generación de memo' },
      { id: 'C07', role: 'RAG histórico naval' },
      { id: 'C01', role: 'Documentos entrantes' },
      { id: 'C08', role: 'Diferencias de versión' },
    ],
    metrics: [
      { value: '−55%', label: 'Ciclos de oferta' },
      { value: 'Cero', label: 'Desajuste de versión' },
      { value: '100%', label: 'Explicable' },
      { value: '4', label: 'Especialistas' },
    ],
    pipeline: {
      label: 'Especialistas por oferta',
      items: ['Ingestion & Versioning', 'Drawing Change Detection', 'Plan Interpretation', 'Technical Memo Generator'],
      note: 'Orquestados por un agente.',
    },
    visual: 'ag-graphic-regenasa',
    visualKind: 'graphic',
    logo: 'ag-logo-regenasa',
    src: [18],
  },
  {
    id: 'galmetec',
    client: 'GALMETEC',
    sector: 'Mecanizado de precisión',
    solution: 'Estimación automática de tiempos desde CAD',
    title: 'Tiempos de mecanizado desde planos, no desde expertos.',
    body: 'Lee planos técnicos 2D (PDF/DXF) y modelos 3D (STEP/IGES), aplica heurísticas explícitas de proceso y corrige cada tiempo con un modelo de ML entrenado con la producción y los históricos reales. Defendible, trazable y sin depender solo del experto.',
    profile: 'Empresa de fabricación metálica especializada en mecanizado de precisión, con fuerte dependencia de ingeniería de proceso y estimación de tiempos.',
    agents: [
      { id: 'C07', role: 'Búsqueda de CAD y estimación previa' },
      { id: 'C02', role: 'Conecta estimaciones a ofertas' },
      { id: 'C08', role: 'Corrección predictiva y validación' },
    ],
    metrics: [
      { value: 'Alto ↓', label: 'Reducción de tiempos' },
      { value: 'Bajo ↓', label: 'Dependencia del experto' },
      { value: 'Explicable', label: 'Estimaciones defendibles, sin caja negra' },
    ],
    connected: ['Planos 2D PDF/DXF', 'Modelos 3D STEP/IGES', 'Datos de producción', 'ML correctivo', 'Repositorios CAD'],
    visual: 'ag-case-galmetec',
    logo: 'client-galmetec',
    src: [19],
  },
  {
    id: 'prisa',
    client: 'Radio Vigo · Grupo PRISA',
    sector: 'Medios · Galicia',
    solution: 'Control de calidad de emisión',
    title: 'Salta la revisión manual. Revisa solo los incidentes.',
    body: 'Escucha emisiones en vivo y grabadas, detecta silencios, cortes y errores de voz. Los operadores consultan una interfaz web, revisan solo los incidentes marcados, y el agente estandariza criterios y exporta resultados a Excel y Odoo.',
    agents: [
      { id: 'C03', role: 'Análisis y segmentación de audio' },
      { id: 'C08', role: 'Detección de incidentes' },
      { id: 'C06', role: 'Exportación a Excel y Odoo' },
      { id: 'C04', role: 'Flujo de revisión web' },
    ],
    metrics: [
      { value: 'Ahorro', label: 'Tiempo de revisión: sin escuchar grabaciones' },
      { value: 'Total', label: 'Detección homogénea: mismos criterios por operador' },
      { value: '100%', label: 'Trazabilidad: cada corte marcado y registrado' },
    ],
    connected: ['Sistemas de grabación', 'Excel', 'Odoo', 'Análisis de audio'],
    visual: 'ag-case-prisa',
    logo: 'client-radiovigo',
    src: [20],
  },
  {
    id: 'promega',
    client: 'PROMEGA',
    sector: 'Fabricación industrial · España',
    solution: 'Estimación de tiempos de fabricación desde CAD',
    title: 'Predice el tiempo de fabricación directamente desde STEP.',
    body: 'Lee piezas CAD en formato STEP, extrae geometría y rasgos relevantes, y aprovecha datos históricos y patrones previos de producción. Cada estimación sale como una predicción estructurada por operación: precisa, explicable y consistente.',
    agents: [
      { id: 'C07', role: 'RAG sobre operaciones históricas' },
      { id: 'C02', role: 'Alimenta cotizaciones' },
      { id: 'C05', role: 'Planificación posterior' },
    ],
    metrics: [
      { value: 'Más rápido', label: 'Generación de estimaciones' },
      { value: 'Alta ↑', label: 'Tasa de acierto' },
      { value: 'Autonomía', label: 'Menos dependencia del experto' },
    ],
    connected: ['Archivos STEP', 'Histórico de fabricación', 'ERP y MES', 'Repositorios CAD'],
    visual: 'ag-case-promega',
    logo: 'ag-logo-promega',
    src: [21],
  },
  {
    id: 'ucalsa',
    client: 'UCALSA',
    sector: 'Producción basada en datos',
    solution: 'Planificación inteligente de producción',
    title: 'Planes que aguantan, incluso cuando todo cambia.',
    body: 'Estima tiempos de producción desde el histórico del ERP, construye automáticamente planes viables respetando capacidades y restricciones, y simula escenarios ante pedidos urgentes o cambios de recursos: menos Excel, más decisiones.',
    agents: [
      { id: 'C05', role: 'Planificación y órdenes' },
      { id: 'C07', role: 'Biblioteca de escenarios' },
      { id: 'C06', role: 'Salidas y reportes' },
    ],
    modules: [
      { title: 'Estimación de tiempos', body: 'Aprende del histórico del ERP.' },
      { title: 'Planificación automática', body: 'Planes viables, capacidades y restricciones.' },
      { title: 'Simulación de escenarios', body: 'Urgencias, cambios, restricciones.' },
    ],
    metrics: [
      { value: '+', label: 'Mejor planificación' },
      { value: '−', label: 'Dependencia de Excel' },
      { value: '↑', label: 'Decisiones · mayor adherencia al plan' },
    ],
    logo: 'ag-logo-ucalsa',
    src: [22],
  },
  {
    id: 'galpi',
    client: 'GALPI',
    sector: 'Cálculo de tarifas',
    solution: 'Agente de pricing · Odoo + ARPA',
    title: 'Cotizaciones que se actualizan mientras negocias.',
    body: 'Automatiza el cálculo de tarifas integrándose con Odoo como ERP central y ARPA como motor especializado de tarifas. Elimina las hojas de cálculo manuales, garantiza la coherencia entre sistemas y recalcula las ofertas antes de la negociación y de las revisiones financieras.',
    agents: [
      { id: 'C02', role: 'Configuración y cálculo de tarifas' },
      { id: 'C05', role: 'Conexión de pedidos' },
      { id: 'C06', role: 'Generación de ofertas y documentos' },
    ],
    metrics: [
      { value: '−65%', label: 'Preparación de ofertas: de días a horas' },
      { value: '+9%', label: 'Margen medio · motor de descuentos' },
      { value: '100%', label: 'Tarifas coherentes · 0% manual' },
    ],
    connected: ['Odoo', 'ARPA'],
    logo: 'client-galpi',
    src: [23],
  },
  {
    id: 'sigi',
    client: 'SIGI · SERGAS',
    sector: 'Salud · Hospital Álvaro Cunqueiro',
    solution: 'Asistente del CAU en tiempo real',
    title: 'Asistencia permanente para el personal clínico.',
    body: 'Da soporte al CAU hospitalario (SIGI) mediante análisis de voz en tiempo real, extracción automática de la información de cada incidencia e integración directa vía API con Plexus. Privacidad desde el diseño: procesamiento efímero, sin almacenamiento de audio y conforme al RGPD.',
    agents: [
      { id: 'C03', role: 'Análisis de voz' },
      { id: 'C08', role: 'Clasificación de incidencias' },
      { id: 'C04', role: 'Flujo de trabajo' },
    ],
    metrics: [
      { value: 'Tiempo real', label: 'De la voz al dato' },
      { value: '100%', label: 'Privacidad · sin audio almacenado' },
      { value: 'IA avanzada', label: 'Entorno crítico' },
    ],
    does: ['Análisis de voz en tiempo real', 'Estructuración de incidencias', 'Integración API con Plexus', 'Privacidad desde el diseño'],
    connected: ['SIGI / CAU Plexus'],
    visual: 'ag-case-sigi',
    logo: 'client-sergas',
    src: [24],
  },
  {
    id: 'frioteis',
    client: 'FRIOTEIS',
    sector: 'Cadena de frío · Galicia',
    solution: 'Almacenes frigoríficos · 9 especialistas',
    title: 'Marisco, congelado, fresco. Sin stock a ciegas.',
    body: 'Recepción controlada por voz, lectura de etiquetas con visión y OCR en condiciones extremas, seguimiento de activos en interiores con RTLS, documentación de exportación y RAG sobre procedimientos internos, con modelos de ML para prever energía y ocupación.',
    agents: [
      { id: 'C03', role: 'Recepción manos libres' },
      { id: 'C05', role: 'Pedidos desde email' },
      { id: 'C06', role: 'Documentación aduanera y logística' },
      { id: 'C07', role: 'RAG sobre procedimientos' },
      { id: 'C08', role: 'ML para energía y anomalías' },
    ],
    metrics: [
      { value: '3×', label: 'Recepción más rápida' },
      { value: '−28%', label: 'Pérdidas de frío' },
      { value: 'Cero', label: 'Entradas manuales' },
      { value: '10–20%', label: 'Ahorro energético' },
    ],
    connected: ['WMS / ERP', 'Escáneres', 'RTLS', 'Email', 'Aduanas', 'IoT · SCADA'],
    visual: 'ag-case-frioteis',
    logo: 'ag-logo-frioteis',
    src: [25],
  },
  {
    id: 'aspol',
    client: 'ASPOL',
    sector: 'Operaciones y transporte',
    solution: 'Carga 3D · rutas VRP · documentación',
    title: 'Menos camiones en ruta, cero errores en papel.',
    body: 'Empaquetado 3D que aprovecha el camión, rutas VRP que minimizan kilómetros, y generación y prevalidación automática de albaranes, CMR y facturas desde los pedidos de Odoo.',
    profile: 'Operador logístico centrado en optimizar la gestión de transporte.',
    agents: [
      { id: 'C05', role: 'Pedidos desde Odoo' },
      { id: 'C06', role: 'Genera y valida documentos' },
      { id: 'C07', role: 'Conocimiento para decidir' },
    ],
    metrics: [
      { value: 'Menos', label: 'Viajes y costes' },
      { value: 'Cero', label: 'Errores administrativos' },
      { value: '100%', label: 'Prevalidado' },
    ],
    does: ['Empaquetado 3D del camión', 'Rutas VRP óptimas', 'Albaranes, CMR, ECI y facturas', 'Prevalidación antes de emitir'],
    connected: ['Odoo ERP', 'Empaquetado 3D', 'APIs VRP', 'Flota / GPS'],
    visual: 'ag-case-aspol',
    logo: 'ag-logo-aspol',
    src: [26],
  },
  {
    id: 'nautia',
    client: 'NAUTIA',
    sector: 'Conocimiento y regulación',
    solution: 'Agente de conocimiento y regulación',
    title: 'El conocimiento corporativo, convertido en activo estratégico.',
    body: 'Centraliza documentos técnicos, legales y regulatorios. Responde consultas según el rol con RAG y grafo de conocimiento, detecta lagunas regulatorias, analiza el impacto sobre productos y procesos afectados y responde con fuentes totalmente auditables.',
    agents: [
      { id: 'C07', role: 'RAG + grafo' },
      { id: 'C08', role: 'Control regulatorio' },
      { id: 'C02', role: 'Cumplimiento en ofertas' },
    ],
    metrics: [
      { value: 'Reducción ↓', label: 'Riesgo legal y de compliance' },
      { value: 'Rapidez ↑', label: 'Respuestas de la organización' },
      { value: 'Con citas', label: 'Fuentes auditables · compliance proactivo' },
    ],
    visual: 'ag-case-nautia',
    review: 'La diapositiva 27 lleva el logo de Merchant Union, no el de NAUTIA. No se enseña ningún logo hasta confirmar la relación.',
    src: [27],
  },
  {
    id: 'tecnicas',
    client: 'Técnicas del Mar',
    sector: 'Naval e industria',
    solution: 'Automatización de operaciones sobre Odoo',
    title: 'Operabilidad real sobre el ERP.',
    body: 'Mejora y automatiza procesos operativos con Odoo ERP/CRM como núcleo central de datos. Sobre esa base se incorporan agentes de cálculo que comparten un único histórico operativo: el trabajo manual repetitivo se sustituye por una operación basada en IA, compartida y trazable.',
    agents: [
      { id: 'C01', role: 'Agente de correo' },
      { id: 'C04', role: 'Odoo CRM' },
      { id: 'C05', role: 'Cálculos y estimaciones' },
      { id: 'C06', role: 'Salidas operativas' },
    ],
    metrics: [
      { value: 'IA ↑', label: 'Operabilidad real integrada' },
      { value: '100%', label: 'Reutilización de agentes' },
      { value: 'Base común', label: 'Trazabilidad y menos trabajo manual' },
    ],
    connected: ['Odoo ERP/CRM', 'Email', 'Histórico operativo', 'Reglas de negocio'],
    visual: 'ag-case-tecnicas',
    review:
      'El texto de la diapositiva 28 está cortado («un agente de, todos compartiendo…»): se ha omitido ese agente. La diapositiva lleva el logo de Merchant Union; no se enseña logo hasta confirmar.',
    src: [28],
  },
];


/**
 * «Cómo funciona» de cada caso: qué entra, qué hace la solución y qué sale.
 * Todo sale del texto de su diapositiva; los logos, solo cuando la
 * herramienta aparece nombrada en ella (Odoo, Excel, PDF…).
 */
export const AG_CASE_FLOWS = {
  coplegal: {
    inputs: [
      { logos: ['pdf'], label: 'PDFs y planos', sub: 'Solicitudes de cotización' },
      { icon: 'database', label: 'Datos del ERP', sub: 'Material y producto' },
      { icon: 'table', label: 'Tarifas e histórico', sub: 'Documentación previa' },
    ],
    steps: ['Lee PDFs y planos', 'Extrae el material', 'Calcula línea, tiempo y margen', 'Aplica tarifas e histórico'],
    outputs: [
      { icon: 'doc', label: 'Oferta justificada', sub: 'Documento final' },
      { icon: 'database', label: 'Oferta en el ERP', sub: 'Devuelta automáticamente' },
      { icon: 'check', label: 'Trazabilidad completa' },
    ],
  },
  rcfil: {
    inputs: [
      { icon: 'mail', label: 'Solicitudes de transporte', sub: 'Consultas entrantes' },
      { icon: 'network', label: 'APIs de freight', sub: 'Tarifas' },
      { icon: 'box', label: 'Ciclos de reposición' },
    ],
    steps: ['Clasifica consultas', 'Detecta reposiciones', 'Consulta tarifas y APIs', 'Reserva y responde'],
    outputs: [
      { icon: 'send', label: 'Respuesta redactada' },
      { icon: 'user', label: 'CRM y ERP al día', sub: 'Escrito automáticamente' },
      { icon: 'check', label: 'Reserva trazable' },
    ],
  },
  ferri: {
    inputs: [
      { logos: ['pdf'], label: 'Documentación técnica' },
      { icon: 'database', label: 'Histórico del ERP' },
      { icon: 'book', label: 'Proyectos anteriores' },
    ],
    steps: ['Reader', 'Parameters', 'Historical', 'Project', 'Estimating', 'Departures'],
    outputs: [
      { icon: 'doc', label: 'Oferta lista para revisión' },
      { icon: 'chart', label: 'Coste y horas', sub: 'Motor de analogía' },
      { icon: 'check', label: 'Variabilidad controlada' },
    ],
  },
  regenasa: {
    inputs: [
      { icon: 'mail', label: 'Correos' },
      { logos: ['pdf'], label: 'Planos DWG / PDF' },
      { icon: 'doc', label: 'Especificaciones' },
    ],
    steps: ['Ingestion & Versioning', 'Drawing Change Detection', 'Plan Interpretation', 'Technical Memo Generator'],
    outputs: [
      { icon: 'doc', label: 'Memorando técnico', sub: 'Listo para revisión experta' },
      { icon: 'layers', label: 'Versiones detectadas' },
      { icon: 'check', label: 'Explicable' },
    ],
  },
  galmetec: {
    inputs: [
      { logos: ['pdf'], label: 'Planos 2D', sub: 'PDF / DXF' },
      { icon: 'cube', label: 'Modelos 3D', sub: 'STEP / IGES' },
      { icon: 'factory', label: 'Datos de producción', sub: 'Históricos reales' },
    ],
    steps: ['Lee planos y modelos', 'Aplica heurísticas de proceso', 'Corrige con ML', 'Estimación trazable'],
    outputs: [
      { icon: 'clock', label: 'Tiempos de mecanizado' },
      { icon: 'table', label: 'Conectado a ofertas' },
      { icon: 'check', label: 'Estimación defendible' },
    ],
  },
  prisa: {
    inputs: [
      { icon: 'mic', label: 'Emisiones en vivo' },
      { icon: 'play', label: 'Emisiones grabadas', sub: 'Sistemas de grabación' },
    ],
    steps: ['Escucha la emisión', 'Detecta silencios y cortes', 'Marca los incidentes', 'Revisión web del operador'],
    outputs: [
      { logos: ['excel'], label: 'Exportación a Excel' },
      { logos: ['odoo'], label: 'Registro en Odoo' },
      { icon: 'check', label: 'Cada corte registrado' },
    ],
  },
  promega: {
    inputs: [
      { icon: 'cube', label: 'Piezas CAD', sub: 'Archivos STEP' },
      { icon: 'database', label: 'Histórico de fabricación' },
      { icon: 'factory', label: 'ERP y MES' },
    ],
    steps: ['Extrae geometría y rasgos', 'Busca patrones previos', 'Predice por operación', 'Explica la estimación'],
    outputs: [
      { icon: 'clock', label: 'Tiempo por operación' },
      { icon: 'table', label: 'Alimenta cotizaciones' },
      { icon: 'route', label: 'Planificación posterior' },
    ],
  },
  ucalsa: {
    inputs: [
      { icon: 'database', label: 'Histórico del ERP' },
      { icon: 'grid', label: 'Capacidades y restricciones' },
      { icon: 'alert', label: 'Urgencias y cambios' },
    ],
    steps: ['Estimación de tiempos', 'Planificación automática', 'Simulación de escenarios'],
    outputs: [
      { icon: 'route', label: 'Plan viable' },
      { icon: 'layers', label: 'Escenarios comparados' },
      { icon: 'chart', label: 'Menos Excel, más decisiones' },
    ],
  },
  galpi: {
    inputs: [
      { logos: ['odoo'], label: 'Odoo', sub: 'ERP central' },
      { icon: 'gauge', label: 'ARPA', sub: 'Motor de tarifas' },
    ],
    steps: ['Calcula la tarifa', 'Aplica el motor de descuentos', 'Sincroniza los sistemas', 'Recalcula antes de negociar'],
    outputs: [
      { icon: 'doc', label: 'Ofertas y documentos' },
      { icon: 'check', label: 'Tarifas coherentes', sub: '0 % manual' },
      { icon: 'chart', label: 'Margen medio', sub: 'Motor de descuentos' },
    ],
  },
  sigi: {
    inputs: [
      { icon: 'phone', label: 'Llamada al CAU', sub: 'Personal clínico' },
      { icon: 'mic', label: 'Voz en tiempo real', sub: 'Sin almacenar audio' },
    ],
    steps: ['Analiza la voz', 'Extrae los datos', 'Estructura la incidencia', 'La escribe vía API'],
    outputs: [
      { icon: 'ticket', label: 'Incidencia en SIGI', sub: 'CAU Plexus' },
      { icon: 'lock', label: 'Privacidad RGPD', sub: 'Procesamiento efímero' },
      { icon: 'user', label: 'Operador asistido' },
    ],
  },
  frioteis: {
    inputs: [
      { icon: 'mic', label: 'Recepción por voz' },
      { icon: 'camera', label: 'Etiquetas', sub: 'Visión + OCR' },
      { icon: 'signal', label: 'RTLS · IoT' },
      { icon: 'mail', label: 'Pedidos por email' },
    ],
    steps: ['Recepción manos libres', 'Lectura de etiquetas', 'Seguimiento de activos', 'Documentación de exportación', 'Previsión de energía y ocupación'],
    outputs: [
      { icon: 'database', label: 'WMS / ERP al día' },
      { icon: 'doc', label: 'Documentación aduanera' },
      { icon: 'gauge', label: 'Ahorro energético' },
    ],
  },
  aspol: {
    inputs: [
      { logos: ['odoo'], label: 'Pedidos de Odoo' },
      { icon: 'box', label: 'Dimensiones y carga' },
      { icon: 'truck', label: 'Flota / GPS' },
    ],
    steps: ['Empaquetado 3D', 'Ruteo VRP', 'Generación de documentos', 'Prevalidación'],
    outputs: [
      { icon: 'box', label: 'Camión aprovechado' },
      { icon: 'route', label: 'Rutas óptimas' },
      { logos: ['pdf'], label: 'Albaranes, CMR y facturas', sub: 'Prevalidados' },
    ],
  },
  nautia: {
    inputs: [
      { icon: 'doc', label: 'Documentación técnica' },
      { icon: 'book', label: 'Documentos legales' },
      { icon: 'shield', label: 'Normativa' },
    ],
    steps: ['Centraliza los documentos', 'Consulta por rol (RAG + grafo)', 'Detecta lagunas regulatorias', 'Analiza el impacto'],
    outputs: [
      { icon: 'message', label: 'Respuestas con citas' },
      { icon: 'alert', label: 'Lagunas detectadas' },
      { icon: 'check', label: 'Compliance proactivo' },
    ],
  },
  tecnicas: {
    inputs: [
      { logos: ['odoo'], label: 'Odoo ERP / CRM', sub: 'Núcleo de datos' },
      { icon: 'mail', label: 'Correo' },
      { icon: 'database', label: 'Histórico operativo' },
    ],
    steps: ['Atiende el correo', 'Actualiza el CRM', 'Calcula y estima', 'Genera las salidas'],
    outputs: [
      { icon: 'doc', label: 'Salidas operativas' },
      { icon: 'layers', label: 'Agentes reutilizados' },
      { icon: 'check', label: 'Trazabilidad' },
    ],
  },
};

AG_CASES.forEach((c) => {
  c.flow = AG_CASE_FLOWS[c.id];
});

/* ================================================================== */
/* 5 · Cómo lo entregamos                                               */
/* ================================================================== */

export const AG_DELIVERY = {
  kicker: 'Entrega',
  title: ['Cuatro fases.', 'Un resultado.'],
  lead: 'Cada compromiso es estructurado, medible y nuestro para operar. Ves métricas, no presentaciones.',
  phases: [
    { id: 'discovery', num: '01', title: 'Discovery', time: 'Dos semanas, números reales', body: 'Visitamos tu operación. Mapeamos la fricción. Cuantificamos un flujo concreto con una línea base clara.', icon: 'route' },
    { id: 'pilot', num: '02', title: 'Piloto', time: 'Cuatro a seis semanas', body: 'Construimos el agente en un ámbito acotado y lo ejecutamos sobre una porción de tráfico real con el equipo en alerta.', icon: 'spark' },
    { id: 'scale', num: '03', title: 'Escalado', time: 'Despliegue a producción', body: 'Abrimos el agente, lo integramos con operaciones, lo monitorizamos en dashboard y lo afinamos cada semana.', icon: 'layers' },
    { id: 'operate', num: '04', title: 'Operación', time: 'En vivo, auditado, en evolución', body: 'MTi conserva el agente. Las revisiones trimestrales exponen la deriva y marcan el siguiente movimiento.', icon: 'gauge' },
  ],
  dayOneTitle: 'Qué recibes desde el día uno',
  dayOne: [
    { icon: 'ai', label: 'Un agente funcional' },
    { icon: 'chart', label: 'Un dashboard legible' },
    { icon: 'doc', label: 'Una traza documental por cada acción' },
    { icon: 'phone', label: 'Un socio que responde al teléfono después del lanzamiento' },
  ],
  motto: 'Un modelo de entrega suficientemente pequeño para empezar y suficientemente grande para escalar.',
  src: [47, 48],
};

/* ================================================================== */
/* 6 · Por qué MTi                                                      */
/* ================================================================== */

export const AG_WHY = {
  kicker: 'Por qué elegirnos',
  title: ['Cinco razones por las que', 'los socios siguen llamándonos.'],
  reasons: [
    { id: 'integration', num: '01', title: 'Integración primero, no modelo primero', body: 'Empezamos por tu ERP, CRM e IoT, no por un modelo. El agente aterriza dentro de tu stack, no al lado.', icon: 'integration' },
    { id: 'audit', num: '02', title: 'Auditable por diseño', body: 'Cada acción cita su fuente. Cada paso queda registrado. Listo para compliance desde el día uno.', icon: 'shield' },
    { id: 'production', num: '03', title: 'Producción, no pilotos', body: 'Catorce despliegues en vivo. Ocho agentes productivizados. Operaciones reales, resultados medidos.', icon: 'check' },
    { id: 'operate', num: '04', title: 'Operamos después de entregar', body: 'No desaparecemos. Revisiones trimestrales, detección de deriva, dashboards legibles.', icon: 'gauge' },
    { id: 'language', num: '05', title: 'Hablamos tu idioma', body: 'Gallego, español, inglés, francés. Voz y chat donde ya está tu gente.', icon: 'message' },
  ],
  motto: 'Suficientemente pequeños para cuidar. Suficientemente ingenierizados para escalar.',
  resultsKicker: 'Resultados agregados',
  resultsTitle: ['Números que se acumulan,', 'reunión a reunión, pedido a pedido.'],
  results: [
    { value: '−80%', label: 'COPEGAL · preparación de cotización', note: 'De días a minutos.', case: 'coplegal', scope: 'proyecto' },
    { value: '−65%', label: 'RCFIL · operación manual', note: 'Entregables, planificación, documentos.', case: 'rcfil', scope: 'proyecto' },
    { value: '−70%', label: 'FERRI · preparación de oferta', note: 'Del pliego al PDF firmado.', case: 'ferri', scope: 'proyecto' },
    { value: '8', label: 'Agentes productivizados', note: 'Reutilizados entre clientes.', scope: 'plataforma' },
    { value: '12+', label: 'Despliegues en vivo', note: 'Entre sectores y países.', scope: 'plataforma' },
    { value: '30+', label: 'Casos de IA entregados', note: 'Reales, no pilotos.', scope: 'grupo' },
  ],
  resultsMotto: 'Distintos sectores. Distintas operaciones. El mismo agente, que aprende en cada uno.',
  closing: {
    kicker: 'Hablemos',
    title: ['Del reto', 'al resultado.'],
    body: 'Cuéntanos tu reto. Te mostraremos cómo encaja un agente MTi dentro de tus operaciones, con tecnología real, integraciones reales y resultados medibles desde el día uno.',
  },
  src: [49, 50, 51],
};

/* ================================================================== */
/* Textos de interfaz del recorrido                                     */
/* ================================================================== */

export const AG_UI = {
  title: 'Agentify AI',
  subtitle: 'IA Agentiva · MTi',
  backToMti: 'Presentación MTI',
  backToMtiLong: 'Volver a la presentación de MTI',
  illustrative: 'Vista ilustrativa',
};

/* ================================================================== */

export const AGENTIFY = {
  META: AG_META,
  CHAPTERS: AG_CHAPTERS,
  INTRO: AG_INTRO,
  CONNECTORS: AG_CONNECTORS,
  ARCH: AG_ARCH,
  AGENTS_META: AG_AGENTS_META,
  AGENTS: AG_AGENTS,
  CASES_META: AG_CASES_META,
  CASES: AG_CASES,
  DELIVERY: AG_DELIVERY,
  WHY: AG_WHY,
  UI: AG_UI,
};

export default AGENTIFY;
