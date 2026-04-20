-- ============================================================
-- pm_save_issue : 적립금 지급 이력
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- 구매적립/이벤트/리뷰/관리자 등 적립 발생 건별 기록
-- 지급 확정 후 pm_save 원장에 EARN 타입으로 반영
-- ============================================================
CREATE TABLE pm_save_issue (
    save_issue_id       VARCHAR(21)     NOT NULL,
    site_id             VARCHAR(21),                            -- sy_site.site_id
    member_id           VARCHAR(21)     NOT NULL,               -- mb_member.member_id
    save_issue_type_cd  VARCHAR(20)     NOT NULL,               -- 코드: SAVE_ISSUE_TYPE (ORDER:구매적립/EVENT:이벤트/REVIEW:리뷰/REFERRAL:추천/ADMIN:관리자)
    save_amt            BIGINT          NOT NULL,               -- 지급 적립금액
    save_rate           NUMERIC(5,2),                           -- 적립률 (%, 구매적립 시)
    ref_type_cd         VARCHAR(20),                            -- 참조유형 (ORDER/EVENT/REVIEW/ADMIN)
    ref_id              VARCHAR(21),                            -- 참조ID (order_id / event_id 등)
    order_id            VARCHAR(21),                            -- od_order.order_id (구매적립 시)
    order_item_id       VARCHAR(21),                            -- od_order_item.order_item_id (상품별 적립 시)
    prod_id             VARCHAR(21),                            -- pd_prod.prod_id (적립 기준 상품)
    expire_date         TIMESTAMP,                              -- 소멸예정일
    issue_status_cd     VARCHAR(20)     DEFAULT 'PENDING',      -- 코드: SAVE_ISSUE_STATUS (PENDING:대기/CONFIRMED:확정/EXPIRED:소멸/CANCELED:취소)
    issue_status_cd_before VARCHAR(20),                         -- 변경 전 상태
    save_memo           VARCHAR(300),                           -- 지급 메모
    reg_by              VARCHAR(30),
    reg_date            TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by              VARCHAR(30),
    upd_date            TIMESTAMP,

    PRIMARY KEY (save_issue_id)
);

COMMENT ON TABLE  pm_save_issue IS '적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등)';
COMMENT ON COLUMN pm_save_issue.save_issue_id       IS '적립지급ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN pm_save_issue.site_id             IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN pm_save_issue.member_id           IS '회원ID (mb_member.member_id)';
COMMENT ON COLUMN pm_save_issue.save_issue_type_cd  IS '지급유형 (코드: SAVE_ISSUE_TYPE — ORDER/EVENT/REVIEW/REFERRAL/ADMIN)';
COMMENT ON COLUMN pm_save_issue.save_amt            IS '지급 적립금액';
COMMENT ON COLUMN pm_save_issue.save_rate           IS '적립률 (%, 구매적립 시)';
COMMENT ON COLUMN pm_save_issue.ref_type_cd         IS '참조유형 (ORDER/EVENT/REVIEW/ADMIN)';
COMMENT ON COLUMN pm_save_issue.ref_id              IS '참조ID (order_id / event_id 등)';
COMMENT ON COLUMN pm_save_issue.order_id            IS '주문ID (od_order.order_id, 구매적립 시)';
COMMENT ON COLUMN pm_save_issue.order_item_id       IS '주문상품ID (od_order_item.order_item_id, 상품별 적립 시)';
COMMENT ON COLUMN pm_save_issue.prod_id             IS '상품ID (pd_prod.prod_id, 적립 기준 상품)';
COMMENT ON COLUMN pm_save_issue.expire_date         IS '소멸예정일';
COMMENT ON COLUMN pm_save_issue.issue_status_cd     IS '지급상태 (코드: SAVE_ISSUE_STATUS — PENDING/CONFIRMED/EXPIRED/CANCELED)';
COMMENT ON COLUMN pm_save_issue.issue_status_cd_before IS '변경 전 지급상태';
COMMENT ON COLUMN pm_save_issue.save_memo           IS '지급 메모';
COMMENT ON COLUMN pm_save_issue.reg_by              IS '등록자';
COMMENT ON COLUMN pm_save_issue.reg_date            IS '등록일';
COMMENT ON COLUMN pm_save_issue.upd_by              IS '수정자';
COMMENT ON COLUMN pm_save_issue.upd_date            IS '수정일';

CREATE INDEX idx_pm_save_issue_member  ON pm_save_issue (member_id);
CREATE INDEX idx_pm_save_issue_type    ON pm_save_issue (save_issue_type_cd);
CREATE INDEX idx_pm_save_issue_order   ON pm_save_issue (order_id);
CREATE INDEX idx_pm_save_issue_item    ON pm_save_issue (order_item_id);
CREATE INDEX idx_pm_save_issue_status  ON pm_save_issue (issue_status_cd);
CREATE INDEX idx_pm_save_issue_expire  ON pm_save_issue (expire_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] pm_save_issue.save_issue_type_cd (지급유형) : SAVE_ISSUE_TYPE { JOIN:회원가입, ORDER_COMPLT:구매완료, REVIEW_TEXT:텍스트리뷰, REVIEW_PHOTO:포토리뷰, REVIEW_VIDEO:동영상리뷰, EVENT:이벤트, BIRTHDAY:생일, REFERRAL:추천인, ADMIN_GRANT:관리자지급, ADMIN_REVOKE:관리자회수, ORDER_CANCEL:주문취소, EXPIRE:기간만료, CLAIM_SHIP:클레임배송비 }
-- [CODES] pm_save_issue.issue_status_cd (지급상태) : SAVE_ISSUE_STATUS { SCHEDULED:예정, COMPLETED:완료, CANCELLED:취소, EXPIRED:만료 }
