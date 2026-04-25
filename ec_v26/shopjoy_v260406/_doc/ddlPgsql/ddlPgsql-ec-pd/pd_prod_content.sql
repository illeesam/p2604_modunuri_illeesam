-- 상품 상세 컨텐츠 (HTML 에디터로 관리)
CREATE TABLE pd_prod_content (
    prod_content_id VARCHAR(21)     NOT NULL,
    site_id         VARCHAR(21),                            -- sy_site.site_id
    prod_id         VARCHAR(21)     NOT NULL,              -- FK: pd_prod.prod_id
    content_type_cd VARCHAR(50)     NOT NULL,              -- 코드: PROD_CONTENT_TYPE (상세설명, 사용설명, 배송정보, AS정보, 반품정책 등)
    content_html    TEXT,                                   -- HTML 에디터 컨텐츠
    sort_ord        INTEGER         DEFAULT 0,              -- 정렬순서
    use_yn          CHAR(1)         DEFAULT 'Y',            -- 사용여부 Y/N
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    PRIMARY KEY (prod_content_id)
);

COMMENT ON TABLE pd_prod_content IS '상품 상세 컨텐츠 (HTML 에디터)';
COMMENT ON COLUMN pd_prod_content.prod_content_id IS '상품컨텐츠ID';
COMMENT ON COLUMN pd_prod_content.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pd_prod_content.prod_id      IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pd_prod_content.content_type_cd IS '컨텐츠유형 (코드: PROD_CONTENT_TYPE — 상세설명, 사용설명, 배송정보, AS정보, 반품정책 등)';
COMMENT ON COLUMN pd_prod_content.content_html IS 'HTML 에디터 컨텐츠';
COMMENT ON COLUMN pd_prod_content.sort_ord     IS '정렬순서';
COMMENT ON COLUMN pd_prod_content.use_yn       IS '사용여부 Y/N';
COMMENT ON COLUMN pd_prod_content.reg_by       IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_content.reg_date     IS '등록일';
COMMENT ON COLUMN pd_prod_content.upd_by       IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pd_prod_content.upd_date     IS '수정일';

CREATE INDEX idx_pd_prod_content_prod ON pd_prod_content (prod_id, content_type_cd);

-- 컨텐츠 예시:
-- content_type='상세설명', content_html='<h2>제품 특징</h2><p>고급 천연 면...</p>'
-- content_type='사용설명', content_html='<ol><li>물에 불려...</li></ol>'
-- content_type='배송정보', content_html='<p>해외배송 불가, 제주도 배송료 +3,000원</p>'
-- content_type='AS정보', content_html='<p>구매 후 30일 이내 교환/반품 가능</p>'

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pd_prod_content.content_type_cd (컨텐츠유형) : PROD_CONTENT_TYPE { DETAIL:상세설명, NOTICE:안내, GUIDE:이용안내, SIZE_GUIDE:사이즈안내 }
