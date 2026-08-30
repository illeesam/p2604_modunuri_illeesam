-- pm_save_policy 테이블 DDL
-- 적립금 정책(캠페인) — 회원별 적립/사용 원장인 pm_save와 별개

CREATE TABLE shopjoy_2604.pm_save_policy (
    save_policy_id     VARCHAR(21)  NOT NULL CONSTRAINT pm_save_policy_pk_save_policy_id PRIMARY KEY,
    reg_site_id        VARCHAR(21)  NOT NULL,
    save_policy_nm     VARCHAR(100) NOT NULL,
    save_type_cd       VARCHAR(20) ,
    save_issue_type_cd VARCHAR(20) ,
    save_val           NUMERIC(12,2) DEFAULT 0,
    save_unit_cd       VARCHAR(10) ,
    min_order_amt      BIGINT        DEFAULT 0,
    expire_day         INTEGER     ,
    save_status_cd     VARCHAR(20) ,
    start_date         DATE        ,
    end_date           DATE        ,
    mem_grade_cd       VARCHAR(20) ,
    visibility_targets VARCHAR(200)  DEFAULT '^PUBLIC^',
    vendor_id          VARCHAR(21) ,
    charge_staff       VARCHAR(50) ,
    remark             TEXT        ,
    use_yn             VARCHAR(1)    DEFAULT 'Y',
    simul_yn           VARCHAR(1)    DEFAULT 'N',
    reg_by             VARCHAR(30) ,
    reg_date           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    upd_by             VARCHAR(30) ,
    upd_date           TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.pm_save_policy IS '적립금 정책(캠페인) — 회원별 적립/사용 원장인 pm_save와 별개';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.save_policy_id IS '적립금정책ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.reg_site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.save_policy_nm IS '적립금명';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.save_type_cd IS '적립금 유형 (코드: SAVE_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.save_issue_type_cd IS '적립유형 (코드: SAVE_ISSUE_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.save_val IS '적립값';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.save_unit_cd IS '적립단위 (코드: SAVE_UNIT)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.min_order_amt IS '최소주문금액';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.expire_day IS '유효기간(일)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.save_status_cd IS '상태 (코드: PROMO_STATUS)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.start_date IS '시작일';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.end_date IS '종료일';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.mem_grade_cd IS '적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.visibility_targets IS '공개대상 (^코드^코드^ 형식, 예: ^PUBLIC^)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.vendor_id IS '판매업체 (sy_vendor.vendor_id)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.charge_staff IS '판매담당자명 (업체 선택 시 자동 채움, 수정 가능)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.remark IS '비고';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.use_yn IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.simul_yn IS '시뮬데이터여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.reg_date IS '등록일';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.pm_save_policy.upd_date IS '수정일';
