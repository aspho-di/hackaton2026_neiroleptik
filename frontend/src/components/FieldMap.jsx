import { useEffect, useRef } from 'react'

// Leaflet-based map for field location
// Uses dynamic import to avoid SSR issues and fix default marker icons
export default function FieldMap({ latitude, longitude, fieldName }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)

  const lat = latitude  ?? 47.23
  const lng = longitude ?? 39.72

  useEffect(() => {
    if (instanceRef.current) return // already initialized

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Fix default marker icon paths for Vite
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
        iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
        shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
      })

      if (!mapRef.current || instanceRef.current) return

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      // Green circle for field area
      L.circle([lat, lng], {
        color: '#1a4d2e',
        fillColor: '#4caf50',
        fillOpacity: 0.20,
        radius: 600,
        weight: 2,
      }).addTo(map)

      // Custom green marker
      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:linear-gradient(135deg,#1a4d2e,#4caf50);
          border:3px solid #fff;
          box-shadow:0 3px 10px rgba(26,77,46,0.45);
          display:flex;align-items:center;justify-content:center;
        "></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<b style="font-family:Montserrat,sans-serif">${fieldName || 'Участок'}</b><br>${lat.toFixed(4)}, ${lng.toFixed(4)}`)

      instanceRef.current = map
    }

    init()

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }
    }
  }, [latitude, longitude, fieldName])

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600,
        fontSize: '14px',
        color: 'var(--color-text)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        Положение участка
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 'auto' }}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
      <div ref={mapRef} style={{ height: '240px', width: '100%' }} />
    </div>
  )
}
