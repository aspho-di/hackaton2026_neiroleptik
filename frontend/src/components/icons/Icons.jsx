const props = (size, color) => ({
  width: size, height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { display: 'block', flexShrink: 0 },
})

export const IconWheat = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M12 22V2"/>
    <path d="M17 7c0-2.8-2.2-5-5-5S7 4.2 7 7c0 2.1 1.3 3.9 3 4.8"/>
    <path d="M7 12c0-2.8 2.2-5 5-5s5 2.2 5 5c0 2.1-1.3 3.9-3 4.8"/>
    <path d="M17 17c0-2.8-2.2-5-5-5s-5 2.2-5 5c0 2.1 1.3 3.9 3 4.8"/>
  </svg>
)

export const IconCheck = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)} strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export const IconX = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)} strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export const IconWarning = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

export const IconCircleAlert = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

export const IconDroplet = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
)

export const IconThermometer = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
  </svg>
)

export const IconBuilding = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4v18"/>
    <path d="M19 21V11l-6-4"/>
    <path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/>
  </svg>
)

export const IconMapPin = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

export const IconMail = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

export const IconPhone = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

export const IconMap = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
)

export const IconSun = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

export const IconBarChart = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)

export const IconBell = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

export const IconDroplets = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.09 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
  </svg>
)

export const IconTrendingUp = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

export const IconCompare = ({ size = 16, color = 'currentColor' }) => (
  <svg {...props(size, color)}>
    <rect x="2" y="3" width="8" height="18" rx="1"/>
    <rect x="14" y="3" width="8" height="18" rx="1"/>
    <line x1="12" y1="8" x2="12" y2="16" strokeDasharray="2 2"/>
  </svg>
)
