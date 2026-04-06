export default function StarRating({ rating, size = 'sm', showNum = true }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'} ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>★</span>
    )
  }
  return (
    <span className="flex items-center gap-0.5">
      {stars}
      {showNum && <span className="ml-1 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>}
    </span>
  )
}
