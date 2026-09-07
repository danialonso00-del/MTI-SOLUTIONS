/**
 * El catálogo en inglés.
 *
 * Solo lo que se ve: título, gancho, resumen, viñetas, etiquetas de los KPI,
 * los relatos y los cuadros de mando. Lo demás —identificadores, coordenadas,
 * iconos, colores— no se traduce.
 *
 * Está aparte del castellano a propósito: son textos de venta, y así se pueden
 * revisar de un vistazo sin bucear entre datos.
 */

export const INDUSTRIES_EN = {
  'smart-cities': { label: 'Smart Cities', short: 'City' },
  transport: { label: 'Transport and Mobility', short: 'Mobility' },
  environment: { label: 'Environment and Waste', short: 'Waste' },
  venues: { label: 'Stadiums and Large Venues', short: 'Venues' },
  buildings: { label: 'Buildings and Facilities', short: 'Buildings' },
  construction: { label: 'Construction and Site Works', short: 'Site' },
};

export const CAPABILITIES_EN = {
  'command-control': { label: 'Control Centre', blurb: 'Smart Hypervisor: the whole operation in one pane' },
  iot: { label: 'IoT and Sensing', blurb: 'Field data capture at scale' },
  security: { label: 'Security and Video Surveillance', blurb: 'CCTV, video analytics and access control' },
  'agentic-ai': { label: 'Agentic AI', blurb: 'Autonomous agents inside real processes' },
  predictive: { label: 'Analytics and Predictive', blurb: 'Predictive maintenance and optimisation' },
  integration: { label: 'Systems Integration', blurb: 'Federating legacy, SCADA, ERP and verticals' },
  connectivity: { label: 'Connectivity and Edge', blurb: 'Private networks, 5G, LoRaWAN and edge computing' },
  'digital-twin': { label: 'Digital Twin', blurb: 'A living 3D replica of the asset or the territory' },
};

export const SOLUTIONS_EN = {
  'flood-monitoring': {
    title: 'Flood Monitoring',
    tagline: 'The level rises, the camera confirms it and emergency services already know.',
    place: 'Underpass and bridge',
    summary:
      'A standalone water-level monitoring station for bridges, streams and underpasses: level sensor, rain gauge and a field camera that triggers itself once the threshold is crossed. The image arrives next to the reading, so the operator sees what is happening before deciding, and the platform coordinates the alert to emergency services, the road closure and the public notice.',
    bullets: [
      'Radar or pressure level sensor, with no contact with the water',
      'Field camera triggered by threshold: data and image in the same alert',
      'Rain gauge and weather station to anticipate the rise',
      'Long-range radio from a manhole, with no coverage or cabling',
      'Standalone station with years of battery and 4G backup',
      'Automatic alert to emergency services, road closure and public notice',
    ],
    kpis: ['Before it overflows', 'Critical points watched', 'Autonomy per station'],
  },
  'slope-monitoring': {
    title: 'Slope Monitoring',
    tagline: 'The ground warns before it moves. Someone has to be listening.',
    place: 'Railway cutting',
    summary:
      'Wireless geotechnical instrumentation on the slope: tiltmeters, load cells on anchors, piezometers, crackmeters and a weather station, all reporting over long-range radio. The platform cross-checks displacement with rainfall and water table, and raises the alarm when the trend accelerates — not once it has already failed.',
    bullets: [
      'Tiltmeters and displacement nodes with no cabling on the slope',
      'Piezometers and rain gauge: water is what moves the ground',
      'Load cells on anchors and bolts',
      'Thresholds on rate of movement, not just absolute value',
      'Alarms to the site, to rail operations and to the on-call engineer',
      'Long-range radio on site, with no mobile coverage or wifi',
    ],
    kpis: ['Warning before failure', 'Measurement resolution', 'Battery per node'],
  },
  'command-control': {
    title: 'Smart Hypervisor · Control Centre',
    tagline: 'A single pane of glass for the whole operation.',
    place: 'Torre Glòries',
    summary:
      'The platform that federates traffic, security, water, waste and city services into one control room. It correlates events, guides protocols and proposes the next best action with AI agents.',
    bullets: [
      'Integration of legacy systems (SCADA, CCTV, ITS, 112)',
      'Rules engine and guided emergency protocols',
      'Agentic AI for triage and incident prioritisation',
      'Real-time 3D digital twin kept in sync',
    ],
    kpis: ['Faster response', 'Federated systems', 'Availability'],
  },
  'water-metering': {
    title: 'Water Consumption and Smart Meters',
    tagline: 'Every litre measured. Every leak, first time.',
    place: 'Parc de la Ciutadella',
    summary:
      'City-scale remote reading of water meters and a platform that turns those readings into operations: early leak detection, abnormal consumption, water balance by sector and billing on real data, with no site visits.',
    bullets: [
      'NB-IoT / LoRaWAN remote reading on new and existing meters',
      'Leak, continuous-flow and abnormal-consumption detection per home',
      'Water balance by sector: registered water versus injected water',
      'Citizen portal with consumption and excess alerts',
      'Integration with billing and with the control centre',
    ],
    kpis: ['Less network loss', 'Valid readings', 'Earlier leak detection'],
  },
  'urban-security': {
    title: 'Urban Video Surveillance and Public Safety',
    tagline: 'Thousands of cameras. One operator. Only what matters.',
    place: 'Mercat dels Encants',
    summary:
      'A video management platform (VMS) integrated with the control centre: analytics at the edge that turn hours of footage into actionable alerts, with traceability and evidence handling that meets regulation.',
    bullets: [
      'Federated VMS across cameras from different makers and generations',
      'Video analytics at the edge: intrusion, crowding, abandoned object, LPR',
      'Forensic search by attribute across historical recordings',
      'Chain of custody for evidence and GDPR by design',
      'Mixed deployment: fixed cameras, PTZ domes and mobile units',
    ],
    kpis: ['Fewer false alarms', 'Average forensic search', 'Cameras managed'],
  },
  'smart-lighting': {
    title: 'Smart Lighting & Connected Street Lighting',
    tagline: 'Every luminaire a sensor. Every street a data point.',
    place: 'Sagrada Família Basilica',
    summary:
      'Point-to-point remote management of public lighting with adaptive dimming by traffic and daylight. The luminaire network becomes the city’s IoT backbone: it carries air quality, noise, occupancy and camera sensors.',
    bullets: [
      'Adaptive dimming and astronomical schedules by zone',
      'Automatic luminaire failure detection and maintenance alert',
      'NB-IoT / LoRaWAN network reusable by other verticals',
      'Dashboards for consumption and carbon footprint',
    ],
    kpis: ['Energy saved', 'Fewer street complaints', 'Light points managed'],
  },
  'building-management': {
    title: 'Smart Building Management',
    tagline: 'The building explains itself: energy, use and faults.',
    place: "L'Illa Diagonal · office building",
    summary:
      'A building management platform that federates the BMS, HVAC, lighting, meters and access control. It turns real consumption and occupancy into decisions: which floor to condition, which unit to service and which space is spare.',
    bullets: [
      'BMS and HVAC federation, floor by floor',
      'Real occupancy by space: rooms, floors and desks',
      'Predictive maintenance of HVAC, lifts and pumps',
      'Electricity, water and gas meters with tenant apportionment',
      'Measured comfort: temperature, CO₂, humidity and noise',
    ],
    kpis: ['Energy saved', 'Fewer corrective calls', 'Earlier fault detection'],
  },
  'air-quality': {
    title: 'Urban Air Quality',
    tagline: 'Measure the air street by street, not city by city.',
    place: 'Gran Via · Passeig de Gràcia',
    summary:
      'A network of low-cost air quality sensors spread across the street network and calibrated against the official reference stations. It measures NO₂, particulates, ozone, noise and weather at street scale —where people actually breathe— and turns that mesh into decisions: divert traffic, warn schools or justify a low-emission zone.',
    bullets: [
      'Sensors on lighting columns, bus shelters and municipal façades',
      'NO₂, PM2.5, PM10, ozone, noise, temperature and humidity',
      'Continuous calibration against the official reference stations',
      'Exposure map by neighbourhood, school and time of day',
      'Automatic alerts above threshold and public notices',
      'Correlation with traffic to see which measure actually works',
    ],
    kpis: ['Measurement points', 'Less NO₂ on the corridor', 'Data refreshed every'],
  },
  'smart-crane': {
    title: 'Smart Cranes',
    tagline: 'The crane tells you how it works and when to stop it.',
    place: 'La Sagrera site works',
    summary:
      'Sensing on board the tower crane itself: wind, load, moment, slew, hook height and working hours. The data reaches the platform and becomes safety —stopping before it is too late— and productivity: how many cycles, at what load and how much idle time.',
    bullets: [
      'Anemometer and real-time load and moment sensing',
      'Preventive stop and weathervaning when wind is out of range',
      'Cycle count, average loads and idle time per shift',
      'Overload and out-of-zone manoeuvre alerts',
      'Predictive maintenance of rope, brake and motor by real hours',
      'Dedicated on-site connectivity (LTE/LoRaWAN), no reliance on wifi',
    ],
    kpis: ['Manoeuvres logged', 'Less idle time', 'Earlier fault detection'],
  },
  'mobility-fleet': {
    title: 'Connected Fleet and Public Transport',
    tagline: 'Every vehicle knows where it is and how it feels.',
    place: 'TMB · Barcelona',
    summary:
      'A fleet management and passenger information platform: real-time location, arrival prediction, vehicle health and occupancy analytics to right-size the service.',
    bullets: [
      'On-board IoT tracking and CAN-bus telemetry',
      'AVL system and passenger information displays',
      'Predictive fleet maintenance',
      'Occupancy and demand analytics by time band',
    ],
    kpis: ['Better punctuality', 'Fewer breakdowns in service', 'Events/day processed'],
  },
  'waste-management': {
    title: 'Smart Waste Management',
    tagline: 'Only collect what is actually full.',
    place: 'Mercat del Fort Pienc',
    summary:
      'Volumetric sensing of bins, user identification at the point of disposal and dynamic optimisation of collection routes. Full traceability of the waste to support variable fees and recycling targets.',
    bullets: [
      'Ultrasonic / ToF fill-level sensors in the bin',
      'Dynamic routes recalculated daily from real fill levels',
      'Citizen identification (RFID/NFC) and pay-as-you-throw',
      'KPIs for separate collection and traceability by fraction',
    ],
    kpis: ['Fewer kilometres driven', 'Fewer empty collections', 'More separate collection'],
  },
  stadium: {
    title: 'Smart Stadium & Major Events',
    tagline: 'From 90,000 people to a predictable operation.',
    place: 'Camp Nou',
    summary:
      'End-to-end digitalisation of the venue: crowd and flow control, integrated security, high-density connectivity, fan experience and building energy efficiency. The whole event operation in a single control centre.',
    bullets: [
      'People counting and real-time flow heat maps',
      'Integrated security: video analytics, access control and PA',
      'High-density Wi-Fi/5G and fan services',
      'Energy and HVAC management for the venue',
    ],
    kpis: ['Attendees managed', 'Faster entry', 'Energy saved'],
  },
};

export const STORIES_EN = {
  'flood-monitoring': [
    [
      { title: 'The level rises 1.8 m', sub: 'Forty minutes · warning threshold crossed', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cross-checks level, upstream rainfall and the camera image', icon: 'signal', tone: 'info' },
      { title: 'Emergency services alerted', sub: 'Underpass closed and public notice posted', icon: 'check', tone: 'ok' },
      { title: 'Nobody trapped', sub: 'The water reached the underpass with the road already closed', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'The camera triggers itself', sub: 'The threshold switches it on: data and image together', icon: 'camera', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'The image rules out a false positive: there is debris coming down', icon: 'signal', tone: 'info' },
      { title: 'Crew sent to the bridge', sub: 'Obstruction cleared before the peak arrives', icon: 'check', tone: 'ok' },
      { title: 'Eyes where they matter', sub: 'Without sending anyone to look at the river at 3 a.m.', icon: 'check', tone: 'ok' },
    ],
    [
      { title: '42 critical points', sub: 'Streams, underpasses and bridges across the city', icon: 'signal', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'One screen with level, rainfall and camera for every point', icon: 'signal', tone: 'info' },
      { title: 'A threshold per location', sub: 'Each point has its own, not one number for the whole city', icon: 'check', tone: 'ok' },
      { title: 'Ten years of autonomy', sub: 'Stations in a manhole, with no cabling and no power supply', icon: 'bolt', tone: 'ok' },
    ],
  ],
  'slope-monitoring': [
    [
      { title: 'The slope is moving', sub: '4.2 mm in 12 h · three times the usual', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cross-checks displacement, rainfall and water table', icon: 'signal', tone: 'info' },
      { title: 'Line closed in time', sub: 'On-call engineer and operations notified', icon: 'check', tone: 'ok' },
      { title: 'No derailment', sub: 'The wedge came down at night, with the line empty', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Anchor losing load', sub: 'Cell 12 · −18% in two weeks', icon: 'gauge', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Compares with the rest of the anchors in the row', icon: 'signal', tone: 'info' },
      { title: 'Re-stressing scheduled', sub: 'Before it drags the neighbouring anchors', icon: 'check', tone: 'ok' },
      { title: 'Reinforcement justified', sub: 'With the anchor’s own curve, not an estimate', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Rainfall event', sub: '48 mm in 6 h · piezometers rising', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Threshold on rate, not only on value', icon: 'signal', tone: 'info' },
      { title: 'Drainage checked', sub: 'And a speed restriction while it lasts', icon: 'check', tone: 'ok' },
      { title: 'Slope stabilised', sub: 'Five years of battery per node, nothing cabled', icon: 'leaf', tone: 'ok' },
    ],
  ],
  'air-quality': [
    [
      { title: 'NO₂ above threshold', sub: '212 µg/m³ on the corridor · rush hour', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cross-checks traffic, wind and the official station', icon: 'signal', tone: 'info' },
      { title: 'Signals and notice', sub: 'Less green time on the corridor · schools warned', icon: 'check', tone: 'ok' },
      { title: 'Episode contained', sub: 'Back under threshold in 90 min · fully logged', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Particulate spike', sub: 'PM10 x3 · building site on the next block', icon: 'gauge', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Rules traffic out: the pattern is dust, not exhaust', icon: 'signal', tone: 'info' },
      { title: 'Damping and site netting', sub: 'Requirement issued with the data in hand', icon: 'check', tone: 'ok' },
      { title: 'No repeat', sub: 'The measure shows up in the next day’s curve', icon: 'leaf', tone: 'ok' },
    ],
    [
      { title: 'Sensor drifting', sub: 'Diverging from the reference station', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Continuous calibration against the official network', icon: 'signal', tone: 'info' },
      { title: 'Reading corrected', sub: 'And a maintenance call raised for the unit', icon: 'check', tone: 'ok' },
      { title: 'A mesh that holds up', sub: '128 points with data you can defend in public', icon: 'check', tone: 'ok' },
    ],
  ],
  'smart-crane': [
    [
      { title: 'Gust of 78 km/h', sub: 'Anemometer at the jib tip · threshold 72', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cross-checks wind, load and hook height', icon: 'signal', tone: 'info' },
      { title: 'Preventive stop', sub: 'Crane weathervaned and site manager notified', icon: 'check', tone: 'ok' },
      { title: 'No incident', sub: 'Work resumes 40 minutes later', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Overload on the hook', sub: '4.8 t at 42 m · moment outside the chart', icon: 'gauge', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Compares load, radius and the maker’s curve', icon: 'signal', tone: 'info' },
      { title: 'Manoeuvre blocked', sub: 'Operator told the maximum admissible load', icon: 'check', tone: 'ok' },
      { title: 'Every manoeuvre logged', sub: 'Full traceability of the shift', icon: 'check', tone: 'ok' },
    ],
    [
      { title: '38 cycles this morning', sub: 'Average load 2.1 t · 26% idle time', icon: 'chart', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Compares against the site’s own history', icon: 'signal', tone: 'info' },
      { title: 'Maintenance by real hours', sub: 'Rope and brake, not by calendar', icon: 'check', tone: 'ok' },
      { title: '32% less idle time', sub: 'The site knows which crane has slack', icon: 'bolt', tone: 'ok' },
    ],
  ],
  'urban-security': [
    [
      { title: 'Perimeter intrusion', sub: 'Analytics at the edge · 97% confidence', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cross-checks the alert with nearby cameras and access', icon: 'signal', tone: 'info' },
      { title: 'Protocol opened', sub: 'Operator alerted · nearest patrol assigned', icon: 'check', tone: 'ok' },
      { title: 'Evidence stored', sub: 'Chain of custody · GDPR by design', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Crowding on the pavement', sub: '14 people in 40 m² · threshold 12', icon: 'people', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Compares with the usual pattern for the area', icon: 'signal', tone: 'info' },
      { title: 'Local unit notified', sub: 'Nobody had to call: the system proposes it', icon: 'check', tone: 'ok' },
      { title: '92% fewer false alarms', sub: 'The operator only sees what matters', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Plate identified', sub: 'LPR 4821-KDR · vehicle on the watch list', icon: 'car', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Checks the list and alerts the control centre', icon: 'signal', tone: 'info' },
      { title: 'Handover between cameras', sub: 'The record follows it to the next camera', icon: 'camera', tone: 'ok' },
      { title: 'Forensic search in 3 min', sub: 'It used to be hours of footage', icon: 'check', tone: 'ok' },
    ],
  ],
  'mobility-fleet': [
    [
      { kind: 'On board', title: 'Fare validation', sub: 'Contactless, QR and transport card', icon: 'ticket', tone: 'info' },
      { kind: 'On board', title: 'Interior and exterior cameras', sub: 'On-board recording and blind-spot cover', icon: 'camera', tone: 'info' },
      { kind: 'On board', title: 'Passenger counting', sub: 'Real occupancy by stop and time band', icon: 'people', tone: 'ok' },
      { kind: 'On board', title: 'AVL and passenger display', sub: 'Position, next stop and real time', icon: 'signal', tone: 'ok' },
    ],
    [
      { title: 'Bus 47 · +4 min', sub: 'Delay detected at the terminus', icon: 'car', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Cross-checks position, occupancy and demand by band', icon: 'signal', tone: 'info' },
      { title: 'Extra unit assigned', sub: 'Reinforcement · V15 every 6 minutes', icon: 'check', tone: 'ok' },
      { title: '94% punctuality', sub: 'Passengers informed on the stop displays', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Vehicle alert', sub: 'CAN telemetry · pressure and temperature', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Compares against the fleet’s history', icon: 'signal', tone: 'info' },
      { title: 'Workshop slot booked', sub: 'Without stranding the line', icon: 'check', tone: 'ok' },
      { title: '25% fewer breakdowns in service', sub: 'Predictive fleet maintenance', icon: 'check', tone: 'ok' },
    ],
  ],
  'waste-management': [
    [
      { title: 'Bin 214 · 92%', sub: 'ToF fill sensor · organic fraction', icon: 'bin', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Reading received · matched against today’s route', icon: 'signal', tone: 'info' },
      { title: 'Route recalculated', sub: 'Truck 3 assigned · 6 stops dropped', icon: 'check', tone: 'ok' },
      { title: 'Collection completed', sub: 'Traceability by fraction · 38% fewer km', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Bin still empty', sub: 'At 12% three days running', icon: 'bin', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Compares real fill against the planned route', icon: 'signal', tone: 'info' },
      { title: 'Stop dropped', sub: 'The truck no longer drives out to collect air', icon: 'check', tone: 'ok' },
      { title: '45% fewer empty collections', sub: 'Fewer km, fewer emissions, lower cost', icon: 'leaf', tone: 'ok' },
    ],
    [
      { title: 'Disposal identified', sub: 'Citizen card at the organic bin', icon: 'people', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Traceability by fraction and by user', icon: 'signal', tone: 'info' },
      { title: 'Variable fee applied', sub: 'Pay as you throw, on data that holds up', icon: 'check', tone: 'ok' },
      { title: '28% more separate collection', sub: 'Residents see their own figure', icon: 'check', tone: 'ok' },
    ],
  ],
  'water-metering': [
    [
      { title: 'Continuous flow for 38 h', sub: 'Meter 4821 · 0.6 l/min with no night stop', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Sector balance: 12 m³/day unaccounted for', icon: 'signal', tone: 'info' },
      { title: 'Leak confirmed', sub: 'Work order raised for the standby crew', icon: 'check', tone: 'ok' },
      { title: 'Sector stabilised', sub: '12 m³/day recovered · customer notified', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Abnormal consumption', sub: 'Home 12-3 · four times its own average', icon: 'gauge', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Checks against history and against the sector', icon: 'signal', tone: 'info' },
      { title: 'Customer notified', sub: 'Citizen portal · possible internal leak', icon: 'check', tone: 'ok' },
      { title: 'Consumption back to normal', sub: 'Nobody had to be sent out to read a meter', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Reading complete', sub: '98% of meters within the night window', icon: 'check', tone: 'ok' },
      { title: 'Smart Hypervisor', sub: 'NB-IoT remote reading · no site visits', icon: 'signal', tone: 'info' },
      { title: 'Billing on real data', sub: 'Zero estimates this quarter', icon: 'chart', tone: 'ok' },
      { title: '24% less loss', sub: 'Registered water versus injected water', icon: 'leaf', tone: 'ok' },
    ],
  ],
  'smart-lighting': [
    [
      { title: 'Luminaire 1182 out', sub: 'No answer for two cycles · NB-IoT node', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: '18,000 light points · third failure on the same panel', icon: 'signal', tone: 'info' },
      { title: 'Maintenance order', sub: 'Standby crew · replacement scheduled', icon: 'check', tone: 'ok' },
      { title: '40% fewer street complaints', sub: 'The fault is caught before a resident sees it', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Empty street', sub: '02:40 · movement sensors at zero', icon: 'car', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Dims by real traffic and daylight', icon: 'signal', tone: 'info' },
      { title: 'Dimmed to 40%', sub: 'Not switched off: the street stays safe', icon: 'bolt', tone: 'ok' },
      { title: '62% energy saved', sub: 'Point by point, street by street', icon: 'leaf', tone: 'ok' },
    ],
    [
      { title: 'The lamp post as a sensor', sub: 'Air quality and noise on the same column', icon: 'signal', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'The lighting network serves other verticals', icon: 'signal', tone: 'info' },
      { title: 'Camera and wifi on the same network', sub: 'Reusing infrastructure that is already there', icon: 'camera', tone: 'ok' },
      { title: 'One network, many services', sub: 'Reusable NB-IoT / LoRaWAN', icon: 'check', tone: 'ok' },
    ],
  ],
  'building-management': [
    [
      { title: 'Floor 7 · 26.4 °C', sub: 'HVAC at 100% with the rooms empty', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Cross-checks BMS, real occupancy and floor meters', icon: 'signal', tone: 'info' },
      { title: 'HVAC tuned per floor', sub: 'Setpoint 23 °C · fan coil service raised', icon: 'check', tone: 'ok' },
      { title: '28% less consumption', sub: 'Stable comfort and tenant apportionment', icon: 'bolt', tone: 'ok' },
    ],
    [
      { title: 'Room booked and empty', sub: 'Fourth time this week', icon: 'people', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Real occupancy by space, not by calendar', icon: 'signal', tone: 'info' },
      { title: 'Booking released', sub: 'The room frees itself up again', icon: 'check', tone: 'ok' },
      { title: 'Square metres put to use', sub: 'You know what space is spare and what is missing', icon: 'chart', tone: 'ok' },
    ],
    [
      { title: 'Pump off its curve', sub: 'Vibration and consumption above pattern', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Compares against the unit’s own history', icon: 'signal', tone: 'info' },
      { title: 'Breakdown avoided', sub: 'Work scheduled outside office hours', icon: 'check', tone: 'ok' },
      { title: '35% fewer corrective calls', sub: 'The building warns before it breaks', icon: 'check', tone: 'ok' },
    ],
  ],
  stadium: [
    [
      { title: 'North gate saturated', sub: '1,240 people/min · 4 turnstiles open', icon: 'ticket', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Cross-checks capacity, turnstiles and venue CCTV', icon: 'signal', tone: 'info' },
      { title: 'Open turnstiles 12–16', sub: 'Reinforcement sent · PA at the east gate', icon: 'check', tone: 'ok' },
      { title: 'Flow back to normal', sub: 'Average wait 6 min · capacity under control', icon: 'people', tone: 'ok' },
    ],
    [
      { title: 'Consumption peak', sub: 'South stand HVAC at 100%', icon: 'bolt', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Zone consumption cross-checked with real occupancy', icon: 'signal', tone: 'info' },
      { title: 'HVAC by sector', sub: 'Empty areas switched off before kick-off', icon: 'check', tone: 'ok' },
      { title: '21% less energy', sub: 'Same comfort with a full stand', icon: 'leaf', tone: 'ok' },
    ],
    [
      { title: 'Abandoned object', sub: 'Vomitory 4 · flagged by video analytics', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Camera, access and PA in the same protocol', icon: 'signal', tone: 'info' },
      { title: 'Team dispatched', sub: 'Area cordoned without stopping the event', icon: 'check', tone: 'ok' },
      { title: 'Incident closed', sub: 'Evidence stored · 4 minutes end to end', icon: 'check', tone: 'ok' },
    ],
  ],
  'smart-cities': [
    [
      { title: 'Incident on the street', sub: 'Citizen report and street sensor, at once', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Federates 23 systems and correlates the event', icon: 'signal', tone: 'info' },
      { title: 'Protocol proposed', sub: 'Agentic AI · standby crew assigned', icon: 'check', tone: 'ok' },
      { title: 'Incident closed', sub: '47% faster response time', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Three reports, one event', sub: 'Camera, 112 and sensor point at the same junction', icon: 'camera', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Groups them into a single incident', icon: 'signal', tone: 'info' },
      { title: 'One operator', sub: 'With the protocol guided step by step', icon: 'check', tone: 'ok' },
      { title: 'No duplicated resources', sub: 'Three patrols no longer show up at the same place', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'One city dashboard', sub: 'Traffic, water, waste, lighting and security', icon: 'chart', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Each vertical keeps its system; here they are seen together', icon: 'signal', tone: 'info' },
      { title: 'Decisions with context', sub: 'What is happening and what is about to', icon: 'check', tone: 'ok' },
      { title: '99.9% availability', sub: 'The control room does not stop', icon: 'check', tone: 'ok' },
    ],
  ],
};

export const PANELS_EN = {
  'flood-monitoring': {
    title: 'Water level watch',
    subtitle: 'Standalone station · level, rain and camera',
    metrics: ['Level', 'Rain', 'Points'],
    rows: ['Warning threshold crossed · camera activated', 'Emergency services alerted and underpass closed'],
  },
  'slope-monitoring': {
    title: 'Instrumented slope',
    subtitle: 'Tiltmeters, anchors and piezometers',
    metrics: ['Displacement', 'Rain 6 h', 'Nodes'],
    rows: ['Rate of movement above threshold', 'Piezometers rising after the rainfall event'],
  },
  'command-control': {
    title: 'Control room',
    subtitle: 'Smart Hypervisor · 23 federated systems',
    metrics: ['Open incidents', 'Response', 'Availability'],
    rows: ['Three reports grouped into one incident', 'Protocol proposed by Agentic AI · crew assigned'],
  },
  'air-quality': {
    title: 'Air quality on the street',
    subtitle: 'Urban corridor · 128 measurement points',
    metrics: ['NO₂', 'PM2.5', 'Sensors'],
    rows: ['NO₂ above threshold at rush hour', 'Calibrated against the official reference station'],
  },
  'urban-security': {
    title: 'Video analytics at the edge',
    subtitle: 'Camera 042 · urban corridor',
    metrics: ['People', 'Vehicles', 'Alerts'],
    rows: ['Vehicle identified · LPR 4821-KDR', 'Perimeter intrusion · operator alerted'],
  },
  'mobility-fleet': {
    title: 'Smart Bus · on-board technology',
    subtitle: 'TMB · bus in service',
    metrics: ['Occupancy', 'Validations', 'Next stop'],
    rows: ['Contactless and QR validators live', 'On-board cameras and passenger counting active'],
  },
  'waste-management': {
    title: 'Optimised collection',
    subtitle: 'Fill sensors · today’s route',
    metrics: ['Bins', 'Full', 'Km avoided'],
    rows: ['Bin 214 at 92% · high priority', 'Route recalculated: 6 bins dropped'],
  },
  'water-metering': {
    title: 'Water remote reading',
    subtitle: 'Smart meters · sector balance',
    metrics: ['Meters', 'Valid readings', 'Losses'],
    rows: ['Meter 4821: continuous flow for 38 h', 'Sector balance closing at 88%'],
  },
  'smart-lighting': {
    title: 'Remotely managed lighting',
    subtitle: 'Adaptive dimming · point to point',
    metrics: ['Light points', 'Saving', 'Open faults'],
    rows: ['Luminaire 1182 not answering', 'Dimmed to 40% on the traffic-free stretch'],
  },
  'building-management': {
    title: 'Building management',
    subtitle: 'Federated BMS · real consumption and occupancy',
    metrics: ['Occupancy', 'Consumption', 'Comfort'],
    rows: ['Floor 7: HVAC at 100% with no occupancy', 'Fan coil 7-B off its curve · alert raised'],
  },
  'smart-crane': {
    title: 'Crane 3 · 42 m tower',
    subtitle: 'On-board sensing · tower crane on site',
    metrics: ['Wind', 'Load', 'Cycles today'],
    rows: ['Gust of 78 km/h · threshold 72', 'Automatic weathervaning · manoeuvre stopped'],
  },
  stadium: {
    title: 'Event operation',
    subtitle: 'Camp Nou · match-day operation',
    metrics: ['Capacity', 'Entries/min', 'Wait'],
    rows: ['North gate above threshold', 'Turnstiles 12–16 open · reinforcement on the way'],
  },
};
