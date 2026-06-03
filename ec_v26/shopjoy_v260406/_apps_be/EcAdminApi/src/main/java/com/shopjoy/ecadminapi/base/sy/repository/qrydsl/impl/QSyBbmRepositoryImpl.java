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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbm;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbm;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbmRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
/** SyBbm QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBbmRepositoryImpl implements QSyBbmRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyBbmRepositoryImpl";
    private static final QSyBbm syBbm = QSyBbm.syBbm;
    private static final QSySite sySite = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 게시판 마스터 baseQuery */
    private JPAQuery<SyBbmDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyBbmDto.Item.class,
                        syBbm.bbmId, syBbm.siteId, syBbm.bbmCode, syBbm.bbmNm, syBbm.pathId, syBbm.bbmTypeCd,
                        syBbm.allowComment, syBbm.allowAttach, syBbm.allowLike, syBbm.contentTypeCd,
                        syBbm.scopeTypeCd, syBbm.sortOrd, syBbm.useYn, syBbm.bbmRemark,
                        syBbm.regBy, syBbm.regDate, syBbm.updBy, syBbm.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syBbm)
                .leftJoin(sySite).on(sySite.siteId.eq(syBbm.siteId));
    }

    /* 게시판 마스터 키조회 */
    @Override
    public Optional<SyBbmDto.Item> selectById(String bbmId) {
        SyBbmDto.Item dto = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syBbm.bbmId.eq(bbmId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시판 마스터 목록조회 */
    @Override
    public List<SyBbmDto.Item> selectList(SyBbmDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBbmDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndBbmId(search),
                    baseAndPathId(search),
                    baseAndTypeCd(search),
                    baseAndSearchValue(search)
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

    /* 게시판 마스터 페이지조회 */
    @Override
    public SyBbmDto.PageResponse selectPageData(SyBbmDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndBbmId(search),
                baseAndPathId(search),
                baseAndTypeCd(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyBbmDto.Item> query = baseQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyBbmDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syBbm.count())
                .where(wheres)
                .fetchOne();

        SyBbmDto.PageResponse res = new SyBbmDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }



    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyBbmDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syBbm.siteId.eq(search.getSiteId()) : null;
    }

    /* bbmId 정확 일치 */
    private BooleanExpression baseAndBbmId(SyBbmDto.Request search) {
        return search != null && StringUtils.hasText(search.getBbmId())
                ? syBbm.bbmId.eq(search.getBbmId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로의 게시판까지 포함 */
    private BooleanExpression baseAndPathId(SyBbmDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? syBbm.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_bbm"))
                : null;
    }

    /* bbmTypeCd 정확 일치 */
    private BooleanExpression baseAndTypeCd(SyBbmDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? syBbm.bbmTypeCd.eq(search.getTypeCd()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyBbmDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",allowAttach,", syBbm.allowAttach, pattern);
        or = orLike(or, all, types, ",allowComment,", syBbm.allowComment, pattern);
        or = orLike(or, all, types, ",allowLike,", syBbm.allowLike, pattern);
        or = orLike(or, all, types, ",bbmCode,", syBbm.bbmCode, pattern);
        or = orLike(or, all, types, ",bbmId,", syBbm.bbmId, pattern);
        or = orLike(or, all, types, ",bbmNm,", syBbm.bbmNm, pattern);
        or = orLike(or, all, types, ",bbmRemark,", syBbm.bbmRemark, pattern);
        or = orLike(or, all, types, ",bbmTypeCd,", syBbm.bbmTypeCd, pattern);
        or = orLike(or, all, types, ",contentTypeCd,", syBbm.contentTypeCd, pattern);
        or = orLike(or, all, types, ",pathId,", syBbm.pathId, pattern);
        or = orLike(or, all, types, ",scopeTypeCd,", syBbm.scopeTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", syBbm.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", syBbm.useYn, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyBbmDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syBbm.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syBbm.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syBbm.bbmId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("bbmId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBbm.bbmId));
                } else if ("bbmNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBbm.bbmNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBbm.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syBbm.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syBbm.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syBbm.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syBbm.bbmId));
        }
        return orders;
    }

    /* 게시판 마스터 수정 */
    @Override
    public int updateSelective(SyBbm entity) {
        if (entity.getBbmId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syBbm);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(syBbm.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getBbmCode()       != null) { update.set(syBbm.bbmCode,       entity.getBbmCode());       hasAny = true; }
        if (entity.getBbmNm()         != null) { update.set(syBbm.bbmNm,         entity.getBbmNm());         hasAny = true; }
        if (entity.getPathId()        != null) { update.set(syBbm.pathId,        entity.getPathId());        hasAny = true; }
        if (entity.getBbmTypeCd()     != null) { update.set(syBbm.bbmTypeCd,     entity.getBbmTypeCd());     hasAny = true; }
        if (entity.getAllowComment()  != null) { update.set(syBbm.allowComment,  entity.getAllowComment());  hasAny = true; }
        if (entity.getAllowAttach()   != null) { update.set(syBbm.allowAttach,   entity.getAllowAttach());   hasAny = true; }
        if (entity.getAllowLike()     != null) { update.set(syBbm.allowLike,     entity.getAllowLike());     hasAny = true; }
        if (entity.getContentTypeCd() != null) { update.set(syBbm.contentTypeCd, entity.getContentTypeCd()); hasAny = true; }
        if (entity.getScopeTypeCd()   != null) { update.set(syBbm.scopeTypeCd,   entity.getScopeTypeCd());   hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(syBbm.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(syBbm.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getBbmRemark()     != null) { update.set(syBbm.bbmRemark,     entity.getBbmRemark());     hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(syBbm.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syBbm.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syBbm.bbmId.eq(entity.getBbmId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_bbm 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeBbmCnts(SyBbmDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeBbmCnts() */\n");
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
                    SELECT bbm_id, path_id
                    FROM sy_bbm t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_bbm");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.bbm_id) AS cnt
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
     * selectPathTreeBbmCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndSearchValue(SyBbmDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",bbmCode,"))   sql.append("         OR t.bbm_code   ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",bbmNm,"))     sql.append("         OR t.bbm_nm     ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",bbmRemark,")) sql.append("         OR t.bbm_remark ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(SyBbmDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
