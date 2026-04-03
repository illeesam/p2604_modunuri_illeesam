/**
 * 목록·작은 이미지용: 원본과 같은 폴더의 `{stem}_thumbnail.webp` 경로.
 * 생성: 저장소 루트에서 npm run thumbnails
 */
(function () {
  function imageThumbnailSrc(src) {
    if (!src || typeof src !== 'string') return '';
    var t = src.trim();
    if (!t) return '';
    if (/_thumbnail\.(webp|png|jpe?g)$/i.test(t)) return t;
    var i = t.lastIndexOf('.');
    if (i <= 0) return t;
    return t.slice(0, i) + '_thumbnail.webp';
  }
  window.imageThumbnailSrc = imageThumbnailSrc;
})();
