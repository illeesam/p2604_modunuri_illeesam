package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyProp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPropRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyProp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyPropRepositoryImpl implements QSyPropRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyPropRepositoryImpl";
    private static final QSyProp syProp = QSyProp.syProp;
    private static final QSySite sySite = QSySite.sySite;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("pathId", syProp.pathId),
        Map.entry("propId", syProp.propId),
        Map.entry("propKey", syProp.propKey),
        Map.entry("propLabel", syProp.propLabel),
        Map.entry("propRemark", syProp.propRemark),
        Map.entry("propTypeCd", syProp.propTypeCd),
        Map.entry("propValue", syProp.propValue),
        Map.entry("siteId", syProp.siteId),
        Map.entry("useYn", syProp.useYn)
    );

    /*
     * baseQuery(baseSelColumnQuery 역할) — 코드성 필드 예시 코드값
     * PROP_TYPE {STRING: '문자열', NUMBER: '숫자', BOOLEAN: 'Y/N', JSON: 'JSON'}
     * USE_YN    {Y: '사용', N: '미사용'}
     */
    private JPAQuery<SyPropDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyPropDto.Item.class,
                        syProp.propId,          // 프로퍼티ID (PK, auto)
                        syProp.siteId,          // 사이트ID (sy_site.site_id, NULL=전역)
                        syProp.pathId,          // 점(.) 구분 표시경로 (aa.bb.cc)
                        syProp.propKey,         // 키 (코드 식별자)
                        syProp.propValue,       // 값
                        syProp.propLabel,       // 표시명
                        syProp.propTypeCd,      // 값 타입 — PROP_TYPE {STRING: '문자열', NUMBER: '숫자', BOOLEAN: 'Y/N', JSON: 'JSON'}
                        syProp.sortOrd,         // 같은 표시경로 내 정렬순서
                        syProp.useYn,           // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syProp.propRemark,      // 비고
                        Expressions.stringPath(syProp, "propProfile").as("propProfile"),   // 적용 프로파일 (^local^dev^prod^ 형식, 비어있으면 전체 환경 적용)
                        syProp.regBy,           // 등록자
                        syProp.regDate,         // 등록일시
                        syProp.updBy,           // 수정자
                        syProp.updDate,         // 수정일시
                        sySite.siteNm.as("siteNm")   // 사이트명 (sy_site 조인)
                ))
                .from(syProp)
                .leftJoin(sySite).on(sySite.siteId.eq(syProp.siteId));
    }

    /* 시스템 속성 키조회 */
    @Override
    public Optional<SyPropDto.Item> selectById(String propId) {
        SyPropDto.Item dto = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syProp.propId.eq(propId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 시스템 속성 목록조회 */
    @Override
    public List<SyPropDto.Item> selectList(SyPropDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyPropDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(syProp.siteId, search.getSiteId()),
                    andPathIdIn(search),
                    QdslUtil.strEq(syProp.propKey, search.getPropKey()),
                    andPropKeysIn(search),
                    andPropKeyPrefixesStartsWith(search),
                    QdslUtil.strEq(syProp.propTypeCd, search.getPropTypeCd()),
                    QdslUtil.strEq(syProp.useYn, search.getUseYn()),
                    andPropProfileLike(search),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 시스템 속성 페이지조회 */
    @Override
    public SyPropDto.PageResponse selectPageData(SyPropDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syProp.siteId, search.getSiteId()),
                andPathIdIn(search),
                QdslUtil.strEq(syProp.propKey, search.getPropKey()),
                andPropKeysIn(search),
                andPropKeyPrefixesStartsWith(search),
                QdslUtil.strEq(syProp.propTypeCd, search.getPropTypeCd()),
                QdslUtil.strEq(syProp.useYn, search.getUseYn()),
                andPropProfileLike(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyPropDto.Item> query = baseQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyPropDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syProp.count())
                .where(wheres)
                .fetchOne();

        SyPropDto.PageResponse res = new SyPropDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함.
     * '__orphan__' 특수값: sy_path 에 등록되지 않은 path_id 를 가진 행 (또는 NULL) 필터. */
    private BooleanExpression andPathIdIn(SyPropDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getPathId())) return null;
        if ("__orphan__".equals(search.getPathId())) {
            List<String> registeredPaths = syPathRepository.findAllPathIdsByBizCd("sy_prop");
            if (registeredPaths.isEmpty()) return null;
            return syProp.pathId.isNull().or(syProp.pathId.notIn(registeredPaths));
        }
        return syProp.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_prop"));
    }

    /* propKeys IN 조건 (쉼표 구분 복수 키) */
    private BooleanExpression andPropKeysIn(SyPropDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getPropKeys())) return null;
        List<String> keys = Arrays.stream(search.getPropKeys().split(","))
                .map(String::trim).filter(StringUtils::hasText).collect(Collectors.toList());
        return keys.isEmpty() ? null : syProp.propKey.in(keys);
    }

    /* propKeyPrefixes — 쉼표 구분 prefix 목록 중 하나로 시작하는 행 (LIKE 'xxx%' OR) */
    private BooleanExpression andPropKeyPrefixesStartsWith(SyPropDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getPropKeyPrefixes())) return null;
        List<String> prefixes = Arrays.stream(search.getPropKeyPrefixes().split(","))
                .map(String::trim).filter(StringUtils::hasText).collect(Collectors.toList());
        if (prefixes.isEmpty()) return null;
        BooleanExpression or = null;
        for (String prefix : prefixes) {
            BooleanExpression expr = syProp.propKey.startsWith(prefix);
            or = or == null ? expr : or.or(expr);
        }
        return or;
    }

    /* propProfile 필터 — ^{profile}^ 포함 OR all(빈값/^all^ 포함) 행도 함께 조회 */
    private BooleanExpression andPropProfileLike(SyPropDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getPropProfile())) return null;
        String profile = search.getPropProfile().trim();
        StringPath col = syProp.propProfile;
        // ^{profile}^ 을 포함하는 행
        BooleanExpression hasProfile = col.like("%" + "^" + profile + "^" + "%");
        // all 행: 빈값이거나 ^all^ 을 포함하는 행
        BooleanExpression isAll = col.isNull().or(col.eq("")).or(col.like("%^all^%"));
        return hasProfile.or(isAll);
    }

    private BooleanExpression andSearchValueLike(SyPropDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyPropDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.propId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("propId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syProp.propId));
                } else if ("propKey".equals(field)) {
                    orders.add(new OrderSpecifier(order, syProp.propKey));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syProp.regDate));
                } else if ("sortOrd".equals(field)) {
                    orders.add(new OrderSpecifier(order, syProp.sortOrd));
                }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syProp.propId));
        }
        return orders;
    }

    /* 시스템 속성 수정 */
    @Override
    public int updateSelective(SyProp entity) {
        if (entity.getPropId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syProp);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(syProp.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getPathId()     != null) { update.set(syProp.pathId,     entity.getPathId());     hasAny = true; }
        if (entity.getPropKey()    != null) { update.set(syProp.propKey,    entity.getPropKey());    hasAny = true; }
        if (entity.getPropValue()  != null) { update.set(syProp.propValue,  entity.getPropValue());  hasAny = true; }
        if (entity.getPropLabel()  != null) { update.set(syProp.propLabel,  entity.getPropLabel());  hasAny = true; }
        if (entity.getPropTypeCd() != null) { update.set(syProp.propTypeCd, entity.getPropTypeCd()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(syProp.sortOrd,    entity.getSortOrd());    hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(syProp.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getPropRemark()   != null) { update.set(syProp.propRemark,   entity.getPropRemark());   hasAny = true; }
        if (entity.getPropProfile()  != null) { update.set(Expressions.stringPath(syProp, "propProfile"), entity.getPropProfile()); hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syProp.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syProp.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syProp.propId.eq(entity.getPropId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_prop 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreePropCnts(SyPropDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreePropCnts() */\n");
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
                    SELECT prop_id, path_id
                    FROM sy_prop t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_prop");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        /* ⚠️ siteId 를 가장 먼저 적용 — 목록(getPage)과 동일 사이트 격리로 트리 숫자 ↔ 목록 건수 일치 */
        pathtreeAndSiteId(search, sql, params);
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndPropType(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.prop_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.path_id = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                  SELECT '__total__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                UNION ALL
                  /* (3) '__orphan__' : sy_path 미등록 경로(또는 NULL) 카운트 — 기타 노드 표시 */
                  SELECT '__orphan__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                  WHERE path_id IS NULL
                     OR path_id NOT IN (
                           SELECT path_id FROM sy_path WHERE biz_cd = :bizCd
                        )
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
     * selectPathTreePropCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndSiteId(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null || !StringUtils.hasText(s.getSiteId())) return;
        sql.append("      AND t.site_id = :siteId\n");
        syProp.put("siteId", s.getSiteId());
    }

    private void pathtreeAndUseYn(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        syProp.put("useYn", s.getUseYn());
    }

    private void pathtreeAndPropType(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null || !StringUtils.hasText(s.getPropTypeCd())) return;
        sql.append("      AND t.prop_type_cd = :propType\n");
        syProp.put("propType", s.getPropTypeCd());
    }

    private void pathtreeAndSearchValue(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",propKey,"))   sql.append("         OR t.prop_key   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",propValue,")) sql.append("         OR t.prop_value ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",propLabel,")) sql.append("         OR t.prop_label ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        syProp.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(SyPropDto.Request s, StringBuilder sql, Map<String, Object> syProp) {
        if (s == null) return;
        if (StringUtils.hasText(s.getDateStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateStart AS timestamp)\n");
            syProp.put("dateStart", s.getDateStart());
        }
        if (StringUtils.hasText(s.getDateEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day'\n");
            syProp.put("dateEnd", s.getDateEnd());
        }
    }
}
