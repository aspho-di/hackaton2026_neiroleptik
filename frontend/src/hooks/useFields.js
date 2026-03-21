import { useState, useEffect } from 'react'
import { fetchFields } from '../api/client'
import { loadSavedFields } from '../components/AddFieldModal'

// Адаптирует поле из Go-бэкенда к фронтовому формату
function adaptBackendField(f) {
  return {
    field_id:  f.id,
    name:      f.name,
    crop:      f.crop_type ?? 'wheat',
    status:    'normal',          // бэк не хранит статус — дефолт normal
    area:      f.area_hectares,
    latitude:  f.latitude,
    longitude: f.longitude,
    temp:      20,
    precip:    5,
    _source:   'backend',
  }
}

export function useFields() {
  const [fields,  setFields]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const localFields = loadSavedFields()

    fetchFields()
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          const backendFields = data.map(adaptBackendField)

          // Мержим: бэкенд-поля приоритетны, localStorage-поля добавляем если нет совпадения по field_id
          const backendIds = new Set(backendFields.map(f => f.field_id))
          const onlyLocal  = localFields.filter(f => !backendIds.has(f.field_id))
          setFields([...backendFields, ...onlyLocal])
        } else {
          // Бэк недоступен или вернул пустой массив — только localStorage
          setFields(localFields)
        }
      })
      .catch(() => setFields(localFields))
      .finally(() => setLoading(false))
  }, [])

  return { fields, loading }
}
