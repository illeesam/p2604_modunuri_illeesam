-- ============================================================
-- dp_panel : 디스플레이 패널
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(20)
-- ============================================================
CREATE TABLE dp_panel (
    panel_id                    VARCHAR(21)     NOT NULL,
    site_id                     VARCHAR(21),                            -- sy_site.site_id
    panel_nm                    VARCHAR(100)    NOT NULL,
    panel_type_cd               VARCHAR(30),                            -- 코드: DISP_TYPE
    disp_path                   VARCHAR(200),                           -- 점(.) 구분 표시경로
    visibility_targets          VARCHAR(200),                           -- 공개대상 (^CODE^CODE^ 형식)
    use_yn                      CHAR(1)         DEFAULT 'Y',            -- 사용여부 (Y/N)
    use_start_date              DATE,                                   -- 사용시작일
    use_end_date                DATE,                                   -- 사용종료일
    disp_panel_status_cd        VARCHAR(20)     DEFAULT 'ACTIVE',      -- 코드: DISP_STATUS
    disp_panel_status_cd_before VARCHAR(20),                            -- 변경 전 패널상태
    content_json                TEXT,                                   -- 패널의 콘텐츠 데이터 (JSON)
    reg_by                      VARCHAR(30),
    reg_date                    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    upd_by                      VARCHAR(30),
    upd_date                    TIMESTAMP,
    PRIMARY KEY (panel_id),
    FOREIGN KEY (area_id) REFERENCES dp_area(area_id)
);

COMMENT ON TABLE dp_panel IS '디스플레이 패널';
COMMENT ON COLUMN dp_panel.panel_id                    IS '패널ID (YYMMDDhhmmss+rand4)';
COMMENT ON COLUMN dp_panel.site_id                     IS '사이트ID (sy_site.site_id)';
COMMENT ON COLUMN dp_panel.panel_nm                    IS '패널명';
COMMENT ON COLUMN dp_panel.panel_type_cd               IS '표시유형 (코드: DISP_TYPE)';
COMMENT ON COLUMN dp_panel.disp_path                   IS '점(.) 구분 표시경로';
COMMENT ON COLUMN dp_panel.visibility_targets          IS '공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN dp_panel.use_yn                      IS '사용여부 (Y/N)';
COMMENT ON COLUMN dp_panel.use_start_date              IS '사용시작일';
COMMENT ON COLUMN dp_panel.use_end_date                IS '사용종료일';
COMMENT ON COLUMN dp_panel.disp_panel_status_cd        IS '상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN dp_panel.disp_panel_status_cd_before IS '변경 전 패널상태 (코드: DISP_STATUS)';
COMMENT ON COLUMN dp_panel.content_json                IS '패널콘텐츠 (JSON - 위젯 목록 및 설정)';
COMMENT ON COLUMN dp_panel.reg_by                      IS '등록자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_panel.reg_date                    IS '등록일';
COMMENT ON COLUMN dp_panel.upd_by                      IS '수정자 (sy_user.user_id, mb_member.member_id)';
COMMENT ON COLUMN dp_panel.upd_date                    IS '수정일';

CREATE INDEX idx_dp_panel_site ON dp_panel (site_id);
CREATE INDEX idx_dp_panel_status ON dp_panel (disp_panel_status_cd);
CREATE INDEX idx_dp_panel_use ON dp_panel (use_yn, use_start_date, use_end_date);

-- ============================================================
-- 코드값 참조
-- ============================================================
-- [CODES] dp_panel.panel_type_cd (표시유형) : 전시유형 { MAIN_BANNER:메인배너, SUB_BANNER:서브배너, POPUP:팝업, SPECIAL:기획전 }
-- [CODES] dp_panel.disp_panel_status_cd (상태) : 전시상태 { SHOW:노출, HIDE:숨김 }
