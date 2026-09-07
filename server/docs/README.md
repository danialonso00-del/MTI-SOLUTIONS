# Documentación (PDFs)

Deja aquí los PDF de cada caso de uso. El backend detecta automáticamente cuáles
existen (`GET /api/solutions` devuelve `docAvailable`) y el visor los abre dentro
de la propia web, sin salir de la presentación.

El nombre del archivo debe coincidir exactamente con el campo `pdf` de
`src/data/solutions.js`:

| Solución                              | Archivo esperado              |
| ------------------------------------- | ----------------------------- |
| Smart Hypervisor · Centro de Control   | `mti-command-control.pdf`     |
| Consumo de Agua y Contadores Inteligentes | `mti-water-metering.pdf`   |
| Videovigilancia Urbana y Seguridad     | `mti-urban-security.pdf`      |
| Smart Lighting & Alumbrado Conectado   | `mti-smart-lighting.pdf`      |
| Gestión Inteligente de Edificios       | `mti-building-management.pdf` |
| Grúas Inteligentes                     | `mti-smart-crane.pdf`         |
| Calidad del Aire Urbana                | `mti-air-quality.pdf`         |
| Monitorización de Taludes              | `mti-slope-monitoring.pdf`    |
| Monitorización de Inundaciones         | `mti-flood-monitoring.pdf`    |
| Flota Conectada y Transporte Público   | `mti-fleet-mobility.pdf`      |
| Waste Management Inteligente           | `mti-waste-management.pdf`    |
| Smart Stadium & Grandes Eventos        | `mti-smart-stadium.pdf`       |

No hace falta reiniciar nada: basta con copiar el PDF y volver a abrir la ficha.
