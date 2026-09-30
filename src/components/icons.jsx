import React from 'react';

/** Iconografía de línea, una por vertical. */
const paths = {
  city: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8l5-3v16" />
      <path d="M10 21V11l5 2v8" />
      <path d="M15 21v-5l4 1.5V21" />
      <path d="M7.5 11h.01M7.5 14.5h.01M12.5 15h.01" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="12" rx="2" />
      <path d="M4 10h16M8 20v-2M16 20v-2" />
      <circle cx="8" cy="16" r="1" />
      <circle cx="16" cy="16" r="1" />
    </>
  ),
  recycle: (
    <>
      <path d="M12 4l3 5h-6l3-5z" />
      <path d="M18.5 13.5l2 3.5h-5" />
      <path d="M5.5 13.5l-2 3.5h5" />
      <path d="M9 20h6" />
    </>
  ),
  stadium: (
    <>
      <ellipse cx="12" cy="9" rx="9" ry="4.5" />
      <path d="M3 9v5c0 2.5 4 4.5 9 4.5s9-2 9-4.5V9" />
      <ellipse cx="12" cy="9" rx="4" ry="2" />
    </>
  ),
  bolt: <path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" />,
  plane: <path d="M10.5 21l1.5-1v-5.5l8 2.5v-2l-8-5V4.5a1.5 1.5 0 0 0-3 0V10l-8 5v2l8-2.5V20l1.5 1z" />,
  train: (
    <>
      <rect x="6" y="3" width="12" height="14" rx="3" />
      <path d="M6 10h12M9 21l1.5-4M15 21l-1.5-4" />
      <circle cx="9.5" cy="13.5" r="0.8" />
      <circle cx="14.5" cy="13.5" r="0.8" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
    </>
  ),
  phone: <path d="M6.6 3.5l2.7.4 1.2 4-2 1.6a12 12 0 0 0 6 6l1.6-2 4 1.2.4 2.7c-.1 1.4-1.3 2.5-2.7 2.4C10.6 19.4 4.6 13.4 4.2 6.2c-.1-1.4 1-2.6 2.4-2.7z" />,
  message: (
    <>
      <path d="M4 5h16v11H9l-5 4V5z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0V5.5z" />
      <path d="M12 5.5V19" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M12 7v4M12 11l-6 5.5M12 11l6 5.5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
      <path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  ),
  table: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  wrench: <path d="M14.5 5.5a4 4 0 0 0-5.3 5.3L3.5 16.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z" />,
  cube: (
    <>
      <path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4l8-4.6z" />
      <path d="M12 12l8-4.6M12 12L4 7.4M12 12v9.2" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4" />
    </>
  ),
  send: <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />,
  cart: (
    <>
      <path d="M3 4h2.5l2.2 10.5h10.3L20.5 7H7" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="16.5" cy="19" r="1.4" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6h11v9.5h-11zM13.5 9.5h4l3 3v3h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="16.5" cy="17.5" r="1.8" />
    </>
  ),
  health: (
    <>
      <rect x="4" y="7" width="16" height="14" rx="2" />
      <path d="M9 7V4h6v3M12 11v6M9 14h6" />
    </>
  ),
  factory: (
    <>
      <path d="M3 21V11l5 3V11l5 3V8l6 3.5V21z" />
      <path d="M7 21v-3M12 21v-3M17 21v-3" />
    </>
  ),
  signal: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7" />
      <path d="M5.5 5.5a9 9 0 000 13M18.5 5.5a9 9 0 010 13" />
    </>
  ),
  command: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4M7 8h4M7 11h7" />
    </>
  ),
  twin: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </>
  ),
  sensor: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </>
  ),
  ai: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9 9h6v6H9zM12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
      <path d="M9.5 12l1.8 1.9 3.4-3.7" />
    </>
  ),
  integration: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <path d="M10 6.5h4a3 3 0 013 3v4" />
      <path d="M14 17.5h-4a3 3 0 01-3-3v-4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  edge: (
    <>
      <rect x="3" y="9" width="18" height="7" rx="2" />
      <path d="M7 12.5h.01M11 12.5h4M6 6l2-2h8l2 2M6 19l2 2h8l2-2" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5M3 16.5l9 5 9-5" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  play: <path d="M8 5v14l11-7z" />,
  external: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
      <path d="M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  air: (
    <>
      <path d="M3 8.5h11a3 3 0 1 0-3-3" />
      <path d="M3 12.5h15a3 3 0 1 1-3 3" />
      <path d="M3 16.5h8" />
    </>
  ),
  flood: (
    <>
      <path d="M2 15c2.2 0 2.2-1.6 4.4-1.6S8.6 15 10.8 15s2.2-1.6 4.4-1.6S17.4 15 19.6 15" />
      <path d="M2 19.5c2.2 0 2.2-1.6 4.4-1.6s2.2 1.6 4.4 1.6 2.2-1.6 4.4-1.6 2.2 1.6 4.4 1.6" />
      <path d="M6 10.5V4.5h8v6" />
      <path d="M4 10.5h12" />
    </>
  ),
  crane: (
    <>
      <path d="M7 21V4" />
      <path d="M4.5 21h5" />
      <path d="M3 7h18" />
      <path d="M7 4l4 3M7 4L3 7" />
      <path d="M17 7v5" />
      <path d="M15.6 12h2.8l-1.4 3z" />
      <path d="M7 10l2 2M7 13l2 2M7 16l2 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5L21.5 19.5H2.5z" />
      <path d="M12 9v5" />
      <path d="M12 16.8v.4" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0111 0" />
      <circle cx="17.5" cy="8" r="2.4" />
      <path d="M14.5 19a4 4 0 017 0" />
    </>
  ),
  car: (
    <>
      <path d="M3 15v-3.5L5.5 6.5h13L21 11.5V15z" />
      <path d="M6.5 15v2.5M17.5 15v2.5" />
      <path d="M6 11.5h12" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8h11.5v6.5H3.5z" />
      <path d="M15 10l5.5-2.5v7.5L15 12.5z" />
      <path d="M6 14.5V20" />
    </>
  ),
  bin: (
    <>
      <path d="M5 7h14" />
      <path d="M6.5 7l1.1 13.5h8.8L17.5 7" />
      <path d="M9.5 7V4.2h5V7" />
      <path d="M10.5 10.5V17M13.5 10.5V17" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.5 8.5h17V11a1.6 1.6 0 000 2.5V16h-17v-2.5a1.6 1.6 0 000-2.5z" />
      <path d="M12 9.5v5" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4c0 9-5.5 13-11 13a5.5 5.5 0 01-.5-11C14 5.5 20 4 20 4z" />
      <path d="M4 20c3.5-4.5 7-7 12-9" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 17a8 8 0 1116 0" />
      <path d="M12 17l4.5-5" />
      <path d="M4 17h16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <path d="M8.4 18h4.6a3.5 3.5 0 000-7H10a3.5 3.5 0 010-7h5.6" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3h9A1.5 1.5 0 0 1 16 4.5V21" />
      <path d="M16 10h3.5A1.5 1.5 0 0 1 21 11.5V21" />
      <path d="M3 21h18" />
      <path d="M7 7h2M11.5 7h1.5M7 11h2M11.5 11h1.5M7 15h2M11.5 15h1.5M18.5 14h.01M18.5 17.5h.01" />
    </>
  ),
  lamp: (
    <>
      <path d="M12 21v-9" />
      <path d="M8.5 21h7" />
      <path d="M12 12a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z" />
      <path d="M12 8V3.5" />
      <path d="M5 6.5l1.6 1M19 6.5l-1.6 1" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" />
    </>
  ),
};

export default function Icon({ name, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" {...rest}>
      {paths[name] ?? paths.city}
    </svg>
  );
}
