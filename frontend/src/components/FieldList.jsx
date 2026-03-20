import FieldCard from './FieldCard'

export default function FieldList({ fields }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
      {fields.map(field => (
        <FieldCard key={field.field_id} field={field} />
      ))}
    </div>
  )
}
