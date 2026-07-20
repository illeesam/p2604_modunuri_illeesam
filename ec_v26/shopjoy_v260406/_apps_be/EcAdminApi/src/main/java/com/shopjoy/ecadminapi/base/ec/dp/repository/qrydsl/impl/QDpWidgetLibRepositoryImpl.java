package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpWidgetLibRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QDpWidgetLibRepositoryImpl implements QDpWidgetLibRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpWidgetLibRepositoryImpl";
    private static final QDpWidgetLib dpWidgetLib = QDpWidgetLib.dpWidgetLib;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", dpWidgetLib.regDate,
        "upd_date", dpWidgetLib.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("isSystem", dpWidgetLib.isSystem),
        Map.entry("pathId", dpWidgetLib.pathId),
        Map.entry("siteId", dpWidgetLib.siteId),
        Map.entry("thumbnailUrl", dpWidgetLib.thumbnailUrl),
        Map.entry("useYn", dpWidgetLib.useYn),
        Map.entry("widgetCode", dpWidgetLib.widgetCode),
        Map.entry("widgetConfigJson", dpWidgetLib.widgetConfigJson),
        Map.entry("widgetContent", dpWidgetLib.widgetContent),
        Map.entry("widgetLibDesc", dpWidgetLib.widgetLibDesc),
        Map.entry("widgetLibId", dpWidgetLib.widgetLibId),
        Map.entry("widgetNm", dpWidgetLib.widgetNm),
        Map.entry("widgetTypeCd", dpWidgetLib.widgetTypeCd)
    );

    /*
     * baseQuery — 코드성 필드 예시 코드값
     * USE_YN / IS_SYSTEM  {Y: '예', N: '아니오'}
     * WIDGET_TYPE_CD (코드그룹: DISP_WIDGET_TYPE, 27종)
     *   {image_banner: '이미지배너', product_slider: '상품슬라이더', product: '상품', cond_product: '조건부상품',
     *    chart_bar: '막대차트', chart_line: '라인차트', chart_pie: '파이차트', text_banner: '텍스트배너',
     *    info_card: '정보카드', popup: '팝업', file: '파일', file_list: '파일목록', coupon: '쿠폰',
     *    html_editor: 'HTML에디터', textarea: '텍스트영역', markdown: '마크다운', barcode: '바코드',
     *    qrcode: 'QR코드', barcode_qrcode: '바코드+QR코드', video_player: '동영상플레이어', countdown: '카운트다운',
     *    payment_widget: '결제위젯', approval_widget: '승인위젯', event_banner: '이벤트배너', cache_banner: '캐시배너',
     *    widget_embed: '위젯임베드', map_widget: '지도위젯'}
     */
    private JPAQuery<DpWidgetLibDto.Item> baseQuery() {
        return queryFactory.select(Projections.bean(DpWidgetLibDto.Item.class,
                dpWidgetLib.widgetLibId,       // 위젯라이브러리ID (PK, YYMMDDhhmmss+rand4)
                dpWidgetLib.siteId,            // 사이트ID (sy_site.site_id)
                dpWidgetLib.widgetCode,        // 위젯코드
                dpWidgetLib.widgetNm,          // 위젯명
                dpWidgetLib.widgetTypeCd,      // 위젯유형 — WIDGET_TYPE_CD (코드: DISP_WIDGET_TYPE, 27종)
                dpWidgetLib.widgetLibDesc,     // 위젯라이브러리설명
                dpWidgetLib.pathId,            // 점(.) 구분 표시경로
                dpWidgetLib.thumbnailUrl,      // 미리보기 썸네일URL
                dpWidgetLib.widgetContent,     // 위젯내용 (HTML 에디터, dp_widget/dp_panel_item 과 3개 테이블 통일)
                dpWidgetLib.widgetConfigJson,  // 위젯설정 (JSON, 3개 테이블 통일)
                dpWidgetLib.isSystem,          // 시스템기본위젯여부 — IS_SYSTEM {Y: '예', N: '아니오'}
                dpWidgetLib.sortOrd,           // 정렬순서
                dpWidgetLib.useYn,             // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                dpWidgetLib.regBy,             // 등록자
                dpWidgetLib.regDate,           // 등록일시
                dpWidgetLib.updBy,             // 수정자
                dpWidgetLib.updDate            // 수정일시
        )).from(dpWidgetLib);
    }

    /* 전시 위젯 라이브러리 키조회 */
    @Override
    public Optional<DpWidgetLibDto.Item> selectById(String widgetLibId) {
        return Optional.ofNullable(baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(dpWidgetLib.widgetLibId.eq(widgetLibId)).fetchOne());
    }

    /* 전시 위젯 라이브러리 목록조회 */
    @Override
    public List<DpWidgetLibDto.Item> selectList(DpWidgetLibDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpWidgetLibDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(dpWidgetLib.siteId, search.getSiteId()),
                    andPathIdIn(search),
                    QdslUtil.strEq(dpWidgetLib.widgetLibId, search.getWidgetLibId()),
                    QdslUtil.strEq(dpWidgetLib.widgetTypeCd, search.getWidgetTypeCd()),
                    QdslUtil.strEq(dpWidgetLib.useYn, search.getUseYn()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 전시 위젯 라이브러리 페이지조회 */
    @Override
    public DpWidgetLibDto.PageResponse selectPageData(DpWidgetLibDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(dpWidgetLib.siteId, search.getSiteId()),
                andPathIdIn(search),
                QdslUtil.strEq(dpWidgetLib.widgetLibId, search.getWidgetLibId()),
                QdslUtil.strEq(dpWidgetLib.widgetTypeCd, search.getWidgetTypeCd()),
                QdslUtil.strEq(dpWidgetLib.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };
        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<DpWidgetLibDto.Item> query = baseQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<DpWidgetLibDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();
        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(dpWidgetLib.count())
                .where(wheres)
                .fetchOne();
        DpWidgetLibDto.PageResponse res = new DpWidgetLibDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(DpWidgetLibDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? dpWidgetLib.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "dp_widget_lib"))
                : null;
    }

private BooleanExpression andSearchValueLike(DpWidgetLibDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpWidgetLibDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidgetLib.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidgetLib.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidgetLib.widgetLibId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("widgetLibId".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpWidgetLib.widgetLibId));
                } else if ("widgetNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpWidgetLib.widgetNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpWidgetLib.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, dpWidgetLib.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidgetLib.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidgetLib.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpWidgetLib.widgetLibId));
        }
        return orders;
    }

    /* 전시 위젯 라이브러리 수정 */
    @Override
    public int updateSelective(DpWidgetLib entity) {
        if (entity.getWidgetLibId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(dpWidgetLib);
        boolean hasAny = false;
        if (entity.getSiteId()           != null) { update.set(dpWidgetLib.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getWidgetCode()       != null) { update.set(dpWidgetLib.widgetCode,       entity.getWidgetCode());       hasAny = true; }
        if (entity.getWidgetNm()         != null) { update.set(dpWidgetLib.widgetNm,         entity.getWidgetNm());         hasAny = true; }
        if (entity.getWidgetTypeCd()     != null) { update.set(dpWidgetLib.widgetTypeCd,     entity.getWidgetTypeCd());     hasAny = true; }
        if (entity.getWidgetLibDesc()    != null) { update.set(dpWidgetLib.widgetLibDesc,    entity.getWidgetLibDesc());    hasAny = true; }
        if (entity.getPathId()           != null) { update.set(dpWidgetLib.pathId,           entity.getPathId());           hasAny = true; }
        if (entity.getThumbnailUrl()     != null) { update.set(dpWidgetLib.thumbnailUrl,     entity.getThumbnailUrl());     hasAny = true; }
        if (entity.getWidgetContent()    != null) { update.set(dpWidgetLib.widgetContent,    entity.getWidgetContent());    hasAny = true; }
        if (entity.getWidgetConfigJson() != null) { update.set(dpWidgetLib.widgetConfigJson, entity.getWidgetConfigJson()); hasAny = true; }
        if (entity.getIsSystem()         != null) { update.set(dpWidgetLib.isSystem,         entity.getIsSystem());         hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(dpWidgetLib.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(dpWidgetLib.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(dpWidgetLib.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpWidgetLib.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpWidgetLib.widgetLibId.eq(entity.getWidgetLibId())).execute();
    }

    /* 표시경로 노드별 dp_widget_lib 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeWidgetLibCnts(DpWidgetLibDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeWidgetLibCnts() */\n");
        sql.append("""
                WITH RECURSIVE descendants /* 각 path 의 자손 path_id (자신 포함, biz_cd 한정) */ AS (
                    SELECT path_id AS root_id, path_id AS leaf_id
                    FROM sy_path
                    WHERE biz_cd = :bizCd
                    UNION ALL
                    SELECT d.root_id, c.path_id
                    FROM descendants d
                    JOIN sy_path c ON c.parent_path_id = d.leaf_id
                    WHERE c.biz_cd = :bizCd
                ),
                filtered /* 검색조건이 적용된 행 */ AS (
                    SELECT widget_lib_id, path_id
                    FROM dp_widget_lib t
                    WHERE 1=1
                """);
        params.put("bizCd", "dp_widget_lib");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.widget_lib_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.path_id = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                  SELECT '__total__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                UNION ALL
                  /* (3) '__orphan__' : 경로 미지정(path_id IS NULL) 카운트 — 트리 외 표시 */
                  SELECT '__orphan__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                  WHERE path_id IS NULL
                """);

        Query q = em.createNativeQuery(sql.toString());
        params.forEach(q::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) q.getResultList();

        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("pathId", row[0] == null ? null : String.valueOf(row[0]));
            m.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());
            result.add(m);
        }
        return result;
    }

    /* ============================================================
     * selectPathTreeWidgetLibCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndUseYn(DpWidgetLibDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        p.put("useYn", s.getUseYn());
    }

    private void pathtreeAndSearchValue(DpWidgetLibDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",widgetCode,"))    sql.append("         OR t.widget_code     ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",widgetNm,"))      sql.append("         OR t.widget_nm       ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",widgetLibDesc,")) sql.append("         OR t.widget_lib_desc ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(DpWidgetLibDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            p.put("dateStart", s.getDateStart());
        }
        if (StringUtils.hasText(s.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            p.put("dateEnd", s.getDateEnd());
        }
    }
}
