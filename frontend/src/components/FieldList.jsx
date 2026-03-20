import FieldCard from './FieldCard'

export default function FieldList({ fields }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {fields.map(field => (
        <FieldCard key={field.field_id} field={field} />
      ))}
    </div>
  )
}
