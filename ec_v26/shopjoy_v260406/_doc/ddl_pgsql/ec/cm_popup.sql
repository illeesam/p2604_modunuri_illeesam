-- ============================================================
-- cm_popup : 공통 선택/조회 팝업 정의
--   BO 전 화면의 선택 팝업(사용자·부서·상품·쿠폰 …)을 테이블 메타로 관리한다.
--   popup_pattern 으로 화면 구성을 결정:
--     1 = 조회영역 + 목록
--     2 = 조회영역 + (좌)트리 + (우)목록
--     3 = 조회영역 + (좌)트리 + (우)목록 + (하)선택목록
--   entity_nm 은 JPA 엔티티 클래스명 — 서비스가 JPQL 을 동적 생성하므로 DTO 불필요.
-- ============================================================

CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_popup (
    popup_id        VARCHAR(21)  NOT NULL,
    site_id         VARCHAR(21)  NOT NULL,
    popup_code      VARCHAR(50)  NOT NULL,          -- 팝업 코드 (프론트 호출 키: user, dept, prod …)
    popup_nm        VARCHAR(100) NOT NULL,          -- 팝업 제목
    popup_pattern   SMALLINT     NOT NULL DEFAULT 1,-- 1:목록 / 2:트리+목록 / 3:트리+목록+선택목록
    entity_nm       VARCHAR(100) NOT NULL,          -- JPA 엔티티 클래스명 (SyUser, PdProd …)
    id_field        VARCHAR(50)  NOT NULL,          -- 식별자 필드명 (userId, prodId …)
    nm_field        VARCHAR(50)  NOT NULL,          -- 표시명 필드명 (userNm, prodNm …)
    parent_field    VARCHAR(50),                    -- 트리 부모 필드명 (패턴 2·3)
    site_field      VARCHAR(50),                    -- 사이트 격리 필드명 (없으면 NULL)
    order_by        VARCHAR(200),                   -- 기본 정렬 (JPQL ORDER BY 내용)
    base_where      VARCHAR(500),                   -- 고정 조건 (JPQL WHERE 조각, 예: e.useYn = 'Y')
    multi_yn        CHAR(1)      DEFAULT 'N',       -- 다중선택 여부
    page_size       SMALLINT     DEFAULT 10,        -- 기본 페이지 크기
    modal_width     VARCHAR(20)  DEFAULT '900px',   -- 모달 폭
    use_yn          CHAR(1)      DEFAULT 'Y',
    sort_ord        INTEGER      DEFAULT 0,
    remark          VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    CONSTRAINT pk_cm_popup PRIMARY KEY (popup_id),
    CONSTRAINT uk_cm_popup_code UNIQUE (site_id, popup_code)
);

COMMENT ON TABLE  shopjoy_2604.cm_popup IS '공통 선택/조회 팝업 정의';
COMMENT ON COLUMN shopjoy_2604.cm_popup.popup_id      IS '팝업ID';
COMMENT ON COLUMN shopjoy_2604.cm_popup.site_id       IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_popup.popup_code    IS '팝업코드 (프론트 호출 키)';
COMMENT ON COLUMN shopjoy_2604.cm_popup.popup_nm      IS '팝업 제목';
COMMENT ON COLUMN shopjoy_2604.cm_popup.popup_pattern IS '화면패턴 1:목록 / 2:트리+목록 / 3:트리+목록+선택목록';
COMMENT ON COLUMN shopjoy_2604.cm_popup.entity_nm     IS 'JPA 엔티티 클래스명';
COMMENT ON COLUMN shopjoy_2604.cm_popup.id_field      IS '식별자 필드명';
COMMENT ON COLUMN shopjoy_2604.cm_popup.nm_field      IS '표시명 필드명';
COMMENT ON COLUMN shopjoy_2604.cm_popup.parent_field  IS '트리 부모 필드명';
COMMENT ON COLUMN shopjoy_2604.cm_popup.site_field    IS '사이트 격리 필드명';
COMMENT ON COLUMN shopjoy_2604.cm_popup.order_by      IS '기본 정렬 (JPQL ORDER BY 내용)';
COMMENT ON COLUMN shopjoy_2604.cm_popup.base_where    IS '고정 조건 (JPQL WHERE 조각)';
COMMENT ON COLUMN shopjoy_2604.cm_popup.multi_yn      IS '다중선택 여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_popup.page_size     IS '기본 페이지 크기';
COMMENT ON COLUMN shopjoy_2604.cm_popup.modal_width   IS '모달 폭';
COMMENT ON COLUMN shopjoy_2604.cm_popup.use_yn        IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_popup.sort_ord      IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_popup.remark        IS '비고';
