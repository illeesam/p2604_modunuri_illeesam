-- ============================================================================
-- 마이그레이션: 뷰(VIEW) 컬럼 한글명 주석 + 공통코드 그룹명 주석 일괄 추가
--
-- 배경: sy_code(GRP.VALUE) 참조 여부를 컬럼 코멘트에 "(코드: XXX_CD)" 형식으로
--       남기는 Entity @Comment 관례를 뷰(VIEW)에도 동일하게 적용한다.
--       뷰는 JPA Entity 가 없어(SELECT 전용) 코멘트가 비어 있었음 — 실제 조회 결과는
--       col_description() 기준 전부 comment=null 확인(2026-08-19).
--
-- 대상: vw_dp_area / vw_dp_disp / vw_dp_panel / vw_dp_panel_item /
--       vw_sy_code / vw_sy_role_menu (실 업무 뷰, base 테이블 조인 결과 컬럼)
--       zzvi_commnet_column / zzvi_commnet_table / zzvi_create_table / zzvw_table_info
--       (DB 메타 조회/DDL 생성용 유틸리티 뷰 — 업무 데이터 아님)
--
-- ⚠ 확인된 사실: zzvi_commnet_column / zzvi_commnet_table / zzvi_create_table 3개는
--   정의(pg_get_viewdef)를 까보면 전부 shopjoy_2604 가 아닌 다른 스키마의
--   ruoyi_cms.zz_table 을 조회 대상으로 잡고 있고, SQL 텍스트 안에 하드코딩된
--   테이블명("HANS.ST_JOB_CNCT_RECVMN_INFO")까지 남아있다 — 이 프로젝트 스키마
--   생성 당시 참고했던 보일러플레이트(RuoYi 계열 관리자 템플릿)에서 그대로 복사되고
--   shopjoy_2604 기준으로 정리되지 않은 상태로 보인다. 즉 이 3개는 지금 실행해도
--   이 프로젝트 테이블에 대해서는 의미 있는 결과를 못 낸다(원본 스키마가 아예 없음).
--   컬럼 코멘트는 "이 컬럼이 뭘 담는 자리인지"만 남기고, 뷰 자체를 고치거나 삭제하는
--   판단은 이 마이그레이션 범위 밖으로 둔다(사용자 확인 필요).
--   zzvw_table_info 는 shopjoy_2604 기준으로 정상 동작하는 실사용 메타조회 뷰.
--
-- 부수 작업: vw_dp_area / vw_dp_panel / vw_dp_panel_item / vw_sy_role_menu 는 정의에
--   순수 JOIN(=INNER JOIN)을 쓰고 있었다. 정책상 JOIN 종류를 항상 명시(INNER/LEFT/RIGHT)
--   하기로 해서, CREATE OR REPLACE VIEW 로 SELECT 목록·컬럼 순서는 그대로 두고
--   "JOIN" → "INNER JOIN" 으로만 교체해 재생성했다(2026-08-19, 이 파일 실행 전에 이미
--   반영 완료 — 아래는 기록용이며 재실행해도 안전한 멱등 DDL).
--
-- 일자: 2026-08-19
-- ============================================================================

-- ============================================================
-- 1) vw_dp_area — dp_area + dp_ui 조인
-- ============================================================
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.area_id          IS '영역ID (dp_area.area_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.ui_id             IS 'UIID (dp_ui.ui_id, FK)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.area_cd           IS '영역코드 (예: MAIN_TOP, SIDEBAR_MID)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.area_nm           IS '영역명';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.area_type_cd      IS '영역유형 (코드: AREA_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.area_desc         IS '영역설명';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.path_id           IS '점(.) 구분 표시경로';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.use_yn            IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.use_start_date    IS '사용시작일';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.use_end_date      IS '사용종료일';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.reg_by            IS '등록자';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.reg_date          IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.reg_site_id       IS '등록 사이트ID';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.upd_by            IS '수정자';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.upd_date          IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.ui_cd              IS 'UI코드 (dp_ui.ui_cd, 예: MOBILE_MAIN, PC_MAIN)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.ui_nm              IS 'UI명 (dp_ui.ui_nm)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.ui_desc            IS 'UI설명 (dp_ui.ui_desc)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.device_type_cd     IS '디바이스유형 (코드: DEVICE_TYPE_CD, dp_ui 기준)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_area.ui_use_yn          IS 'UI 사용여부 (dp_ui.use_yn, Y/N)';

-- ============================================================
-- 2) vw_dp_panel — dp_panel + dp_area + dp_ui 조인
-- ============================================================
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.panel_id                    IS '패널ID (dp_panel.panel_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.area_id                     IS '영역ID (dp_area.area_id, FK)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.panel_nm                    IS '패널명';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.panel_type_cd               IS '표시유형 (코드: PANEL_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.path_id                     IS '점(.) 구분 표시경로';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.visibility_targets          IS '공개대상 (코드: VISIBILITY_TARGETS, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.use_yn                      IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.use_start_date              IS '사용시작일';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.use_end_date                IS '사용종료일';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.disp_panel_status_cd        IS '상태 (코드: DISP_PANEL_STATUS_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.disp_panel_status_cd_before IS '변경 전 패널상태 (코드: DISP_PANEL_STATUS_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.content_json                IS '패널콘텐츠 (JSON - 위젯 목록 및 설정)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.reg_by                      IS '등록자';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.reg_date                    IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.reg_site_id                 IS '등록 사이트ID';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.upd_by                      IS '수정자';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.upd_date                    IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.area_cd                     IS '영역코드 (dp_area.area_cd)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.area_nm                     IS '영역명 (dp_area.area_nm)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.area_desc                   IS '영역설명 (dp_area.area_desc)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.ui_id                       IS 'UIID (dp_ui.ui_id, area 경유)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.area_type_cd                IS '영역유형 (코드: AREA_TYPE_CD, dp_area 기준)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.ui_cd                       IS 'UI코드 (dp_ui.ui_cd)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.ui_nm                       IS 'UI명 (dp_ui.ui_nm)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel.ui_desc                     IS 'UI설명 (dp_ui.ui_desc)';

-- ============================================================
-- 3) vw_dp_panel_item — dp_panel_item + dp_panel + dp_area + dp_ui 조인
-- ============================================================
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.panel_item_id          IS '패널항목ID (dp_panel_item.panel_item_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.panel_id               IS '패널ID (dp_panel.panel_id, FK)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.widget_lib_id          IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id, 선택사항)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.widget_type_cd         IS '위젯유형 (코드: WIDGET_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.widget_title           IS '위젯타이틀';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.widget_content         IS '위젯내용 (HTML 에디터)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.title_show_yn          IS '타이틀표시여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.widget_lib_ref_yn      IS '위젯라이브러리참조여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.content_type_cd        IS '콘텐츠유형 (WIDGET/HTML/TEXT/IMAGE 등)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.sort_ord               IS '항목정렬순서';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.widget_config_json     IS '위젯설정 (JSON - 위젯별 특정 설정 또는 직접 생성 콘텐츠)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.visibility_targets     IS '공개대상 (코드: VISIBILITY_TARGETS, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.disp_yn                IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.disp_start_dt          IS '전시시작일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.disp_end_dt            IS '전시종료일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.disp_env               IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.use_yn                 IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.reg_by                 IS '등록자';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.reg_date               IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.reg_site_id            IS '등록 사이트ID';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.upd_by                 IS '수정자';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.upd_date               IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.panel_nm               IS '패널명 (dp_panel.panel_nm)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.panel_type_cd          IS '패널 표시유형 (코드: PANEL_TYPE_CD, dp_panel 기준)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.area_id                IS '영역ID (dp_area.area_id, panel 경유)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.disp_panel_status_cd   IS '패널상태 (코드: DISP_PANEL_STATUS_CD, dp_panel 기준)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.area_cd                IS '영역코드 (dp_area.area_cd)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.area_nm                IS '영역명 (dp_area.area_nm)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.ui_id                  IS 'UIID (dp_ui.ui_id, area 경유)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.ui_cd                  IS 'UI코드 (dp_ui.ui_cd)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_panel_item.ui_nm                  IS 'UI명 (dp_ui.ui_nm)';

-- ============================================================
-- 4) vw_dp_disp — dp_ui + dp_area + dp_panel + dp_panel_item + dp_widget_lib 통합 조인
--    (관리자 "전시 시뮬레이션/미리보기" 화면이 UI→영역→패널→위젯 4단 계층을
--     한 번에 훑어야 할 때 쓰는 최상위 통합 뷰. 접두어로 출처 테이블을 구분:
--     area_ / panel_ / (없음=panel_item) / wl_)
-- ============================================================
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.ui_id                     IS 'UIID (dp_ui.ui_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.ui_cd                     IS 'UI코드 (예: MOBILE_MAIN, PC_MAIN)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.ui_nm                     IS 'UI명';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.ui_desc                   IS 'UI설명';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.device_type_cd            IS '디바이스유형 (코드: DEVICE_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.ui_use_yn                 IS 'UI 사용여부 (dp_ui.use_yn, Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.sort_ord                  IS 'UI 내 영역 정렬순서 (dp_area.sort_ord)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_id                   IS '영역ID (dp_area.area_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_cd                   IS '영역코드 (예: MAIN_TOP, SIDEBAR_MID)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_nm                   IS '영역명';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_type_cd              IS '영역유형 (코드: AREA_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_desc                 IS '영역설명';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_path_id              IS '영역 점(.) 구분 표시경로 (dp_area.path_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_use_yn               IS '영역 사용여부 (dp_area.use_yn, Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_use_start_date       IS '영역 사용시작일 (dp_area.use_start_date)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.area_use_end_date         IS '영역 사용종료일 (dp_area.use_end_date)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_id                  IS '패널ID (dp_panel.panel_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_nm                  IS '패널명';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_type_cd             IS '패널 표시유형 (코드: PANEL_TYPE_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_path_id             IS '패널 점(.) 구분 표시경로 (dp_panel.path_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_visibility_targets  IS '패널 공개대상 (코드: VISIBILITY_TARGETS, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_use_yn              IS '패널 사용여부 (dp_panel.use_yn, Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_use_start_date      IS '패널 사용시작일 (dp_panel.use_start_date)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_use_end_date        IS '패널 사용종료일 (dp_panel.use_end_date)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.disp_panel_status_cd      IS '패널상태 (코드: DISP_PANEL_STATUS_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.disp_panel_status_cd_before IS '변경 전 패널상태 (코드: DISP_PANEL_STATUS_CD)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.content_json              IS '패널콘텐츠 (JSON - 위젯 목록 및 설정, dp_panel.content_json)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.panel_item_id             IS '패널항목ID (dp_panel_item.panel_item_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.widget_lib_id             IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id, 선택사항)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.widget_type_cd            IS '위젯유형 (코드: WIDGET_TYPE_CD, dp_panel_item 기준)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.widget_title              IS '위젯타이틀';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.widget_content            IS '위젯내용 (HTML 에디터)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.title_show_yn             IS '타이틀표시여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.widget_lib_ref_yn         IS '위젯라이브러리참조여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.content_type_cd           IS '콘텐츠유형 (WIDGET/HTML/TEXT/IMAGE 등)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.item_sort_ord             IS '패널 내 항목 정렬순서 (dp_panel_item.sort_ord)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.widget_config_json        IS '위젯설정 (JSON - 위젯별 특정 설정 또는 직접 생성 콘텐츠)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.item_visibility_targets   IS '항목 공개대상 (코드: VISIBILITY_TARGETS, ^CODE^CODE^ 형식)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.disp_yn                   IS '전시여부 (Y/N) - 배치로 자동 관리';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.disp_start_dt             IS '전시시작일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.disp_end_dt               IS '전시종료일시';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.disp_env                  IS '전시 환경 (^PROD^DEV^TEST^ 형식)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.item_use_yn               IS '항목 사용여부 (dp_panel_item.use_yn, Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.wl_widget_lib_id          IS '위젯라이브러리ID (dp_widget_lib.widget_lib_id)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.widget_nm                 IS '위젯라이브러리명 (dp_widget_lib.widget_nm)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.wl_widget_type_cd         IS '위젯라이브러리 유형 (코드: WIDGET_TYPE_CD, dp_widget_lib 기준)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.wl_widget_config_json     IS '위젯라이브러리 기본설정 (JSON, dp_widget_lib.widget_config_json)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.widget_lib_desc           IS '위젯라이브러리설명 (dp_widget_lib.widget_lib_desc)';
COMMENT ON COLUMN shopjoy_2604.vw_dp_disp.wl_use_yn                 IS '위젯라이브러리 사용여부 (dp_widget_lib.use_yn, Y/N)';

-- ============================================================
-- 5) vw_sy_code — sy_code + sy_code_grp 조인
-- ============================================================
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.code_id             IS '코드ID (sy_code.code_id)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.code_grp_id         IS '코드그룹ID (sy_code_grp.code_grp_id, FK)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.code_grp            IS '코드그룹코드 (sy_code_grp.code_grp, 예: MEMBER_GRADE)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.grp_nm              IS '코드그룹명 (sy_code_grp.grp_nm)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.code_value          IS '코드값 (저장값)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.code_label          IS '코드라벨 (표시명)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.sort_ord            IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.use_yn              IS '사용여부 Y/N';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.parent_code_value   IS '부모 코드값 (트리 구조 시 상위 code_value, null이면 루트)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.child_code_values   IS '허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.code_remark         IS '비고';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.code_level          IS '코드 트리 레벨 (1=루트, 2=중간, 3=리프 등). parent_code_value와 함께 다단 트리 구성';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.code_opt1           IS '코드별 부가 옵션 1 (스타일 색상 hex, 아이콘 클래스 등 자유 문자열)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.reg_by              IS '등록자';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.reg_date            IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.upd_by              IS '수정자';
COMMENT ON COLUMN shopjoy_2604.vw_sy_code.upd_date            IS '수정일시';

-- ============================================================
-- 6) vw_sy_role_menu — sy_role_menu + sy_role 조인
-- ============================================================
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.role_menu_id   IS '역할메뉴ID (sy_role_menu.role_menu_id)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.role_id        IS '역할ID (sy_role.role_id, FK)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.menu_id        IS '메뉴ID (sy_menu.menu_id, FK)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.perm_level     IS '권한레벨 (1:조회/2:수정/3:삭제)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.reg_by         IS '등록자';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.reg_date       IS '등록일시';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.upd_by         IS '수정자';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.upd_date       IS '수정일시';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.role_code      IS '역할코드 (sy_role.role_code)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.role_nm        IS '역할명 (sy_role.role_nm)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.role_type_cd   IS '역할유형 (코드: ROLE_TYPE_CD — SYSTEM/CUSTOM, sy_role 기준)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.role_remark    IS '역할 비고 (sy_role.role_remark)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.role_use_yn    IS '역할 사용여부 (sy_role.use_yn, Y/N)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.parent_role_id IS '상위역할ID (sy_role.parent_role_id)';
COMMENT ON COLUMN shopjoy_2604.vw_sy_role_menu.role_sort_ord  IS '역할 정렬순서 (sy_role.sort_ord)';

-- ============================================================
-- 7) zzvw_table_info — information_schema 기반 실동작 메타조회 뷰(shopjoy_2604 기준)
--    관리자 화면 등에서 테이블/컬럼 구조를 조회할 때 사용. 공통코드 그룹 개념 없음.
-- ============================================================
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.table_name      IS '테이블명';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.table_comment   IS '테이블 코멘트 (COMMENT ON TABLE 값)';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.column_no       IS '컬럼순번 (ordinal_position)';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.column_name     IS '컬럼명';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.type            IS '컬럼 데이터타입 (udt_name)';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.length          IS '길이 (문자형은 character_maximum_length, 그 외는 numeric_precision)';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.column_default  IS '컬럼 기본값 (DDL DEFAULT)';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.is_nullable     IS 'NULL 허용 여부 (YES/NO)';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.column_comment  IS '컬럼 코멘트 (COMMENT ON COLUMN 값)';
COMMENT ON COLUMN shopjoy_2604.zzvw_table_info.pk              IS '기본키 여부 ("PK" 또는 빈 문자열)';

-- ============================================================
-- 8) zzvi_commnet_column / zzvi_commnet_table / zzvi_create_table
--    ⚠ 위 경고 참고 — 정의상 ruoyi_cms.zz_table(이 프로젝트에 없는 스키마)을 조회하므로
--    현재 shopjoy_2604 데이터에 대해서는 항상 빈 결과. 컬럼 자체의 "용도"만 코멘트로 남긴다.
-- ============================================================
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_column.table_name    IS '(원본 정의상 ruoyi_cms.zz_table 참조 — shopjoy_2604 미사용) 테이블명';
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_column.col_pos       IS '컬럼 순번';
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_column.max_col_pos   IS '해당 테이블의 최대 컬럼 순번(마지막 컬럼 판단용)';
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_column.str1          IS '행 구분 플래그(1=첫컬럼/9=마지막컬럼/2=중간컬럼) 생성값';
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_column.str2          IS 'CREATE TABLE DDL 조각 생성값 (컬럼별 VARCHAR2(99) 고정 템플릿)';

COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_table.table_name     IS '(원본 정의상 ruoyi_cms.zz_table 참조 — shopjoy_2604 미사용) 테이블명';
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_table.col_pos        IS '컬럼 순번';
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_table.max_col_pos    IS '해당 테이블의 최대 컬럼 순번(마지막 컬럼 판단용)';
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_table.str1           IS '행 구분 플래그(1=첫컬럼/9=마지막컬럼/2=중간컬럼) 생성값';
COMMENT ON COLUMN shopjoy_2604.zzvi_commnet_table.str2           IS 'CREATE TABLE DDL 조각 생성값 (컬럼별 VARCHAR2(99) 고정 템플릿)';

COMMENT ON COLUMN shopjoy_2604.zzvi_create_table.table_name      IS '(원본 정의상 ruoyi_cms.zz_table 참조 — shopjoy_2604 미사용) 테이블명';
COMMENT ON COLUMN shopjoy_2604.zzvi_create_table.col_pos         IS '컬럼 순번';
COMMENT ON COLUMN shopjoy_2604.zzvi_create_table.max_col_pos     IS '해당 테이블의 최대 컬럼 순번(마지막 컬럼 판단용)';
COMMENT ON COLUMN shopjoy_2604.zzvi_create_table.str1            IS '행 구분 플래그(1=첫컬럼/9=마지막컬럼/2=중간컬럼) 생성값';
COMMENT ON COLUMN shopjoy_2604.zzvi_create_table.str2            IS 'CREATE TABLE DDL 조각 생성값 (컬럼별 VARCHAR2(99) 고정 템플릿)';
COMMENT ON COLUMN shopjoy_2604.zzvi_create_table.str3            IS 'COMMENT ON TABLE 문 생성값 (첫 컬럼 행에서만 값 존재)';
COMMENT ON COLUMN shopjoy_2604.zzvi_create_table.str4            IS 'COMMENT ON COLUMN 문 생성값 (컬럼마다 1행)';

-- 검증 쿼리
-- SELECT table_name, column_name, col_description(
--          (quote_ident(table_schema)||'.'||quote_ident(table_name))::regclass::oid, ordinal_position)
--   FROM information_schema.columns
--  WHERE table_schema='shopjoy_2604'
--    AND table_name IN ('vw_dp_area','vw_dp_disp','vw_dp_panel','vw_dp_panel_item',
--                        'vw_sy_code','vw_sy_role_menu',
--                        'zzvi_commnet_column','zzvi_commnet_table','zzvi_create_table','zzvw_table_info')
--  ORDER BY table_name, ordinal_position;
