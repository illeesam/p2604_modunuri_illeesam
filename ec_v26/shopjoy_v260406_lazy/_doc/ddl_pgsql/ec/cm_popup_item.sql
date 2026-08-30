-- ============================================================
-- cm_popup_item : 공통 팝업 항목(필드) 속성
--   한 팝업의 각 필드가 조회조건인지·목록컬럼인지·트리라벨인지를 속성으로 관리한다.
--   search_yn / list_yn 조합으로 조회영역과 목록컬럼이 자동 구성되므로
--   화면(프론트)과 쿼리(백엔드) 양쪽에 하드코딩이 필요 없다.
-- ============================================================

CREATE TABLE IF NOT EXISTS shopjoy_2604.cm_popup_item (
    popup_item_id   VARCHAR(21)  NOT NULL,
    reg_site_id         VARCHAR(21)  NOT NULL,
    popup_id        VARCHAR(21)  NOT NULL,          -- cm_popup.popup_id FK
    field_nm        VARCHAR(50)  NOT NULL,          -- 엔티티 필드명 (userNm, loginId …)
    field_label     VARCHAR(100) NOT NULL,          -- 화면 표시 라벨
    field_type_cd   VARCHAR(20)  DEFAULT 'TEXT',    -- TEXT / NUMBER / DATE / CODE / BADGE
    code_grp        VARCHAR(50),                    -- field_type_cd=CODE 일 때 공통코드 그룹
    search_yn       CHAR(1)      DEFAULT 'N',       -- 조회조건 항목 여부
    search_type_cd  VARCHAR(20)  DEFAULT 'LIKE',    -- LIKE / EQ / RANGE (검색 연산)
    list_yn         CHAR(1)      DEFAULT 'Y',       -- 목록 컬럼 여부
    tree_label_yn   CHAR(1)      DEFAULT 'N',       -- 트리 노드 라벨 사용 여부
    col_width       VARCHAR(20),                    -- 목록 컬럼 폭 (예: 120px)
    col_align       VARCHAR(10),                    -- left / center / right
    link_yn         CHAR(1)      DEFAULT 'N',       -- 클릭 시 선택 트리거 컬럼 여부
    sort_ord        INTEGER      DEFAULT 0,
    use_yn          CHAR(1)      DEFAULT 'Y',
    remark          VARCHAR(500),
    reg_by          VARCHAR(30),
    reg_date        TIMESTAMP,
    upd_by          VARCHAR(30),
    upd_date        TIMESTAMP,
    CONSTRAINT cm_popup_item_pk_popup_item_id PRIMARY KEY (popup_item_id)
);


COMMENT ON TABLE  shopjoy_2604.cm_popup_item IS '공통 팝업 항목(필드) 속성';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.popup_item_id  IS '팝업항목ID';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.reg_site_id        IS '사이트ID';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.popup_id       IS '팝업ID (cm_popup.popup_id FK)';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.field_nm       IS '엔티티 필드명';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.field_label    IS '화면 표시 라벨';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.field_type_cd  IS '필드유형 TEXT/NUMBER/DATE/CODE/BADGE';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.code_grp       IS '공통코드 그룹 (field_type_cd=CODE)';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.search_yn      IS '조회조건 항목 여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.search_type_cd IS '검색연산 LIKE/EQ/RANGE';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.list_yn        IS '목록 컬럼 여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.tree_label_yn  IS '트리 노드 라벨 사용 여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.col_width      IS '목록 컬럼 폭';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.col_align      IS '정렬 left/center/right';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.link_yn        IS '선택 트리거 컬럼 여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.sort_ord       IS '정렬순서';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.use_yn         IS '사용여부 (Y/N)';
COMMENT ON COLUMN shopjoy_2604.cm_popup_item.remark         IS '비고';
CREATE INDEX cm_popup_item_ix01_popup_id_sort_ord_x2 ON shopjoy_2604.cm_popup_item USING btree (popup_id, sort_ord);
