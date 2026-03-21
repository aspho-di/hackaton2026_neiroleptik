import { useState, useEffect } from 'react'
import { fetchFields } from '../api/client'

export function useFields() {
  const [fields,  setFields]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFields()
      .then(data => {
        if (data && Array.isArray(data)) {
          const adapted = data.map(f => ({
            field_id:  f.id,
            name:      f.name,
            crop:      f.crop_type    ?? 'пшеница',
            status:    'normal',
            temp:      22,
            precip:    5,
            area:      f.area_hectares,
            latitude:  f.latitude,
            longitude: f.longitude,
          }))
          setFields(adapted)
        } else {
          try {
            const saved = JSON.parse(localStorage.getItem('fields') || '[]')
            setFields(Array.isArray(saved) ? saved : [])
          } catch {
            setFields([])
          }
        }
      })
      .catch(() => {
        try {
          const saved = JSON.parse(localStorage.getItem('fields') || '[]')
          setFields(Array.isArray(saved) ? saved : [])
        } catch {
          setFields([])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return { fields, loading }
}
