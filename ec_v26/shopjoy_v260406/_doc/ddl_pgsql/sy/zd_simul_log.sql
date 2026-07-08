-- zd_simul_log 테이블 DDL
-- 시뮬레이터 실행 로그

CREATE TABLE shopjoy_2604.zd_simul_log (
    log_id            VARCHAR(21)  NOT NULL PRIMARY KEY,
    site_id           VARCHAR(21)  NOT NULL,
    domain            VARCHAR(30)  NOT NULL,
    simul_mode        VARCHAR(10)  NOT NULL,
    simul_status      VARCHAR(10)  NOT NULL,
    desc_txt          TEXT        ,
    reason_txt        TEXT        ,
    target_id         VARCHAR(21) ,
    user_nm           VARCHAR(100),
    ui_nm             VARCHAR(50) ,
    detail_json       TEXT        ,
    reg_by            VARCHAR(30) ,
    reg_date          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    upd_by            VARCHAR(30) ,
    upd_date          TIMESTAMP
);

COMMENT ON TABLE  shopjoy_2604.zd_simul_log IS '시뮬레이터 실행 로그';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.log_id IS '로그ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.site_id IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.domain IS '도메인 (prod/member/order/claim/event/plan/promo/settle)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.simul_mode IS '실행유형 (생성/수정)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.simul_status IS '결과 (SUCCESS/FAIL)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.desc_txt IS '실행 내용 설명';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.reason_txt IS '실패 사유';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.target_id IS '생성/수정된 엔티티 ID';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.user_nm IS '실행자명';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.ui_nm IS '화면명 (업무/화면 구분용)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.detail_json IS '생성/수정된 엔티티 상세 JSON (params)';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.reg_by IS '등록자';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.reg_date IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.upd_by IS '수정자';
COMMENT ON COLUMN shopjoy_2604.zd_simul_log.upd_date IS '수정일시';

CREATE INDEX idx_zd_simul_log_site_id ON shopjoy_2604.zd_simul_log (site_id);
CREATE INDEX idx_zd_simul_log_domain  ON shopjoy_2604.zd_simul_log (domain);
CREATE INDEX idx_zd_simul_log_reg_date ON shopjoy_2604.zd_simul_log (reg_date DESC);
