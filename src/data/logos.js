/**
 * Logos de marca de las herramientas que nombra la presentación de IA Agentiva.
 *
 * Archivos en public/assets/logos/. Procedencia (ver CREDITS.md):
 *   - Simple Icons (CC0), coloreados con el color oficial de cada marca
 *   - Wikimedia Commons: Microsoft 365 (Outlook, Word, Excel, SharePoint),
 *     Dynamics 365, Azure, Salesforce, OpenAI, Adobe Acrobat (PDF), Gmail
 *
 * Para mejorar uno basta con sustituir el archivo con el mismo nombre.
 * `wide`: logotipo con texto, necesita una ficha más ancha.
 */
export const LOGOS = {
  gmail: { name: 'Gmail', file: 'gmail.svg' },
  outlook: { name: 'Outlook', file: 'outlook.svg' },
  word: { name: 'Word', file: 'word.svg' },
  excel: { name: 'Excel', file: 'excel.svg' },
  sharepoint: { name: 'SharePoint', file: 'sharepoint.svg' },
  dynamics: { name: 'Dynamics 365', file: 'dynamics.svg', wide: true },
  azure: { name: 'Azure', file: 'azure.svg' },
  salesforce: { name: 'Salesforce', file: 'salesforce.svg' },
  openai: { name: 'OpenAI', file: 'openai.svg' },
  pdf: { name: 'PDF', file: 'pdf.svg' },
  odoo: { name: 'Odoo', file: 'odoo.png', wide: true },
  sap: { name: 'SAP', file: 'sap.svg' },
  sage: { name: 'Sage', file: 'sage.png', wide: true },
  hubspot: { name: 'HubSpot', file: 'hubspot.svg' },
  zoho: { name: 'Zoho', file: 'zoho.png', wide: true },
  whatsapp: { name: 'WhatsApp', file: 'whatsapp.svg' },
  python: { name: 'Python', file: 'python.svg' },
  react: { name: 'React', file: 'react.svg' },
  neo4j: { name: 'Neo4j', file: 'neo4j.svg' },
  qdrant: { name: 'Qdrant', file: 'qdrant.svg' },
  chrome: { name: 'Chrome', file: 'googlechrome.svg' },
  langchain: { name: 'LangChain', file: 'langchain.svg' },
  langgraph: { name: 'LangGraph', file: 'langgraph.svg' },
  mcp: { name: 'MCP', file: 'mcp.svg' },
};

export const logoSrc = (id) => (LOGOS[id] ? `/assets/logos/${LOGOS[id].file}` : null);

/** Qué logo acompaña a cada tecnología del stack de un agente (las que no tienen, van en texto). */
export const STACK_LOGO = {
  LangGraph: 'langgraph',
  Python: 'python',
  Whisper: 'openai',
  'Azure TTS': 'azure',
  'Odoo API': 'odoo',
  WhatsApp: 'whatsapp',
  Neo4j: 'neo4j',
  Qdrant: 'qdrant',
  React: 'react',
  'Microsoft Graph': 'outlook',
  'SMTP / Graph': 'outlook',
};

/** Conectores nativos que nombra la diapositiva 10, con su logo si lo hay. */
export const CONNECTOR_LOGO = {
  SAP: 'sap',
  Odoo: 'odoo',
  Dynamics: 'dynamics',
  SAGE: 'sage',
  SharePoint: 'sharepoint',
  HubSpot: 'hubspot',
  Salesforce: 'salesforce',
  MCP: 'mcp',
};
