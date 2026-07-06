-- migration_20260707_simul_yn.sql
-- 시뮬레이터로 등록된 데이터 구분을 위한 simul_yn 컬럼 추가
-- 적용 대상: 시뮬레이터가 직접 생성/수정하는 도메인 테이블

-- ─── zd_simul_log 테이블 신규 생성 ──────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.zd_simul_log (
    log_id            VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id           VARCHAR(21)  NOT NULL,
    domain            VARCHAR(30)  NOT NULL,
    simul_mode        VARCHAR(10)  NOT NULL,
    simul_status      VARCHAR(10)  NOT NULL,
    desc_txt          TEXT        ,
    reason_txt        TEXT        ,
    target_id         VARCHAR(21) ,
    user_nm           VARCHAR(100),
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.zd_simul_log IS '시뮬레이터 실행 로그';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.log_id     IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.site_id    IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.domain     IS '도메인 (prod/member/order/claim/event/plan/promo/settle)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.simul_mode IS '실행유형 (생성/수정)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.simul_status IS '결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.desc_txt   IS '실행 내용 설명';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.reason_txt IS '실패 사유';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.target_id  IS '생성/수정된 엔티티 ID';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.user_nm    IS '실행자명';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.reg_by     IS '등록자';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.reg_date   IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.upd_by     IS '수정자';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.upd_date   IS '수정일시';

CREATE INDEX IF NOT EXISTS idx_zd_simul_log_site_id  ON shopjoy_2604.zd_simul_log (site_id);
CREATE INDEX IF NOT EXISTS idx_zd_simul_log_domain   ON shopjoy_2604.zd_simul_log (domain);
CREATE INDEX IF NOT EXISTS idx_zd_simul_log_reg_date ON shopjoy_2604.zd_simul_log (reg_date DESC);

-- ─── simul_yn 컬럼 추가 ─────────────────────────────────────────
-- 상품
ALTER TABLE shopjoy_2604.pd_prod    ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.pd_prod.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 회원
ALTER TABLE shopjoy_2604.mb_member  ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.mb_member.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 주문
ALTER TABLE shopjoy_2604.od_order   ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.od_order.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 클레임
ALTER TABLE shopjoy_2604.od_claim   ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.od_claim.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 이벤트
ALTER TABLE shopjoy_2604.pm_event   ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.pm_event.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 기획전
ALTER TABLE shopjoy_2604.pm_plan    ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.pm_plan.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 쿠폰
ALTER TABLE shopjoy_2604.pm_coupon  ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.pm_coupon.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 할인
ALTER TABLE shopjoy_2604.pm_discnt  ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.pm_discnt.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 적립
ALTER TABLE shopjoy_2604.pm_save    ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.pm_save.simul_yn IS '시뮬데이터여부 (Y/N)';

-- 정산
ALTER TABLE shopjoy_2604.st_settle  ADD COLUMN IF NOT EXISTS simul_yn VARCHAR(1) DEFAULT 'N' NOT NULL;
COMMENT ON COLUMN shopjoy_2604.st_settle.simul_yn IS '시뮬데이터여부 (Y/N)';
