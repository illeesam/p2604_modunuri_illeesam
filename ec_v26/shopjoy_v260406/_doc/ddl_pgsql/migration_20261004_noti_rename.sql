-- ═══════════════════════════════════════════════════════════
--  알림 용어 보정 alarm/alim → noti — sy_alarm·syh_alarm_send_hist·sy_noti 를 ap_(앱) 도메인으로
--  작성일: 2026-10-04
--
--  배경:
--   사용자 요청 "noti / alim / alarm 용어를 앱푸시 표준 용어로 가급적 해줘 … 충돌 무시하고 그냥 변경하면 돼".
--   앱 푸시 표준 용어는 notification(줄여 noti) 이다 — Android 의 alarm 은 예약 타이머(AlarmManager)라 푸시 용어가 아니고,
--   alim 은 한글 "알림" 의 로마자 표기다. 알림 기능은 새 도메인 접두어 ap_(앱) 로 모은다(이력 테이블은 규칙대로 aph_).
--
--   ■ 테이블·컬럼
--     sy_alarm            → ap_fcm_noti_send        (알림 발송 건)
--         alarm_id → noti_send_id, alarm_title → noti_send_title, alarm_type_cd → noti_send_type_cd, alarm_msg → noti_send_msg,
--         alarm_send_date → noti_send_date, alarm_status_cd → noti_send_status_cd, alarm_send_count → noti_send_count,
--         alarm_fail_count → noti_fail_count   (나머지 컬럼은 그대로)
--     syh_alarm_send_hist → aph_fcm_noti_send_hist  (알림 발송 이력)   alarm_id → noti_send_id
--     sy_noti             → ap_fcm_noti             (알림함 — 수신자 1명 = 1행, 컬럼명 그대로)
--     PK·인덱스 이름도 새 테이블 접두어로(제약명 = 인덱스명 규칙, 이름 안의 alarm_id 도 noti_send_id 로).
--   ■ 설정값
--     코드그룹  ALARM_TYPE_CD → NOTI_SEND_TYPE_CD, ALARM_STATUS → NOTI_SEND_STATUS, ALARM_CHANNEL → NOTI_CHANNEL,
--               ALARM_TARGET_TYPE → NOTI_TARGET_TYPE  (path_id system.alarm.* → system.noti.*, sy_code 행·코드 값은 그대로)
--               ※ NOTI_TYPE 이 아니라 NOTI_SEND_TYPE_CD — ap_fcm_noti.noti_type_cd(NOTICE/ALARM/SPECIAL)와 헷갈리지 않게
--     배치      SY_SEND_ALARM → SY_SEND_NOTI   (syh_batch_log 의 옛 실행 이력은 그대로)
--     템플릿    CONTACT_RECEIVED_ALARM → CONTACT_RECEIVED_NOTI   (카카오 *_ALIMTALK 은 카카오 상품명이라 그대로)
--     메뉴      SY_ALARM(#page=syAlarmMng) → AP_FCM_NOTI_SEND(#page=apFcmNotiSendMng)
--     표시경로  sy_path.biz_cd sy_alarm → ap_fcm_noti_send (루트 라벨도), 배치 트리 라벨 'Alarm' → 'Noti'
--     다국어    syCode.ALARM_* 키 → syCode.NOTI_*, 설명 'auto: SyAlarmMng.js / ZdTestPushAlim*.js' → 새 화면 파일명
--     엑셀      sy_exceldown domain_cd syAlarm → apFcmNotiSend (api_url·엑셀 컬럼 필드명 포함)
--     팝업      cm_popup.apply_ui_memo 의 SyAlarmMng.js/SyAlarmDtl.js → ApFcmNotiSendMng.js/ApFcmNotiSendDtl.js
--     단어사전  zd_meta_word 'alarm'(알림) 삭제, 'noti'(알림) 의 비표준 동의어에 alarm,alim 추가
--   ■ 그대로 두는 것
--     코드 "값"(예 ap_fcm_noti.noti_type_cd 'ALARM', 코드 값 EMAIL/SMS/KAKAO …), 카카오 알림톡(alimtalk·KAKAO_ALIM·*_ALIMTALK·
--     app.kakao.alimtalk.sender-key), 로그·이력(syh_*_log, syh_batch_log, cf_file 파일명), 소스생성기 이력(md_sg_*),
--     스키마 스냅샷(zd_meta_snapshot), 백업 스키마(bak_contact_20260927.syh_alarm_send_hist), ap_fcm_noti_send.path_id 의 'alarm.인앱' 값(행 데이터)
--
--   ■ 독립 실행(순서 무관) 보장
--     0단계: 알림함(sy_noti 또는 이미 바뀐 ap_fcm_noti)에 site_id·tenant_modules 가 없으면 추가하고 회원 알림의 사이트를 채운다
--            — migration_20261004_noti_fcm_push.sql 의 1) 과 같은 내용. 그래서 이 스크립트만 먼저 돌려도 호환 뷰 sy_noti 가 새 컬럼을 담는다.
--     ⚠ 반대 순서 주의: 이 스크립트 뒤에 migration_20261004_noti_fcm_push.sql 을 돌리면 그 1) 의 ALTER TABLE sy_noti ADD COLUMN 2문장과
--        CREATE INDEX … ON sy_noti 가 "sy_noti 는 뷰" 라서 실패한다(나머지 COMMENT·UPDATE 는 뷰로 통과). 1) 은 이 스크립트 0단계가 이미 했으므로
--        그 3문장 오류는 무시해도 되고, 2) mb_device_token 부분은 psql 기본 실행(ON_ERROR_STOP 없음)이면 그대로 적용된다
--        (2026-10-04 로컬 PostgreSQL 17.2 리허설로 확인 — DBeaver 처럼 오류에서 멈추는 도구면 2) 만 따로 실행).
--     migration_20261003_cm_bbm_site_ownership.py(대기 중) 는 sy_alarm 이 ap_fcm_noti_send 로 바뀌었으면 그쪽에 site_id 를 단다(순서 무관).
--     호환 뷰는 만드는 시점의 실제 컬럼(사이트 정비가 먼저 돌아 생긴 site_id 등 포함)을 모두 담는다.
--
--   ■ 호환 뷰 (옛 이름·옛 컬럼명)
--     sy_alarm / syh_alarm_send_hist / sy_noti 를 단일 테이블 단순 컬럼 뷰로 만든다 → PostgreSQL 자동 갱신 가능 뷰
--     (FROM 테이블 1개, 식·집계·DISTINCT·LIMIT 없음, 컬럼은 이름만 바꾼 참조) — 지금 배포된 옛 백엔드가 배포 전까지 그대로 읽고 쓴다.
--     뷰로 INSERT 할 때 빠진 컬럼은 원본 테이블 기본값이 들어간다(검증 단계에서 실제로 넣어 보고 되돌린다).
--     1단계 직후 ~ 배포 전 옛 화면에서 달라 보이는 것: 알림 코드 라벨(코드그룹 이름이 바뀜)·표시경로 트리(biz_cd 바뀜)가 비어 보이고,
--     옛 배치 SY_SEND_ALARM 은 sy_batch 에 없어 실행되지 않는다(매일 08:00) → 1단계는 배포 직전에 실행할 것.
--
-- ═══════════════════════════════════════════════════════════
--  사용법 (psql/DBeaver, 스키마 소유자 postgres 로 실행)
--   (1) migration_20261004_noti_fcm_push.sql  (먼저 — sy_noti 사이트/모듈, mb_device_token)
--   (2) 이 파일 1단계 (BEGIN … COMMIT 한 트랜잭션, 재실행해도 안전 — 중간에 실패하면 전체 롤백)
--   (3) ecBeBo·ecFeBo(브랜치 feature/noti-rename-20261004)·ecBeBatchJenkins(casc) 배포, Jenkins 옛 잡 SY_SEND_ALARM 삭제
--   (4) BO 알림관리·발송이력·FO 종 아이콘 확인 뒤 맨 아래 2단계(호환 뷰 삭제) 실행
--   ※ 2단계 뒤에 1단계를 다시 돌리면 호환 뷰만 다시 생긴다 → 그때는 2단계도 다시 실행.
-- ═══════════════════════════════════════════════════════════

-- 도우미 함수 (세션 임시 pg_temp — 연결을 끊으면 사라진다)

-- 테이블 이름·컬럼 이름·PK/인덱스 이름 변경 (재실행 안전: 이미 바뀌었으면 건너뜀)
--   p_cols: ARRAY[['옛컬럼','새컬럼'], …] 또는 NULL
CREATE OR REPLACE FUNCTION pg_temp.mig_noti_rename(p_old text, p_new text, p_cols text[])
RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
    k_old text;
    k_new text;
    r     record;
    v_nm  text;
    i     int;
BEGIN
    SELECT c.relkind::text INTO k_old FROM pg_class c WHERE c.relnamespace = 'shopjoy_2604'::regnamespace AND c.relname = p_old;
    SELECT c.relkind::text INTO k_new FROM pg_class c WHERE c.relnamespace = 'shopjoy_2604'::regnamespace AND c.relname = p_new;
    IF k_old = 'r' AND k_new IS NULL THEN
        EXECUTE format('ALTER TABLE shopjoy_2604.%I RENAME TO %I', p_old, p_new);
        RAISE NOTICE '테이블 이름 % → %', p_old, p_new;
    ELSIF k_new = 'r' AND (k_old IS NULL OR k_old = 'v') THEN
        RAISE NOTICE '테이블 % → % 는 이미 바뀜 — 이름 변경 건너뜀', p_old, p_new;
    ELSE
        RAISE EXCEPTION '테이블 상태가 이상합니다: %(relkind=%) / %(relkind=%) — 옛 이름=테이블·새 이름=없음 이거나 옛 이름=뷰/없음·새 이름=테이블 이어야 함',
            p_old, coalesce(k_old, '없음'), p_new, coalesce(k_new, '없음');
    END IF;

    -- 컬럼 이름
    FOR i IN 1 .. coalesce(array_length(p_cols, 1), 0) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'shopjoy_2604' AND table_name = p_new AND column_name = p_cols[i][1]) THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'shopjoy_2604' AND table_name = p_new AND column_name = p_cols[i][2]) THEN
                RAISE EXCEPTION '컬럼 충돌: %.% 와 %.% 가 둘 다 있습니다', p_new, p_cols[i][1], p_new, p_cols[i][2];
            END IF;
            EXECUTE format('ALTER TABLE shopjoy_2604.%I RENAME COLUMN %I TO %I', p_new, p_cols[i][1], p_cols[i][2]);
            RAISE NOTICE '컬럼 이름 %.% → %', p_new, p_cols[i][1], p_cols[i][2];
        END IF;
    END LOOP;

    -- 제약 이름 (PK 등 — 제약이 가진 인덱스 이름도 같이 바뀐다)
    FOR r IN SELECT co.conname FROM pg_constraint co
              WHERE co.conrelid = format('shopjoy_2604.%I', p_new)::regclass AND starts_with(co.conname, p_old || '_') LOOP
        v_nm := substr(r.conname, length(p_old) + 1);
        FOR i IN 1 .. coalesce(array_length(p_cols, 1), 0) LOOP
            v_nm := replace(v_nm, p_cols[i][1], p_cols[i][2]);
        END LOOP;
        v_nm := p_new || v_nm;
        IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'shopjoy_2604'::regnamespace AND relname = v_nm) THEN
            RAISE EXCEPTION '제약/인덱스 이름 % 이 이미 있습니다', v_nm;
        END IF;
        EXECUTE format('ALTER TABLE shopjoy_2604.%I RENAME CONSTRAINT %I TO %I', p_new, r.conname, v_nm);
        RAISE NOTICE '제약 이름 % → %', r.conname, v_nm;
    END LOOP;

    -- 나머지 인덱스 이름
    FOR r IN SELECT ci.relname FROM pg_index x JOIN pg_class ci ON ci.oid = x.indexrelid
              WHERE x.indrelid = format('shopjoy_2604.%I', p_new)::regclass AND starts_with(ci.relname, p_old || '_') LOOP
        v_nm := substr(r.relname, length(p_old) + 1);
        FOR i IN 1 .. coalesce(array_length(p_cols, 1), 0) LOOP
            v_nm := replace(v_nm, p_cols[i][1], p_cols[i][2]);
        END LOOP;
        v_nm := p_new || v_nm;
        IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'shopjoy_2604'::regnamespace AND relname = v_nm) THEN
            RAISE EXCEPTION '인덱스 이름 % 이 이미 있습니다', v_nm;
        END IF;
        EXECUTE format('ALTER INDEX shopjoy_2604.%I RENAME TO %I', r.relname, v_nm);
        RAISE NOTICE '인덱스 이름 % → %', r.relname, v_nm;
    END LOOP;
END $f$;

-- 호환 뷰 (옛 이름·옛 컬럼명) — 만드는 시점의 실제 컬럼을 모두 담는다. 이미 뷰가 있으면 다시 만든다.
CREATE OR REPLACE FUNCTION pg_temp.mig_noti_view(p_view text, p_table text, p_cols text[])
RETURNS void LANGUAGE plpgsql AS $f$
DECLARE
    k_view text;
    v_sel  text;
    v_own  text;
    g      record;
BEGIN
    SELECT c.relkind::text INTO k_view FROM pg_class c WHERE c.relnamespace = 'shopjoy_2604'::regnamespace AND c.relname = p_view;
    IF k_view = 'v' THEN
        EXECUTE format('DROP VIEW shopjoy_2604.%I', p_view);
    ELSIF k_view IS NOT NULL THEN
        RAISE EXCEPTION '% 이름의 다른 객체(relkind=%)가 있어 호환 뷰를 만들 수 없습니다', p_view, k_view;
    END IF;

    SELECT string_agg(CASE WHEN m.old_col IS NULL THEN format('%I', a.attname)
                           ELSE format('%I AS %I', a.attname, m.old_col) END, ', ' ORDER BY a.attnum)
      INTO v_sel
      FROM pg_attribute a
      LEFT JOIN (SELECT p_cols[s][1] AS old_col, p_cols[s][2] AS new_col
                   FROM generate_subscripts(p_cols, 1) AS s) m ON m.new_col = a.attname
     WHERE a.attrelid = format('shopjoy_2604.%I', p_table)::regclass AND a.attnum > 0 AND NOT a.attisdropped;

    EXECUTE format('CREATE VIEW shopjoy_2604.%I AS SELECT %s FROM shopjoy_2604.%I', p_view, v_sel, p_table);
    EXECUTE format('COMMENT ON VIEW shopjoy_2604.%I IS %L', p_view,
                   '호환용 임시 뷰 → ' || p_table || ' (2026-10-04 용어 보정 alarm→noti 1단계, 배포 전 옛 백엔드용 — 배포 확인 뒤 2단계에서 삭제)');

    -- 원본 테이블 권한(소유자 외)을 뷰에도 같게
    SELECT pg_get_userbyid(c.relowner) INTO v_own FROM pg_class c WHERE c.oid = format('shopjoy_2604.%I', p_table)::regclass;
    FOR g IN SELECT grantee, string_agg(privilege_type, ', ') AS privs
               FROM information_schema.role_table_grants
              WHERE table_schema = 'shopjoy_2604' AND table_name = p_table AND grantee <> v_own
              GROUP BY grantee LOOP
        EXECUTE format('GRANT %s ON shopjoy_2604.%I TO %s', g.privs, p_view,
                       CASE WHEN g.grantee = 'PUBLIC' THEN 'PUBLIC' ELSE quote_ident(g.grantee) END);
    END LOOP;
    RAISE NOTICE '호환 뷰 % → % : %', p_view, p_table, v_sel;
END $f$;


-- ═══════════════════════════════════════════════════════════
--  1단계 — 배포 "전" (한 트랜잭션)
-- ═══════════════════════════════════════════════════════════
BEGIN;
SET LOCAL lock_timeout = '10s';           -- 잠금을 10초 안에 못 잡으면 실패·롤백 (다시 실행하면 된다)
SET LOCAL statement_timeout = '5min';

-- 대상 테이블 잠금 (있는 이름만 — 뷰를 잠그면 원본 테이블도 같이 잠긴다)
DO $$
DECLARE
    v text;
BEGIN
    FOREACH v IN ARRAY ARRAY['sy_alarm', 'ap_fcm_noti_send', 'syh_alarm_send_hist', 'aph_fcm_noti_send_hist', 'sy_noti', 'ap_fcm_noti'] LOOP
        IF EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'shopjoy_2604'::regnamespace AND relname = v AND relkind IN ('r', 'v')) THEN
            EXECUTE format('LOCK TABLE shopjoy_2604.%I IN ACCESS EXCLUSIVE MODE', v);
        END IF;
    END LOOP;
END $$;

-- 0) 알림함 사이트·대상 모듈 (migration_20261004_noti_fcm_push.sql 1) 과 같음 — 이미 있으면 건너뜀)
DO $$
DECLARE
    t text := CASE WHEN EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'shopjoy_2604'::regnamespace AND relname = 'ap_fcm_noti' AND relkind = 'r')
                   THEN 'ap_fcm_noti' ELSE 'sy_noti' END;
    n int;
BEGIN
    EXECUTE format('ALTER TABLE shopjoy_2604.%I ADD COLUMN IF NOT EXISTS site_id VARCHAR(21)', t);
    EXECUTE format('ALTER TABLE shopjoy_2604.%I ADD COLUMN IF NOT EXISTS tenant_modules VARCHAR(200)', t);
    EXECUTE format('COMMENT ON COLUMN shopjoy_2604.%I.site_id IS %L', t, '사이트ID (sy_site.site_id) - 알림이 속한 사이트(회원 알림=그 회원의 사이트)');
    EXECUTE format('COMMENT ON COLUMN shopjoy_2604.%I.tenant_modules IS %L', t, '대상 FO 모듈 목록(콤마 구분, 예 ec1,ec2) - NULL/빈값=사이트 전체');
    -- 기존 회원 알림은 그 회원의 사이트로 (사용자 알림은 사이트 없음 = BO 공통)
    EXECUTE format('UPDATE shopjoy_2604.%I n SET site_id = m.site_id FROM shopjoy_2604.mb_member m
                     WHERE n.recv_type_cd = ''MEMBER'' AND n.recv_id = m.member_id AND n.site_id IS NULL', t);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE '0) %.site_id 회원 알림 채움 %행', t, n;
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relnamespace = 'shopjoy_2604'::regnamespace AND relname IN ('sy_noti_ix_recv', 'ap_fcm_noti_ix_recv')) THEN
        EXECUTE format('CREATE INDEX %I ON shopjoy_2604.%I (recv_type_cd, recv_id, site_id, read_yn)',
                       CASE WHEN t = 'sy_noti' THEN 'sy_noti_ix_recv' ELSE 'ap_fcm_noti_ix_recv' END, t);
    END IF;
END $$;

-- 1) 테이블·컬럼·PK/인덱스 이름
SELECT pg_temp.mig_noti_rename('sy_alarm', 'ap_fcm_noti_send', ARRAY[
    ['alarm_id',         'noti_send_id'],
    ['alarm_title',      'noti_send_title'],
    ['alarm_type_cd',    'noti_send_type_cd'],
    ['alarm_msg',        'noti_send_msg'],
    ['alarm_send_date',  'noti_send_date'],
    ['alarm_status_cd',  'noti_send_status_cd'],
    ['alarm_send_count', 'noti_send_count'],
    ['alarm_fail_count', 'noti_fail_count']]);
SELECT pg_temp.mig_noti_rename('syh_alarm_send_hist', 'aph_fcm_noti_send_hist', ARRAY[['alarm_id', 'noti_send_id']]);
SELECT pg_temp.mig_noti_rename('sy_noti', 'ap_fcm_noti', NULL);

-- 2) 주석 (바뀐 이름·코드그룹을 가리키는 것만 — 나머지 주석은 이름 변경을 그대로 따라간다)
COMMENT ON TABLE  shopjoy_2604.ap_fcm_noti_send                   IS '알림 발송';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_type_cd IS '알림유형 (코드: NOTI_SEND_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.channel_cd        IS '발송채널 (코드: NOTI_CHANNEL)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.target_type_cd    IS '대상유형 (코드: NOTI_TARGET_TYPE — ALL/GRADE/MEMBER)';
COMMENT ON COLUMN shopjoy_2604.ap_fcm_noti_send.noti_send_status_cd IS '발송상태 (코드: NOTI_SEND_STATUS — PENDING/SENT/FAILED/CANCELLED)';
COMMENT ON COLUMN shopjoy_2604.aph_fcm_noti_send_hist.noti_send_id IS '알림ID (ap_fcm_noti_send.noti_send_id)';

-- 3) 코드그룹 (새 이름이 비어 있을 때만 — 남은 옛 이름은 아래 검증에서 실패로 잡힌다). sy_code 는 code_grp_id 로 연결돼 손대지 않음
UPDATE shopjoy_2604.sy_code_grp g SET code_grp = m.new_grp
  FROM (VALUES ('ALARM_TYPE_CD', 'NOTI_SEND_TYPE_CD'), ('ALARM_STATUS', 'NOTI_SEND_STATUS'),
               ('ALARM_CHANNEL', 'NOTI_CHANNEL'), ('ALARM_TARGET_TYPE', 'NOTI_TARGET_TYPE')) AS m(old_grp, new_grp)
 WHERE g.code_grp = m.old_grp
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp x WHERE x.code_grp = m.new_grp);
UPDATE shopjoy_2604.sy_code_grp SET path_id = 'system.noti.' || substr(path_id, length('system.alarm.') + 1)
 WHERE starts_with(path_id, 'system.alarm.');

-- 4) 다국어 — 코드 라벨 키(syCode.{코드그룹}.{값}) · 자동수집 설명의 화면 파일명
UPDATE shopjoy_2604.sy_i18n t SET i18n_key = m.new_key
  FROM (SELECT i18n_id,
               regexp_replace(regexp_replace(regexp_replace(regexp_replace(i18n_key,
                   '^syCode\.ALARM_TYPE_CD\.',     'syCode.NOTI_SEND_TYPE_CD.'),
                   '^syCode\.ALARM_STATUS\.',      'syCode.NOTI_SEND_STATUS.'),
                   '^syCode\.ALARM_CHANNEL\.',     'syCode.NOTI_CHANNEL.'),
                   '^syCode\.ALARM_TARGET_TYPE\.', 'syCode.NOTI_TARGET_TYPE.') AS new_key
          FROM shopjoy_2604.sy_i18n
         WHERE starts_with(i18n_key, 'syCode.ALARM_')) m
 WHERE t.i18n_id = m.i18n_id AND m.new_key <> t.i18n_key
   AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_i18n x WHERE x.i18n_key = m.new_key);
UPDATE shopjoy_2604.sy_i18n
   SET i18n_desc = replace(replace(replace(replace(i18n_desc,
                       'SyAlarmMng.js',         'ApFcmNotiSendMng.js'),
                       'SyAlarmDtl.js',         'ApFcmNotiSendDtl.js'),
                       'ZdTestPushAlimFcm.js',  'ZdTestPushNotiFcm.js'),
                       'ZdTestPushAlimApns.js', 'ZdTestPushNotiApns.js')
 WHERE i18n_desc ~ '(SyAlarmMng|SyAlarmDtl|ZdTestPushAlimFcm|ZdTestPushAlimApns)\.js';

-- 5) 배치·템플릿 코드
UPDATE shopjoy_2604.sy_batch SET batch_code = 'SY_SEND_NOTI'
 WHERE batch_code = 'SY_SEND_ALARM' AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_batch WHERE batch_code = 'SY_SEND_NOTI');
UPDATE shopjoy_2604.sy_template SET template_code = 'CONTACT_RECEIVED_NOTI'
 WHERE template_code = 'CONTACT_RECEIVED_ALARM' AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_template WHERE template_code = 'CONTACT_RECEIVED_NOTI');

-- 6) BO 메뉴 (화면 ID syAlarmMng → apFcmNotiSendMng, 푸시 테스트 zdTestPushAlim* → zdTestPushNoti* — 지금 메뉴 행은 알림관리 1건뿐)
UPDATE shopjoy_2604.sy_menu SET menu_code = 'AP_FCM_NOTI_SEND'
 WHERE menu_code = 'SY_ALARM' AND NOT EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu WHERE menu_code = 'AP_FCM_NOTI_SEND');
UPDATE shopjoy_2604.sy_menu
   SET menu_url = replace(replace(replace(replace(menu_url,
                      '#page=syAlarmMng',         '#page=apFcmNotiSendMng'),
                      '#page=syAlarmDtl',         '#page=apFcmNotiSendDtl'),
                      '#page=zdTestPushAlimFcm',  '#page=zdTestPushNotiFcm'),
                      '#page=zdTestPushAlimApns', '#page=zdTestPushNotiApns')
 WHERE menu_url ~ '#page=(syAlarmMng|syAlarmDtl|zdTestPushAlimFcm|zdTestPushAlimApns)';

-- 7) 표시경로 (biz_cd = 테이블명)
UPDATE shopjoy_2604.sy_path SET biz_cd = 'ap_fcm_noti_send' WHERE biz_cd = 'sy_alarm';
UPDATE shopjoy_2604.sy_path SET biz_cd = 'aph_fcm_noti_send_hist' WHERE biz_cd = 'syh_alarm_send_hist';
UPDATE shopjoy_2604.sy_path SET biz_cd = 'ap_fcm_noti' WHERE biz_cd = 'sy_noti';
UPDATE shopjoy_2604.sy_path SET path_label = 'ap_fcm_noti_send' WHERE biz_cd = 'ap_fcm_noti_send' AND path_label = 'sy_alarm';
UPDATE shopjoy_2604.sy_path SET path_label = 'Noti' WHERE biz_cd = 'sy_batch' AND path_label = 'Alarm';

-- 8) 엑셀 다운로드 기록 (도메인 키 = 엔티티명, 엑셀 컬럼 = 화면 필드명)
UPDATE shopjoy_2604.sy_exceldown
   SET domain_cd = CASE domain_cd WHEN 'syAlarm' THEN 'apFcmNotiSend' WHEN 'syhAlarmSendHist' THEN 'aphFcmNotiSendHist' ELSE 'apFcmNoti' END,
       api_url   = replace(replace(replace(api_url, '/syAlarm/', '/apFcmNotiSend/'), '/syhAlarmSendHist/', '/aphFcmNotiSendHist/'), '/syNoti/', '/apFcmNoti/'),
       excel_columns = replace(replace(replace(replace(replace(replace(replace(replace(excel_columns,
                           'alarmSendDate', 'notiSendDate'), 'alarmSendCount', 'notiSendCount'), 'alarmFailCount', 'notiFailCount'),
                           'alarmTypeCd', 'notiSendTypeCd'), 'alarmStatusCd', 'notiSendStatusCd'),
                           'alarmTitle', 'notiSendTitle'), 'alarmMsg', 'notiSendMsg'), 'alarmId', 'notiSendId'),
       search_param_json = replace(replace(replace(replace(replace(replace(replace(replace(search_param_json,
                           'alarmSendDate', 'notiSendDate'), 'alarmSendCount', 'notiSendCount'), 'alarmFailCount', 'notiFailCount'),
                           'alarmTypeCd', 'notiSendTypeCd'), 'alarmStatusCd', 'notiSendStatusCd'),
                           'alarmTitle', 'notiSendTitle'), 'alarmMsg', 'notiSendMsg'), 'alarmId', 'notiSendId')
 WHERE domain_cd IN ('syAlarm', 'syhAlarmSendHist', 'syNoti');

-- 9) 공통팝업 적용 화면 메모
UPDATE shopjoy_2604.cm_popup
   SET apply_ui_memo = replace(replace(apply_ui_memo, 'SyAlarmDtl.js', 'ApFcmNotiSendDtl.js'), 'SyAlarmMng.js', 'ApFcmNotiSendMng.js')
 WHERE apply_ui_memo ~ 'SyAlarm(Dtl|Mng)\.js';

-- 10) 단어사전 — 알림의 표준 약어는 noti, alarm·alim 은 비표준 동의어(표준점검이 찾아낸다)
UPDATE shopjoy_2604.zd_meta_word
   SET synonym_abbrs = CASE WHEN coalesce(synonym_abbrs, '') = '' THEN 'alarm,alim' ELSE synonym_abbrs || ',alarm,alim' END
 WHERE word_abbr = 'noti' AND coalesce(synonym_abbrs, '') !~ '(^|,)alarm(,|$)';
DELETE FROM shopjoy_2604.zd_meta_word
 WHERE word_abbr = 'alarm' AND EXISTS (SELECT 1 FROM shopjoy_2604.zd_meta_word WHERE word_abbr = 'noti');

-- 11) 호환 뷰 (옛 이름·옛 컬럼명)
SELECT pg_temp.mig_noti_view('sy_alarm', 'ap_fcm_noti_send', ARRAY[
    ['alarm_id',         'noti_send_id'],
    ['alarm_title',      'noti_send_title'],
    ['alarm_type_cd',    'noti_send_type_cd'],
    ['alarm_msg',        'noti_send_msg'],
    ['alarm_send_date',  'noti_send_date'],
    ['alarm_status_cd',  'noti_send_status_cd'],
    ['alarm_send_count', 'noti_send_count'],
    ['alarm_fail_count', 'noti_fail_count']]);
SELECT pg_temp.mig_noti_view('syh_alarm_send_hist', 'aph_fcm_noti_send_hist', ARRAY[['alarm_id', 'noti_send_id']]);
SELECT pg_temp.mig_noti_view('sy_noti', 'ap_fcm_noti', NULL);

-- 12) 검증 — 하나라도 실패하면 예외 → 전체 롤백
DO $$
DECLARE
    v_nm   text;
    v_kind text;
    n      int;
    v_tid  text := 'ZZNOTIVIEWTEST00001';
    v_site text;
BEGIN
    -- 테이블·뷰 종류
    FOR v_nm, v_kind IN SELECT * FROM (VALUES ('ap_fcm_noti_send', 'r'), ('aph_fcm_noti_send_hist', 'r'), ('ap_fcm_noti', 'r'),
                                             ('sy_alarm', 'v'), ('syh_alarm_send_hist', 'v'), ('sy_noti', 'v')) AS t(nm, kind) LOOP
        IF (SELECT relkind::text FROM pg_class WHERE relnamespace = 'shopjoy_2604'::regnamespace AND relname = v_nm) IS DISTINCT FROM v_kind THEN
            RAISE EXCEPTION '[검증 실패] % 의 종류가 % 가 아닙니다', v_nm, CASE v_kind WHEN 'r' THEN '테이블' ELSE '뷰' END;
        END IF;
    END LOOP;
    -- 새 테이블에 alarm 컬럼 없음
    SELECT count(*) INTO n FROM information_schema.columns
     WHERE table_schema = 'shopjoy_2604' AND table_name IN ('ap_fcm_noti_send', 'aph_fcm_noti_send_hist') AND column_name LIKE '%alarm%';
    IF n > 0 THEN RAISE EXCEPTION '[검증 실패] 새 테이블에 alarm 컬럼 %개가 남음', n; END IF;
    -- 옛 이름 제약·인덱스 없음
    SELECT count(*) INTO n FROM pg_class c
     WHERE c.relnamespace = 'shopjoy_2604'::regnamespace AND c.relkind = 'i'
       AND (starts_with(c.relname, 'sy_alarm_') OR starts_with(c.relname, 'syh_alarm_send_hist_') OR starts_with(c.relname, 'sy_noti_'));
    IF n > 0 THEN RAISE EXCEPTION '[검증 실패] 옛 이름 인덱스 %개가 남음', n; END IF;
    SELECT count(*) INTO n FROM pg_constraint
     WHERE connamespace = 'shopjoy_2604'::regnamespace
       AND (starts_with(conname, 'sy_alarm_') OR starts_with(conname, 'syh_alarm_send_hist_') OR starts_with(conname, 'sy_noti_'));
    IF n > 0 THEN RAISE EXCEPTION '[검증 실패] 옛 이름 제약 %개가 남음', n; END IF;
    -- 알림함 사이트·모듈
    SELECT count(*) INTO n FROM information_schema.columns
     WHERE table_schema = 'shopjoy_2604' AND table_name = 'ap_fcm_noti' AND column_name IN ('site_id', 'tenant_modules');
    IF n <> 2 THEN RAISE EXCEPTION '[검증 실패] ap_fcm_noti 에 site_id·tenant_modules 가 없음'; END IF;
    -- 호환 뷰 자동 갱신 가능 (UPDATE 4 + INSERT 8 + DELETE 16 = 28)
    FOREACH v_nm IN ARRAY ARRAY['sy_alarm', 'syh_alarm_send_hist', 'sy_noti'] LOOP
        IF (pg_relation_is_updatable(format('shopjoy_2604.%I', v_nm)::regclass, false) & 28) <> 28 THEN
            RAISE EXCEPTION '[검증 실패] 호환 뷰 % 가 자동 갱신 가능 뷰가 아님', v_nm;
        END IF;
    END LOOP;
    -- 설정값에 옛 이름 없음
    IF EXISTS (SELECT 1 FROM shopjoy_2604.sy_code_grp WHERE starts_with(code_grp, 'ALARM_')) THEN
        RAISE EXCEPTION '[검증 실패] 코드그룹 ALARM_* 이 남음 (새 이름이 이미 있었나?)'; END IF;
    SELECT count(*) INTO n FROM shopjoy_2604.sy_code_grp WHERE code_grp IN ('NOTI_SEND_TYPE_CD', 'NOTI_SEND_STATUS', 'NOTI_CHANNEL', 'NOTI_TARGET_TYPE');
    IF n <> 4 THEN RAISE EXCEPTION '[검증 실패] 새 코드그룹 NOTI_* 가 %개 (4개여야 함)', n; END IF;
    IF EXISTS (SELECT 1 FROM shopjoy_2604.sy_i18n WHERE starts_with(i18n_key, 'syCode.ALARM_')) THEN
        RAISE EXCEPTION '[검증 실패] 다국어 키 syCode.ALARM_* 가 남음 (같은 새 키가 이미 있음)'; END IF;
    IF EXISTS (SELECT 1 FROM shopjoy_2604.sy_batch WHERE batch_code = 'SY_SEND_ALARM') THEN
        RAISE EXCEPTION '[검증 실패] 배치 SY_SEND_ALARM 이 남음'; END IF;
    IF EXISTS (SELECT 1 FROM shopjoy_2604.sy_template WHERE template_code = 'CONTACT_RECEIVED_ALARM') THEN
        RAISE EXCEPTION '[검증 실패] 템플릿 CONTACT_RECEIVED_ALARM 이 남음'; END IF;
    IF EXISTS (SELECT 1 FROM shopjoy_2604.sy_menu WHERE menu_code = 'SY_ALARM' OR menu_url ~ '#page=(syAlarm|zdTestPushAlim)') THEN
        RAISE EXCEPTION '[검증 실패] 메뉴에 옛 이름이 남음'; END IF;
    IF EXISTS (SELECT 1 FROM shopjoy_2604.sy_path WHERE biz_cd IN ('sy_alarm', 'syh_alarm_send_hist', 'sy_noti')) THEN
        RAISE EXCEPTION '[검증 실패] 표시경로 biz_cd 에 옛 이름이 남음'; END IF;
    IF EXISTS (SELECT 1 FROM shopjoy_2604.sy_exceldown WHERE domain_cd IN ('syAlarm', 'syhAlarmSendHist', 'syNoti')) THEN
        RAISE EXCEPTION '[검증 실패] 엑셀 다운로드 도메인에 옛 이름이 남음'; END IF;
    IF EXISTS (SELECT 1 FROM shopjoy_2604.zd_meta_word WHERE word_abbr = 'alarm') THEN
        RAISE EXCEPTION '[검증 실패] 단어사전에 alarm 이 남음'; END IF;

    -- 호환 뷰로 실제 INSERT/UPDATE/DELETE (옛 백엔드 Hibernate 와 같은 경로) → 하위 트랜잭션째 되돌린다
    SELECT site_id INTO v_site FROM shopjoy_2604.sy_site ORDER BY site_id LIMIT 1;
    BEGIN
        EXECUTE format('INSERT INTO shopjoy_2604.sy_alarm (alarm_id, alarm_title, reg_site_id%s) VALUES (%L, %L, %L%s)',
                       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_alarm' AND column_name = 'site_id') THEN ', site_id' ELSE '' END,
                       v_tid, '호환 뷰 점검', v_site,
                       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'shopjoy_2604' AND table_name = 'sy_alarm' AND column_name = 'site_id') THEN format(', %L', v_site) ELSE '' END);
        SELECT count(*) INTO n FROM shopjoy_2604.ap_fcm_noti_send
         WHERE noti_send_id = v_tid AND noti_send_status_cd = 'PENDING' AND noti_send_count = 0 AND noti_fail_count = 0 AND reg_date IS NOT NULL;
        IF n <> 1 THEN RAISE EXCEPTION '[검증 실패] 뷰 sy_alarm INSERT 가 원본에 기본값과 함께 안 들어감'; END IF;
        UPDATE shopjoy_2604.sy_alarm SET alarm_msg = '점검', alarm_status_cd = 'SENT' WHERE alarm_id = v_tid;
        GET DIAGNOSTICS n = ROW_COUNT;
        IF n <> 1 OR NOT EXISTS (SELECT 1 FROM shopjoy_2604.ap_fcm_noti_send WHERE noti_send_id = v_tid AND noti_send_msg = '점검' AND noti_send_status_cd = 'SENT') THEN
            RAISE EXCEPTION '[검증 실패] 뷰 sy_alarm UPDATE'; END IF;

        INSERT INTO shopjoy_2604.syh_alarm_send_hist (send_hist_id, alarm_id, reg_site_id) VALUES (v_tid, v_tid, v_site);
        IF NOT EXISTS (SELECT 1 FROM shopjoy_2604.aph_fcm_noti_send_hist WHERE send_hist_id = v_tid AND noti_send_id = v_tid AND send_hist_status_cd = 'SENT' AND send_date IS NOT NULL) THEN
            RAISE EXCEPTION '[검증 실패] 뷰 syh_alarm_send_hist INSERT'; END IF;
        DELETE FROM shopjoy_2604.syh_alarm_send_hist WHERE send_hist_id = v_tid;
        GET DIAGNOSTICS n = ROW_COUNT;
        IF n <> 1 THEN RAISE EXCEPTION '[검증 실패] 뷰 syh_alarm_send_hist DELETE'; END IF;
        DELETE FROM shopjoy_2604.sy_alarm WHERE alarm_id = v_tid;
        GET DIAGNOSTICS n = ROW_COUNT;
        IF n <> 1 THEN RAISE EXCEPTION '[검증 실패] 뷰 sy_alarm DELETE'; END IF;

        INSERT INTO shopjoy_2604.sy_noti (noti_id, reg_site_id, recv_type_cd, recv_id, noti_title, site_id, tenant_modules)
        VALUES (v_tid, v_site, 'USER', v_tid, '호환 뷰 점검', v_site, 'ec1');
        IF NOT EXISTS (SELECT 1 FROM shopjoy_2604.ap_fcm_noti WHERE noti_id = v_tid AND noti_type_cd = 'ALARM' AND read_yn = 'N' AND tenant_modules = 'ec1') THEN
            RAISE EXCEPTION '[검증 실패] 뷰 sy_noti INSERT'; END IF;
        UPDATE shopjoy_2604.sy_noti SET read_yn = 'Y' WHERE noti_id = v_tid;
        DELETE FROM shopjoy_2604.sy_noti WHERE noti_id = v_tid;
        GET DIAGNOSTICS n = ROW_COUNT;
        IF n <> 1 THEN RAISE EXCEPTION '[검증 실패] 뷰 sy_noti DELETE'; END IF;

        RAISE EXCEPTION 'MIG_NOTI_VIEW_TEST_OK';       -- 점검 행을 하위 트랜잭션째 되돌린다
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> 'MIG_NOTI_VIEW_TEST_OK' THEN RAISE; END IF;
    END;
    RAISE NOTICE '[검증 통과] 이름 변경·설정값·호환 뷰(자동 갱신 + 실제 INSERT/UPDATE/DELETE)';
END $$;

COMMIT;


-- ═══════════════════════════════════════════════════════════
--  2단계 — 배포 "후" (ecBeBo·ecFeBo 새 코드가 ap_* 이름으로 정상 동작하는 것을 확인한 뒤): 호환 뷰 삭제
--   (DROP VIEW 는 뷰만 지운다 — 같은 이름이 테이블이면 "is not a view" 로 실패하므로 테이블을 지울 일은 없다)
-- ═══════════════════════════════════════════════════════════
-- BEGIN;
-- SET LOCAL lock_timeout = '10s';
-- DROP VIEW IF EXISTS shopjoy_2604.sy_alarm;
-- DROP VIEW IF EXISTS shopjoy_2604.syh_alarm_send_hist;
-- DROP VIEW IF EXISTS shopjoy_2604.sy_noti;
-- COMMIT;


-- ═══════════════════════════════════════════════════════════
--  되돌리기 (1단계 이전으로 — 옛 코드(main) 로 다시 배포한 뒤에만). 맨 위 도우미 함수 2개를 같은 세션에서 먼저 만든 다음 실행
--   0단계(site_id·tenant_modules)는 migration_20261004_noti_fcm_push.sql 몫이라 되돌리지 않는다.
-- ═══════════════════════════════════════════════════════════
-- BEGIN;
-- SET LOCAL lock_timeout = '10s';
-- DROP VIEW IF EXISTS shopjoy_2604.sy_alarm;
-- DROP VIEW IF EXISTS shopjoy_2604.syh_alarm_send_hist;
-- DROP VIEW IF EXISTS shopjoy_2604.sy_noti;
-- SELECT pg_temp.mig_noti_rename('ap_fcm_noti_send', 'sy_alarm', ARRAY[
--     ['noti_send_id', 'alarm_id'], ['noti_send_title', 'alarm_title'], ['noti_send_type_cd', 'alarm_type_cd'], ['noti_send_msg', 'alarm_msg'],
--     ['noti_send_date', 'alarm_send_date'], ['noti_send_status_cd', 'alarm_status_cd'], ['noti_send_count', 'alarm_send_count'],
--     ['noti_fail_count', 'alarm_fail_count']]);
-- SELECT pg_temp.mig_noti_rename('aph_fcm_noti_send_hist', 'syh_alarm_send_hist', ARRAY[['noti_send_id', 'alarm_id']]);
-- SELECT pg_temp.mig_noti_rename('ap_fcm_noti', 'sy_noti', NULL);
-- COMMENT ON TABLE  shopjoy_2604.sy_alarm IS '알림';
-- COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_type_cd   IS '알림유형 (코드: ALARM_TYPE)';
-- COMMENT ON COLUMN shopjoy_2604.sy_alarm.channel_cd      IS '발송채널 (코드: ALARM_CHANNEL)';
-- COMMENT ON COLUMN shopjoy_2604.sy_alarm.target_type_cd  IS '대상유형 (코드: ALARM_TARGET_TYPE — ALL/GRADE/MEMBER)';
-- COMMENT ON COLUMN shopjoy_2604.sy_alarm.alarm_status_cd IS '발송상태 (PENDING/SENT/FAILED/CANCELLED)';
-- COMMENT ON COLUMN shopjoy_2604.syh_alarm_send_hist.alarm_id IS '알림ID';
-- UPDATE shopjoy_2604.sy_code_grp g SET code_grp = m.old_grp
--   FROM (VALUES ('ALARM_TYPE_CD', 'NOTI_SEND_TYPE_CD'), ('ALARM_STATUS', 'NOTI_SEND_STATUS'),
--                ('ALARM_CHANNEL', 'NOTI_CHANNEL'), ('ALARM_TARGET_TYPE', 'NOTI_TARGET_TYPE')) AS m(old_grp, new_grp)
--  WHERE g.code_grp = m.new_grp;
-- UPDATE shopjoy_2604.sy_code_grp SET path_id = 'system.alarm.' || substr(path_id, length('system.noti.') + 1) WHERE starts_with(path_id, 'system.noti.');
-- UPDATE shopjoy_2604.sy_i18n SET i18n_key = regexp_replace(regexp_replace(regexp_replace(regexp_replace(i18n_key,
--        '^syCode\.NOTI_SEND_TYPE_CD\.', 'syCode.ALARM_TYPE_CD.'), '^syCode\.NOTI_SEND_STATUS\.', 'syCode.ALARM_STATUS.'),
--        '^syCode\.NOTI_CHANNEL\.', 'syCode.ALARM_CHANNEL.'), '^syCode\.NOTI_TARGET_TYPE\.', 'syCode.ALARM_TARGET_TYPE.')
--  WHERE i18n_key ~ '^syCode\.NOTI_(SEND_TYPE_CD|SEND_STATUS|CHANNEL|TARGET_TYPE)\.';
-- UPDATE shopjoy_2604.sy_i18n SET i18n_desc = replace(replace(replace(replace(i18n_desc,
--        'ApFcmNotiSendMng.js', 'SyAlarmMng.js'), 'ApFcmNotiSendDtl.js', 'SyAlarmDtl.js'),
--        'ZdTestPushNotiFcm.js', 'ZdTestPushAlimFcm.js'), 'ZdTestPushNotiApns.js', 'ZdTestPushAlimApns.js')
--  WHERE i18n_desc ~ '(ApFcmNotiSendMng|ApFcmNotiSendDtl|ZdTestPushNotiFcm|ZdTestPushNotiApns)\.js';
-- UPDATE shopjoy_2604.sy_batch SET batch_code = 'SY_SEND_ALARM' WHERE batch_code = 'SY_SEND_NOTI';
-- UPDATE shopjoy_2604.sy_template SET template_code = 'CONTACT_RECEIVED_ALARM' WHERE template_code = 'CONTACT_RECEIVED_NOTI';
-- UPDATE shopjoy_2604.sy_menu SET menu_code = 'SY_ALARM' WHERE menu_code = 'AP_FCM_NOTI_SEND';
-- UPDATE shopjoy_2604.sy_menu SET menu_url = '#page=syAlarmMng' WHERE menu_url = '#page=apFcmNotiSendMng';
-- UPDATE shopjoy_2604.sy_path SET path_label = 'sy_alarm' WHERE biz_cd = 'ap_fcm_noti_send' AND path_label = 'ap_fcm_noti_send';
-- UPDATE shopjoy_2604.sy_path SET biz_cd = 'sy_alarm' WHERE biz_cd = 'ap_fcm_noti_send';
-- UPDATE shopjoy_2604.sy_path SET path_label = 'Alarm' WHERE biz_cd = 'sy_batch' AND path_label = 'Noti';
-- UPDATE shopjoy_2604.sy_exceldown
--    SET domain_cd = 'syAlarm', api_url = replace(api_url, '/apFcmNotiSend/', '/syAlarm/'),
--        excel_columns = replace(replace(replace(replace(replace(replace(excel_columns, 'notiSendDate', 'alarmSendDate'),
--                        'notiSendTypeCd', 'alarmTypeCd'), 'notiSendStatusCd', 'alarmStatusCd'), 'notiSendTitle', 'alarmTitle'),
--                        'notiSendMsg', 'alarmMsg'), 'notiSendId', 'alarmId'),
--        search_param_json = replace(replace(replace(replace(replace(replace(search_param_json, 'notiSendDate', 'alarmSendDate'),
--                        'notiSendTypeCd', 'alarmTypeCd'), 'notiSendStatusCd', 'alarmStatusCd'), 'notiSendTitle', 'alarmTitle'),
--                        'notiSendMsg', 'alarmMsg'), 'notiSendId', 'alarmId')
--  WHERE domain_cd = 'apFcmNotiSend';
-- UPDATE shopjoy_2604.cm_popup SET apply_ui_memo = replace(replace(apply_ui_memo, 'ApFcmNotiSendDtl.js', 'SyAlarmDtl.js'), 'ApFcmNotiSendMng.js', 'SyAlarmMng.js')
--  WHERE apply_ui_memo ~ 'ApFcmNotiSend(Dtl|Mng)\.js';
-- -- 단어사전 alarm 행은 삭제했으므로 필요하면 단어사전관리 화면에서 다시 등록(알림/alarm/alarm/GENERAL)
-- UPDATE shopjoy_2604.zd_meta_word SET synonym_abbrs = nullif(regexp_replace(synonym_abbrs, '(^|,)alarm,alim$', ''), '') WHERE word_abbr = 'noti';
-- COMMIT;


-- ═══════════════════════════════════════════════════════════
--  검증 (1단계 뒤)
-- ═══════════════════════════════════════════════════════════
-- SELECT relname, relkind FROM pg_class WHERE relnamespace = 'shopjoy_2604'::regnamespace
--    AND relname IN ('ap_fcm_noti_send','aph_fcm_noti_send_hist','ap_fcm_noti','sy_alarm','syh_alarm_send_hist','sy_noti');
--   → ap_* 3개 r(테이블), sy_alarm·syh_alarm_send_hist·sy_noti 3개 v(호환 뷰) / 2단계 뒤에는 뷰 3개 없음
-- SELECT table_name, column_name FROM information_schema.columns
--  WHERE table_schema = 'shopjoy_2604' AND table_name IN ('ap_fcm_noti_send','aph_fcm_noti_send_hist','ap_fcm_noti') ORDER BY table_name, ordinal_position;
--   → noti_send_id, noti_send_title, noti_send_type_cd, … (alarm_* 없음) / ap_fcm_noti 에 site_id, tenant_modules
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'shopjoy_2604' AND tablename IN ('ap_fcm_noti_send','aph_fcm_noti_send_hist','ap_fcm_noti');
--   → ap_fcm_noti_send_pk_noti_send_id, ap_fcm_noti_send_ix01_target_id, ap_fcm_noti_send_ix02_template_id,
--     aph_fcm_noti_send_hist_pk_send_hist_id, aph_fcm_noti_send_hist_ix01_noti_send_id, …_ix02_member_id, …_ix03_user_id,
--     ap_fcm_noti_pk_noti_id, ap_fcm_noti_ix01_recv_id_x2, ap_fcm_noti_ix02_reg_date, ap_fcm_noti_ix_recv
-- SELECT pg_relation_is_updatable('shopjoy_2604.sy_alarm'::regclass, false);   → 28
-- SELECT (SELECT count(*) FROM shopjoy_2604.sy_alarm) = (SELECT count(*) FROM shopjoy_2604.ap_fcm_noti_send);   → true
-- SELECT code_grp, path_id FROM shopjoy_2604.sy_code_grp WHERE code_grp LIKE 'NOTI\_%' OR code_grp LIKE 'ALARM\_%';
--   → NOTI_SEND_TYPE_CD·NOTI_SEND_STATUS·NOTI_CHANNEL·NOTI_TARGET_TYPE (system.noti.*), ALARM_* 없음
-- SELECT batch_code FROM shopjoy_2604.sy_batch WHERE batch_code LIKE 'SY_SEND_%';   → SY_SEND_NOTI, SY_SEND_EMAIL, SY_SEND_MSG
-- SELECT menu_code, menu_url FROM shopjoy_2604.sy_menu WHERE menu_id = 'MN000085';  → AP_FCM_NOTI_SEND, #page=apFcmNotiSendMng
-- SELECT biz_cd, count(*) FROM shopjoy_2604.sy_path WHERE biz_cd LIKE 'ap%' GROUP BY 1;   → ap_fcm_noti_send 10
-- SELECT word_abbr, synonym_abbrs FROM shopjoy_2604.zd_meta_word WHERE word_nm = '알림';   → noti / alarm,alim (alarm 행 없음)
