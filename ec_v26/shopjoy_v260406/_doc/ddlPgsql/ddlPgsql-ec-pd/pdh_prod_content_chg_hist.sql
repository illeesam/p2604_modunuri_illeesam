-- 상품 컨텐츠 변경 이력
CREATE TABLE pdh_prod_content_chg_hist (
    hist_id          VARCHAR(21)     NOT NULL,
    site_id          VARCHAR(21),                            -- sy_site.site_id
    prod_id          VARCHAR(21)     NOT NULL,              -- FK: pd_prod.prod_idprod_id
    prod_content_id  VARCHAR(21)     NOT NULL,              -- FK: pd_prod_content.prod_content_id
    content_type_cd  VARCHAR(50),                            -- 컨텐츠유형코드 (상세설명, 사용설명 등)
    content_before   TEXT,                                   -- 변경전 컨텐츠
    content_after    TEXT,                                   -- 변경후 컨텐츠
    chg_reason       VARCHAR(200),                           -- 변경사유
    chg_user_id           VARCHAR(21),                            -- 처리자 (sy_user.user_id)
    chg_date         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP, -- 처리일시
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    PRIMARY KEY (hist_id)
);

COMMENT ON TABLE pdh_prod_content_chg_hist IS '상품 컨텐츠 변경 이력';
COMMENT ON COLUMN pdh_prod_content_chg_hist.hist_id      IS '이력ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.site_id      IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.prod_id      IS '상품ID (pd_prod.prod_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.prod_content_id IS '상품컨텐츠ID (pd_prod_content.)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.content_type_cd IS '컨텐츠유형코드 (상세설명, 사용설명, 배송정보 등)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.content_before IS '변경전 HTML 컨텐츠';
COMMENT ON COLUMN pdh_prod_content_chg_hist.content_after  IS '변경후 HTML 컨텐츠';
COMMENT ON COLUMN pdh_prod_content_chg_hist.chg_reason    IS '변경사유 (예: 내용 오류 수정, 계절 업데이트)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.chg_user_id        IS '처리자 (sy_user.user_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.chg_date      IS '처리일시';
COMMENT ON COLUMN pdh_prod_content_chg_hist.reg_by        IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.reg_date      IS '등록일';
COMMENT ON COLUMN pdh_prod_content_chg_hist.upd_by        IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN pdh_prod_content_chg_hist.upd_date      IS '수정일';

CREATE INDEX idx_pdh_prod_content_chg_hist_prod ON pdh_prod_content_chg_hist (prod_id, chg_date DESC);

-- 변경 예시:
-- content_type='상세설명', content_before='<p>이전 내용...</p>', content_after='<p>신규 내용...</p>', chg_reason='내용 오류 수정'
