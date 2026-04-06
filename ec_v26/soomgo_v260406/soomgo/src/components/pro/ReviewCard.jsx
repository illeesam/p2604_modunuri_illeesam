import StarRating from '../common/StarRating'

export default function ReviewCard({ review }) {
  return (
    <div className="border-b border-gray-100 pb-5 mb-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
          {review.author[0]}
        </div>
        <div>
          <div className="font-medium text-sm text-gray-900">{review.author}</div>
          <div className="text-xs text-gray-400">{review.date}</div>
        </div>
        <div className="ml-auto">
          <StarRating rating={review.rating} showNum={false} />
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
      {review.img && (
        <img src={review.img} alt="리뷰 이미지" className="mt-3 w-24 h-24 object-cover rounded-xl" />
      )}
    </div>
  )
}
