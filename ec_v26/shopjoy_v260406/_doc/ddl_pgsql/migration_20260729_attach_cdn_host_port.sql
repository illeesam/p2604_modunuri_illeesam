-- ============================================================================
-- sy_attach — 첨부 URL 에 박힌 옛 포트(8080) 정정 (2026-07-29)
--
-- 백엔드 포트가 3000 인데 일부 첨부 URL 이 http://localhost:8080/cdn/... 으로 저장돼 있다.
-- 앱이 8080 에서 돌던 시절 업로드된 행으로 보인다.
--
-- 증상: FO FAQ 화면에서 답변 첨부 썸네일이 net::ERR_CONNECTION_REFUSED 로 깨진다.
--       화면 자체는 뜨므로(FAQ 72건 정상) 놓치기 쉽다.
--
-- 근본 대책은 절대 URL 을 저장하지 않는 것이지만(호스트가 바뀌면 또 깨진다),
-- 여기서는 이미 저장된 값만 현재 포트로 맞춘다.
-- ============================================================================

UPDATE shopjoy_2604.sy_attach
   SET cdn_img_url   = REPLACE(cdn_img_url,   'localhost:8080', 'localhost:3000'),
       cdn_thumb_url = REPLACE(cdn_thumb_url, 'localhost:8080', 'localhost:3000'),
       thumb_cdn_url = REPLACE(thumb_cdn_url, 'localhost:8080', 'localhost:3000'),
       cdn_host      = REPLACE(cdn_host,      'localhost:8080', 'localhost:3000')
 WHERE cdn_img_url   LIKE '%localhost:8080%'
    OR cdn_thumb_url LIKE '%localhost:8080%'
    OR thumb_cdn_url LIKE '%localhost:8080%'
    OR cdn_host      LIKE '%localhost:8080%';
