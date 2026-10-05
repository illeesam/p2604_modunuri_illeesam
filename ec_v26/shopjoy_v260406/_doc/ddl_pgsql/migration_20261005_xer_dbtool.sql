-- ═══════════════════════════════════════════════════════════
--  운영지원 > DB 도구(ecFeBoNuxt4 dbTool1 — 온라인 DBeaver + exERD) — xer_ 테이블 4개 · 메뉴 "DB 도구" · API 권한 보정
--  작성일: 2026-10-05
--
--  배경:
--   BO 플랫폼 관리자가 브라우저에서 DB 커넥션·스키마 트리(tables/views)를 보고, SQL 을 실행해 결과 그리드에서 바로 고쳐 저장하고,
--   exERD 처럼 ERD 를 드래그로 그려 폴더로 정리하는 도구. 백엔드 ecBeBo /api/bo/zd/dbtool/**(BO 토큰 + 플랫폼 관리자만).
--
--  ER(사용자 원칙: 관계를 복잡하게 만들지 않는다 — 테이블 4개, 관계 2개):
--     xer_folder.parent_folder_id → xer_folder (폴더 트리)
--     xer_erd.folder_id           → xer_folder (ERD 가 든 폴더, 비면 최상위)
--     xer_erd.conn_id·xer_sql_log.conn_id 는 FK 없음 — "DEFAULT"(기본(현재 DB)) 는 xer_conn 행이 없는 가상 커넥션이고,
--     실행 기록은 커넥션을 지워도 남아야 하므로(conn_nm 을 같이 적어 둔다).
--
--  ① xer_conn     커넥션 — 이름·유형(PostgreSQL)·호스트·포트·DB·스키마·사용자·암호화 비밀번호(Jasypt)·읽기 전용·위험 문장 허용·정렬·사용
--  ② xer_folder   ERD 폴더 트리 — 상위·이름·정렬(드래그로 이동·순서)
--  ③ xer_erd      ERD 문서 — 폴더·이름·커넥션·스키마·내용 JSON(엔티티·하위 영역·관계선·메모·화면 위치)·판 번호
--  ④ xer_sql_log  실행 감사 기록 — 누가·언제·어느 커넥션·SQL(비밀성 값 가림)·결과·영향 행 수·소요 시간
--  ⑤ 메뉴 운영지원(MN000213 DEVTOOLS) > DB 도구(그룹) > DB 도구(#page=zdDbTool) + 관리자 역할 3개 메뉴 권한
--  ⑥ API 권한 보정 — /api/bo/zd/dbtool/** 를 ADMIN(플랫폼 관리자만). 서버 수집 규칙이 /api/bo/zd/** 를 처음부터 ADMIN 으로 넣으므로 보통 0행
--
--  site_id 를 두지 않는 이유: 사이트 범위가 없는 플랫폼 도구다(모든 사이트의 데이터를 다루는 DB 자체를 보는 도구 — 사이트 한정 사용자는 API 가 403).
--  reg_site_id 는 다른 테이블과 같은 감사 필드(등록 당시 사이트)일 뿐 조건에 쓰지 않는다(정책 sy.57 §12).
--
--  사전 조회(2026-10-05, BO API 읽기 전용): xer_* 없음 · sy_menu 233행(최대 MN000282) · 운영지원 = MN000213(DEVTOOLS)
--     · 관리자 역할 ROLE000000000001(SUPER_ADMIN)·RL000002(SYS_ADMIN)·RL000001(행 없는 슈퍼관리자 묶음 ID)
--
--  사용법 (psql/DBeaver): 이 파일 전체를 실행한다. 다시 실행해도 안전하다
--     (테이블·인덱스 IF NOT EXISTS, 메뉴·역할 권한은 같은 것이 있으면 건너뜀, API 보정은 아직 손대지 않은 수집 행만).
--  순서: 백엔드 배포 전·후 상관없다. 백엔드는 테이블이 없으면 "DB 도구 테이블이 아직 없습니다"(400)만 주고 기동에는 영향이 없으며,
--        실행 뒤 10초 안에 재기동 없이 쓸 수 있다.
--  시험 데이터: 만들지 않는다. 그리드 편집 시험은 xer_folder 자체를 대상으로 한다.
--
--  되돌리기(필요할 때만):
--     DELETE FROM shopjoy_2604.sy_role_menu WHERE reg_by = 'MIGRATION_20261005_XERDBTOOL';
--     DELETE FROM shopjoy_2604.sy_menu      WHERE reg_by = 'MIGRATION_20261005_XERDBTOOL' AND menu_code IN ('ZD_DB_TOOL', 'G_DEVTOOLS_DBTOOL');
--     DROP TABLE IF EXISTS shopjoy_2604.xer_sql_log;
--     DROP TABLE IF EXISTS shopjoy_2604.xer_erd;
--     DROP TABLE IF EXISTS shopjoy_2604.xer_folder;
--     DROP TABLE IF EXISTS shopjoy_2604.xer_conn;
-- ═══════════════════════════════════════════════════════════

SET search_path TO shopjoy_2604;

-- ───────────────────────────────────────────────────────────
-- 1) xer_conn — 커넥션
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.xer_conn (
    conn_id          VARCHAR(21)   NOT NULL,
    conn_nm          VARCHAR(100)  NOT NULL,
    db_type_cd       VARCHAR(20)   NOT NULL DEFAULT 'POSTGRESQL',
    host_nm          VARCHAR(200)  NOT NULL,
    port_no          INTEGER       NOT NULL DEFAULT 5432,
    db_nm            VARCHAR(100)  NOT NULL,
    schema_nm        VARCHAR(100),
    user_nm          VARCHAR(100)  NOT NULL,
    conn_pwd_enc     VARCHAR(1000),
    read_only_yn     VARCHAR(1)    NOT NULL DEFAULT 'Y',
    danger_allow_yn  VARCHAR(1)    NOT NULL DEFAULT 'N',
    sort_ord         INTEGER       DEFAULT 10,
    use_yn           VARCHAR(1)    NOT NULL DEFAULT 'Y',
    conn_remark      VARCHAR(500),
    reg_by           VARCHAR(30),
    reg_date         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    reg_site_id      VARCHAR(21),
    upd_by           VARCHAR(30),
    upd_date         TIMESTAMP,
    CONSTRAINT xer_conn_pk_conn_id PRIMARY KEY (conn_id),
    CONSTRAINT xer_conn_ck_read_only_yn CHECK (read_only_yn IN ('Y', 'N')),
    CONSTRAINT xer_conn_ck_danger_allow_yn CHECK (danger_allow_yn IN ('Y', 'N')),
    CONSTRAINT xer_conn_ck_use_yn CHECK (use_yn IN ('Y', 'N')),
    CONSTRAINT xer_conn_ck_port_no CHECK (port_no BETWEEN 1 AND 65535)
);
CREATE INDEX IF NOT EXISTS xer_conn_ix01_sort_ord ON shopjoy_2604.xer_conn (sort_ord, conn_nm);

COMMENT ON TABLE  shopjoy_2604.xer_conn IS 'DB 도구 커넥션 — 운영지원 > DB 도구에서 접속할 다른 DB. 기본(현재 DB)은 행 없이 백엔드 DataSource 를 쓴다(conn_id DEFAULT). 플랫폼 도구라 site_id 없음';
COMMENT ON COLUMN shopjoy_2604.xer_conn.conn_id         IS '커넥션ID (XC+YYMMDDhhmmss+순번4). DEFAULT 는 예약(기본(현재 DB))';
COMMENT ON COLUMN shopjoy_2604.xer_conn.conn_nm         IS '커넥션 이름';
COMMENT ON COLUMN shopjoy_2604.xer_conn.db_type_cd      IS 'DB 유형 — 지금은 POSTGRESQL 만';
COMMENT ON COLUMN shopjoy_2604.xer_conn.host_nm         IS '호스트 (영문·숫자·점·하이픈만 — JDBC URL 옵션 끼워 넣기 방지)';
COMMENT ON COLUMN shopjoy_2604.xer_conn.port_no         IS '포트';
COMMENT ON COLUMN shopjoy_2604.xer_conn.db_nm           IS 'DB 이름';
COMMENT ON COLUMN shopjoy_2604.xer_conn.schema_nm       IS '기본 스키마 (currentSchema)';
COMMENT ON COLUMN shopjoy_2604.xer_conn.user_nm         IS '접속 사용자';
COMMENT ON COLUMN shopjoy_2604.xer_conn.conn_pwd_enc    IS '암호화한 비밀번호 (Jasypt, 마스터키 JASYPT_ENCRYPTOR_PASSWORD) — API 응답·로그·감사 기록에 싣지 않고 DB 도구 SQL 결과에서도 가린다';
COMMENT ON COLUMN shopjoy_2604.xer_conn.read_only_yn    IS '읽기 전용 여부 — Y 면 쓰기 모드에서도 쓰기 문장·그리드 저장 불가 (기본 Y)';
COMMENT ON COLUMN shopjoy_2604.xer_conn.danger_allow_yn IS '위험 문장 허용 여부 — DDL(CREATE·ALTER·DROP·TRUNCATE…)·WHERE 없는 UPDATE/DELETE. N 이면 거부, Y 여도 확인 문구 입력 필요 (기본 N)';
COMMENT ON COLUMN shopjoy_2604.xer_conn.sort_ord        IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.xer_conn.use_yn          IS '사용여부';
COMMENT ON COLUMN shopjoy_2604.xer_conn.conn_remark     IS '비고';
COMMENT ON COLUMN shopjoy_2604.xer_conn.reg_by          IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.xer_conn.reg_date        IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.xer_conn.reg_site_id     IS '등록 사이트ID (감사 필드 — 조건에 쓰지 않음)';
COMMENT ON COLUMN shopjoy_2604.xer_conn.upd_by          IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.xer_conn.upd_date        IS '수정일시';

-- ───────────────────────────────────────────────────────────
-- 2) xer_folder — ERD 폴더 트리
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.xer_folder (
    folder_id         VARCHAR(21)   NOT NULL,
    parent_folder_id  VARCHAR(21),
    folder_nm         VARCHAR(100)  NOT NULL,
    sort_ord          INTEGER       DEFAULT 999,
    reg_by            VARCHAR(30),
    reg_date          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    reg_site_id       VARCHAR(21),
    upd_by            VARCHAR(30),
    upd_date          TIMESTAMP,
    CONSTRAINT xer_folder_pk_folder_id PRIMARY KEY (folder_id),
    CONSTRAINT xer_folder_fk_parent_folder_id FOREIGN KEY (parent_folder_id)
        REFERENCES shopjoy_2604.xer_folder (folder_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS xer_folder_ix01_parent_folder_id ON shopjoy_2604.xer_folder (parent_folder_id, sort_ord);

COMMENT ON TABLE  shopjoy_2604.xer_folder IS 'DB 도구 ERD 폴더 트리 — 드래그로 이동·순서 변경. 비어 있어야 지운다. 플랫폼 도구라 site_id 없음';
COMMENT ON COLUMN shopjoy_2604.xer_folder.folder_id        IS '폴더ID (XF+YYMMDDhhmmss+순번4)';
COMMENT ON COLUMN shopjoy_2604.xer_folder.parent_folder_id IS '상위 폴더ID (xer_folder.folder_id, 없으면 최상위)';
COMMENT ON COLUMN shopjoy_2604.xer_folder.folder_nm        IS '폴더 이름';
COMMENT ON COLUMN shopjoy_2604.xer_folder.sort_ord         IS '정렬순서 (같은 상위 안)';
COMMENT ON COLUMN shopjoy_2604.xer_folder.reg_by           IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.xer_folder.reg_date         IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.xer_folder.reg_site_id      IS '등록 사이트ID (감사 필드 — 조건에 쓰지 않음)';
COMMENT ON COLUMN shopjoy_2604.xer_folder.upd_by           IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.xer_folder.upd_date         IS '수정일시';

-- ───────────────────────────────────────────────────────────
-- 3) xer_erd — ERD 문서
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.xer_erd (
    erd_id     VARCHAR(21)   NOT NULL,
    folder_id  VARCHAR(21),
    erd_nm     VARCHAR(200)  NOT NULL,
    conn_id    VARCHAR(21)   NOT NULL DEFAULT 'DEFAULT',
    schema_nm  VARCHAR(100),
    erd_json   TEXT,
    erd_ver    INTEGER       NOT NULL DEFAULT 1,
    sort_ord   INTEGER       DEFAULT 999,
    erd_desc   VARCHAR(500),
    reg_by     VARCHAR(30),
    reg_date   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    reg_site_id VARCHAR(21),
    upd_by     VARCHAR(30),
    upd_date   TIMESTAMP,
    CONSTRAINT xer_erd_pk_erd_id PRIMARY KEY (erd_id),
    CONSTRAINT xer_erd_fk_folder_id FOREIGN KEY (folder_id)
        REFERENCES shopjoy_2604.xer_folder (folder_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS xer_erd_ix01_folder_id ON shopjoy_2604.xer_erd (folder_id, sort_ord);

COMMENT ON TABLE  shopjoy_2604.xer_erd IS 'DB 도구 ERD 문서 — 내용은 JSON 한 칸(엔티티·하위 영역·관계선·메모·화면 위치). 하위 영역별 보기는 같은 ERD 안의 영역으로. 플랫폼 도구라 site_id 없음';
COMMENT ON COLUMN shopjoy_2604.xer_erd.erd_id     IS 'ERD ID (XE+YYMMDDhhmmss+순번4)';
COMMENT ON COLUMN shopjoy_2604.xer_erd.folder_id  IS '폴더ID (xer_folder.folder_id, 없으면 최상위)';
COMMENT ON COLUMN shopjoy_2604.xer_erd.erd_nm     IS 'ERD 이름';
COMMENT ON COLUMN shopjoy_2604.xer_erd.conn_id    IS '커넥션ID — 표 연결형 엔티티의 컬럼을 읽을 커넥션 (DEFAULT = 기본(현재 DB), 그 밖은 xer_conn.conn_id, FK 없음)';
COMMENT ON COLUMN shopjoy_2604.xer_erd.schema_nm  IS '기본 스키마';
COMMENT ON COLUMN shopjoy_2604.xer_erd.erd_json   IS 'ERD 내용 JSON — {version, viewport:{x,y,zoom}, nodes:[{id, type:entity|area|memo, position, size, parentId(영역), data:{mode:TABLE|LOGICAL, schema, table, logicalNm, color, columns[논리 엔티티만]}}], edges:[{id, source, target, sourceHandle, targetHandle, data:{cardinality 1:1|1:N|N:M, label, identifying}}]}';
COMMENT ON COLUMN shopjoy_2604.xer_erd.erd_ver    IS '저장 판 번호 — 내용 저장마다 +1. 화면이 읽은 판과 다르면 저장 거부(두 사람이 덮어쓰지 않게)';
COMMENT ON COLUMN shopjoy_2604.xer_erd.sort_ord   IS '정렬순서 (같은 폴더 안)';
COMMENT ON COLUMN shopjoy_2604.xer_erd.erd_desc   IS '설명';
COMMENT ON COLUMN shopjoy_2604.xer_erd.reg_by     IS '등록자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.xer_erd.reg_date   IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.xer_erd.reg_site_id IS '등록 사이트ID (감사 필드 — 조건에 쓰지 않음)';
COMMENT ON COLUMN shopjoy_2604.xer_erd.upd_by     IS '수정자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.xer_erd.upd_date   IS '수정일시';

-- ───────────────────────────────────────────────────────────
-- 4) xer_sql_log — 실행 감사 기록
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopjoy_2604.xer_sql_log (
    log_id         VARCHAR(21)   NOT NULL,
    conn_id        VARCHAR(21)   NOT NULL,
    conn_nm        VARCHAR(100),
    exec_type_cd   VARCHAR(20)   NOT NULL,
    stmt_type_cd   VARCHAR(30),
    write_mode_yn  VARCHAR(1)    NOT NULL DEFAULT 'N',
    sql_text       TEXT,
    param_json     TEXT,
    result_cd      VARCHAR(20)   NOT NULL,
    row_cnt        INTEGER,
    elapsed_ms     INTEGER,
    err_msg        VARCHAR(1000),
    client_ip      VARCHAR(50),
    reg_by         VARCHAR(30),
    reg_date       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    reg_site_id    VARCHAR(21),
    upd_by         VARCHAR(30),
    upd_date       TIMESTAMP,
    CONSTRAINT xer_sql_log_pk_log_id PRIMARY KEY (log_id),
    CONSTRAINT xer_sql_log_ck_result_cd CHECK (result_cd IN ('RUN', 'OK', 'PARTIAL', 'ERROR', 'DENY'))
);
CREATE INDEX IF NOT EXISTS xer_sql_log_ix01_reg_date ON shopjoy_2604.xer_sql_log (reg_date DESC);
CREATE INDEX IF NOT EXISTS xer_sql_log_ix02_reg_by   ON shopjoy_2604.xer_sql_log (reg_by, reg_date DESC);
CREATE INDEX IF NOT EXISTS xer_sql_log_ix03_conn_id  ON shopjoy_2604.xer_sql_log (conn_id, reg_date DESC);

COMMENT ON TABLE  shopjoy_2604.xer_sql_log IS 'DB 도구 실행 감사 기록 — 실행 전에 RUN 으로 남기고(못 남기면 실행 안 함) 끝나면 결과로 고친다. 정책 거부는 DENY. 커넥션을 지워도 남는다(FK 없음, conn_nm 함께 기록)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.log_id        IS '기록ID (XL+YYMMDDhhmmss+순번4)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.conn_id       IS '커넥션ID (DEFAULT = 기본(현재 DB))';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.conn_nm       IS '실행 당시 커넥션 이름';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.exec_type_cd  IS '실행 구분 — QUERY(SQL 실행) / SAVE(그리드 저장)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.stmt_type_cd  IS '문장 첫 키워드 (SELECT·UPDATE·DROP… / 그리드 저장 GRID_SAVE)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.write_mode_yn IS '쓰기 모드로 실행했는가';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.sql_text      IS '실행 SQL (2만 자까지, password = ''…'' 같은 비밀성 리터럴은 **** 로 가림). 그리드 저장은 요약';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.param_json    IS '파라미터 JSON (비밀성 키·컬럼 값은 ****). 그리드 저장은 행별 op·기본키·수정 후 값';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.result_cd     IS '결과 — RUN(실행 중·서버 중단) / OK / PARTIAL(저장 일부 거부) / ERROR(DB 오류) / DENY(정책 거부)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.row_cnt       IS '조회 행 수 또는 영향 행 수';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.elapsed_ms    IS '소요 시간(ms)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.err_msg       IS '오류·거부 사유';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.client_ip     IS '요청 IP (리버스 프록시가 붙인 X-Forwarded-For 마지막 값)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.reg_by        IS '실행자 (sy_user.user_id)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.reg_date      IS '실행 일시';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.reg_site_id   IS '등록 사이트ID (감사 필드 — 조건에 쓰지 않음)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.upd_by        IS '수정자 (결과 기록 시 실행자)';
COMMENT ON COLUMN shopjoy_2604.xer_sql_log.upd_date      IS '결과 기록 일시';

-- ───────────────────────────────────────────────────────────
-- 5) 메뉴 — 운영지원(DEVTOOLS) > DB 도구(그룹) > DB 도구(화면 #page=zdDbTool)
--    형식은 BO [메뉴 동기화]가 만든 행과 같다(그룹 = FOLDER·URL 없음, 화면 = PAGE·#page=화면ID). 화면 본체는 별도 앱 ecFeBoNuxt4 dbTool1.
--    menu_id 는 지금 가장 큰 번호 + 1, +2. 운영지원 상단 행이 없으면(동기화 전) 만들지 않고 건너뛴다.
-- ───────────────────────────────────────────────────────────
INSERT INTO shopjoy_2604.sy_menu (menu_id, menu_code, menu_nm, parent_menu_id, menu_url, menu_type_cd, icon_class, sort_ord, use_yn, menu_remark, reg_by, reg_date, reg_site_id)
SELECT 'MN' || lpad(((SELECT max(substr(menu_id, 3)::int) FROM shopjoy_2604.sy_menu WHERE menu_id ~ '^MN[0-9]{6}$') + 1)::text, 6, '0'),
       'G_DEVTOOLS_DBTOOL', 'DB 도구', top.menu_id, NULL, 'FOLDER', NULL, 10, 'Y',
       'DB 도구(ecFeBoNuxt4 dbTool1) — 플랫폼 관리자 전용', 'MIGRATION_20261005_XERDBTOOL', CURRENT_TIMESTAMP, 'SI260001'
  FROM (SELECT min(menu_id) AS menu_id FROM shopjoy_2604.sy_menu
         WHERE menu_code = 'DEVTOOLS' OR (parent_menu_id IS NULL AND menu_url IS NULL AND menu_nm IN ('운영지원', '개발도구'))) top
 WHERE top.menu_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu m WHERE m.menu_code = 'G_DEVTOOLS_DBTOOL'
                      OR (m.parent_menu_id = top.menu_id AND m.menu_url IS NULL AND m.menu_nm = 'DB 도구'));

INSERT INTO shopjoy_2604.sy_menu (menu_id, menu_code, menu_nm, parent_menu_id, menu_url, menu_type_cd, icon_class, sort_ord, use_yn, menu_remark, reg_by, reg_date, reg_site_id)
SELECT 'MN' || lpad(((SELECT max(substr(menu_id, 3)::int) FROM shopjoy_2604.sy_menu WHERE menu_id ~ '^MN[0-9]{6}$') + 1)::text, 6, '0'),
       'ZD_DB_TOOL', 'DB 도구', grp.menu_id, '#page=zdDbTool', 'PAGE', NULL, 1, 'Y',
       '커넥션·스키마 트리·SQL 실행(그리드 편집 저장)·ERD — 별도 앱 ecFeBoNuxt4 dbTool1. API /api/bo/zd/dbtool/**(플랫폼 관리자만)',
       'MIGRATION_20261005_XERDBTOOL', CURRENT_TIMESTAMP, 'SI260001'
  FROM (SELECT min(menu_id) AS menu_id FROM shopjoy_2604.sy_menu WHERE menu_code = 'G_DEVTOOLS_DBTOOL') grp
 WHERE grp.menu_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu m WHERE m.menu_code = 'ZD_DB_TOOL' OR m.menu_url = '#page=zdDbTool');

-- 관리자 역할 메뉴 권한 — SUPER_ADMIN(ROLE000000000001) 2 · SYS_ADMIN(RL000002) 2 · RL000001 3 (API 권한관리 메뉴와 같음)
INSERT INTO shopjoy_2604.sy_role_menu (role_menu_id, role_id, menu_id, perm_level, reg_by, reg_date, reg_site_id)
SELECT 'ROM261005XD' || v.sfx, v.role_id, m.menu_id, v.perm_level, 'MIGRATION_20261005_XERDBTOOL', CURRENT_TIMESTAMP, 'SI260001'
  FROM (VALUES ('01', 'ROLE000000000001', 2), ('02', 'RL000002', 2), ('03', 'RL000001', 3)) AS v(sfx, role_id, perm_level)
  JOIN shopjoy_2604.sy_menu m ON m.menu_id = (SELECT min(x.menu_id) FROM shopjoy_2604.sy_menu x WHERE x.menu_code = 'ZD_DB_TOOL' OR x.menu_url = '#page=zdDbTool')
 WHERE NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_role_menu x WHERE x.role_id = v.role_id AND x.menu_id = m.menu_id)
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_role_menu x WHERE x.role_menu_id = 'ROM261005XD' || v.sfx);

-- ───────────────────────────────────────────────────────────
-- 6) API 권한 보정 — /api/bo/zd/dbtool/** = ADMIN (서버가 수집한 행 중 관리자가 아직 손대지 않은 것만). sy_api 가 없으면 건너뜀
-- ───────────────────────────────────────────────────────────
DO $$
BEGIN
    IF to_regclass('shopjoy_2604.sy_api') IS NOT NULL THEN
        UPDATE shopjoy_2604.sy_api SET perm_type_cd = 'ADMIN', upd_date = CURRENT_TIMESTAMP
         WHERE upd_by = 'SYSTEM_COLLECT' AND perm_type_cd <> 'ADMIN'
           AND url_pattern LIKE '/api/bo/zd/dbtool%';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
--  검증
-- ═══════════════════════════════════════════════════════════
-- SELECT to_regclass('shopjoy_2604.xer_conn'), to_regclass('shopjoy_2604.xer_folder'),
--        to_regclass('shopjoy_2604.xer_erd'), to_regclass('shopjoy_2604.xer_sql_log');                     → 4개 모두 이름
-- SELECT menu_id, menu_code, menu_nm, parent_menu_id, menu_url FROM shopjoy_2604.sy_menu
--  WHERE menu_code IN ('G_DEVTOOLS_DBTOOL', 'ZD_DB_TOOL') ORDER BY menu_id;                                → 2행 (그룹 → 화면)
-- SELECT role_id, perm_level FROM shopjoy_2604.sy_role_menu WHERE reg_by = 'MIGRATION_20261005_XERDBTOOL';  → 3행
-- (백엔드 수집 뒤) SELECT http_method, url_pattern, perm_type_cd FROM shopjoy_2604.sy_api
--                  WHERE url_pattern LIKE '/api/bo/zd/dbtool%' ORDER BY 2, 1;                              → 모두 ADMIN
