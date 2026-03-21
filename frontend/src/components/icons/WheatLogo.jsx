export default function WheatLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Стебель */}
      <line x1="16" y1="30" x2="16" y2="6" stroke="#4caf50" strokeWidth="2" strokeLinecap="round"/>
      {/* Лист влево */}
      <path d="M16 20 Q10 17 9 12 Q14 14 16 19" fill="#4caf50"/>
      {/* Зёрна — нижний ряд */}
      <ellipse cx="12.5" cy="18" rx="3.2" ry="1.8" fill="#f5a623" transform="rotate(-35 12.5 18)"/>
      <ellipse cx="19.5" cy="18" rx="3.2" ry="1.8" fill="#e8941a" transform="rotate(35 19.5 18)"/>
      {/* Зёрна — средний ряд */}
      <ellipse cx="12" cy="13.5" rx="3" ry="1.7" fill="#f5b731" transform="rotate(-28 12 13.5)"/>
      <ellipse cx="20" cy="13.5" rx="3" ry="1.7" fill="#e8941a" transform="rotate(28 20 13.5)"/>
      {/* Зёрна — верхний ряд */}
      <ellipse cx="13" cy="9.5" rx="2.6" ry="1.5" fill="#f5c435" transform="rotate(-18 13 9.5)"/>
      <ellipse cx="19" cy="9.5" rx="2.6" ry="1.5" fill="#f0a020" transform="rotate(18 19 9.5)"/>
      {/* Верхушка */}
      <ellipse cx="16" cy="6.5" rx="2" ry="1.3" fill="#f5c842"/>
    </svg>
  )
}
