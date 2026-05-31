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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyCodeGrpRepository;
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
/** SyCodeGrp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyCodeGrpRepositoryImpl implements QSyCodeGrpRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyCodeGrpRepositoryImpl";
    private static final QSyCodeGrp g = QSyCodeGrp.syCodeGrp;
    private static final QSySite ste = QSySite.sySite;

    /* 공통 코드 그룹 baseSelColumnQuery */
    private JPAQuery<SyCodeGrpDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyCodeGrpDto.Item.class,
                        g.codeGrpId, g.siteId, g.codeGrp, g.grpNm, g.pathId,
                        g.codeGrpDesc, g.useYn,
                        g.regBy, g.regDate, g.updBy, g.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(g)
                .leftJoin(ste).on(ste.siteId.eq(g.siteId));
    }

    /* 공통 코드 그룹 키조회 */
    @Override
    public Optional<SyCodeGrpDto.Item> selectById(String codeGrpId) {
        SyCodeGrpDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(g.codeGrpId.eq(codeGrpId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 공통 코드 그룹 목록조회 */
    @Override
    public List<SyCodeGrpDto.Item> selectList(SyCodeGrpDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyCodeGrpDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndCodeGrpId(search),
                baseAndCodeGrp(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 공통 코드 그룹 페이지조회 */
    @Override
    public SyCodeGrpDto.PageResponse selectPageList(SyCodeGrpDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyCodeGrpDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndCodeGrpId(search),
                baseAndCodeGrp(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyCodeGrpDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(g.count()).from(g).where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndCodeGrpId(search),
                baseAndCodeGrp(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyCodeGrpDto.PageResponse res = new SyCodeGrpDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? g.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression baseAndPathId(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? g.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_code_grp"))
                : null;
    }

    /* codeGrpId 정확 일치 */
    private BooleanExpression baseAndCodeGrpId(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getCodeGrpId())
                ? g.codeGrpId.eq(search.getCodeGrpId()) : null;
    }

    /* codeGrp 정확 일치 */
    private BooleanExpression baseAndCodeGrp(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getCodeGrp())
                ? g.codeGrp.eq(search.getCodeGrp()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? g.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyCodeGrpDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return g.regDate.goe(start).and(g.regDate.lt(endExcl));
            case "upd_date": return g.updDate.goe(start).and(g.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyCodeGrpDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",codeGrp,", g.codeGrp, pattern);
        or = orLike(or, all, types, ",codeGrpDesc,", g.codeGrpDesc, pattern);
        or = orLike(or, all, types, ",codeGrpId,", g.codeGrpId, pattern);
        or = orLike(or, all, types, ",grpNm,", g.grpNm, pattern);
        or = orLike(or, all, types, ",pathId,", g.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", g.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", g.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyCodeGrpDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, g.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, g.codeGrpId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("codeGrpId".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.codeGrpId));
                } else if ("grpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.grpNm));
                } else if ("codeGrp".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.codeGrp));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, g.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, g.codeGrpId));
        }
        return orders;
    }

    /* 공통 코드 그룹 수정 */
    @Override
    public int updateSelective(SyCodeGrp entity) {
        if (entity.getCodeGrpId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(g.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getCodeGrp()     != null) { update.set(g.codeGrp,     entity.getCodeGrp());     hasAny = true; }
        if (entity.getGrpNm()       != null) { update.set(g.grpNm,       entity.getGrpNm());       hasAny = true; }
        if (entity.getPathId()      != null) { update.set(g.pathId,      entity.getPathId());      hasAny = true; }
        if (entity.getCodeGrpDesc() != null) { update.set(g.codeGrpDesc, entity.getCodeGrpDesc()); hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(g.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(g.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(g.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(g.codeGrpId.eq(entity.getCodeGrpId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_code_grp 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeCodeGrpCnts(SyCodeGrpDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeCodeGrpCnts() */\n");
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
                    SELECT code_grp_id, path_id
                    FROM sy_code_grp t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_code_grp");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.code_grp_id) AS cnt
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
     * selectPathTreeCodeGrpCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndUseYn(SyCodeGrpDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        p.put("useYn", s.getUseYn());
    }

    private void pathtreeAndSearchValue(SyCodeGrpDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",codeGrp,"))     sql.append("         OR t.code_grp      ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",grpNm,"))       sql.append("         OR t.grp_nm        ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",codeGrpDesc,")) sql.append("         OR t.code_grp_desc ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(SyCodeGrpDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
