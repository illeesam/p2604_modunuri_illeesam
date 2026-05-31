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
import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSySiteRepository;
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
/** SySite QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSySiteRepositoryImpl implements QSySiteRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private final EntityManager em;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSySiteRepositoryImpl";
    private static final QSySite s = QSySite.sySite;
    private static final QSyCode cdSt = new QSyCode("cd_st");
    private static final QSyCode cdSs = new QSyCode("cd_ss");

    /* 사이트 buildBaseQuery */
    private JPAQuery<SySiteDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SySiteDto.Item.class,
                        s.siteId, s.siteCode, s.siteTypeCd, s.siteNm, s.siteDomain,
                        s.logoUrl, s.faviconUrl, s.siteDesc, s.siteEmail, s.sitePhone,
                        s.siteZipCode, s.siteAddress, s.siteBusinessNo, s.siteCeo,
                        s.siteStatusCd, s.configJson,
                        s.regBy, s.regDate, s.updBy, s.updDate, s.pathId,
                        cdSt.codeLabel.as("siteTypeCdNm"),
                        cdSs.codeLabel.as("siteStatusCdNm")
                ))
                .from(s)
                .leftJoin(cdSt).on(cdSt.codeGrp.eq("SITE_TYPE").and(cdSt.codeValue.eq(s.siteTypeCd)))
                .leftJoin(cdSs).on(cdSs.codeGrp.eq("SITE_STATUS").and(cdSs.codeValue.eq(s.siteStatusCd)));
    }

    /* 사이트 키조회 */
    @Override
    public Optional<SySiteDto.Item> selectById(String siteId) {
        SySiteDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(s.siteId.eq(siteId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사이트 목록조회 */
    @Override
    public List<SySiteDto.Item> selectList(SySiteDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SySiteDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                        andSiteId(search),
                        andPathId(search),
                        andStatus(search),
                        andTypeCd(search),
                        andDateRange(search),
                        andSearchValue(search)
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

    /* 사이트 페이지조회 */
    @Override
    public SySiteDto.PageResponse selectPageList(SySiteDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SySiteDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list")
                .where(
                        andSiteId(search),
                        andPathId(search),
                        andStatus(search),
                        andTypeCd(search),
                        andDateRange(search),
                        andSearchValue(search)
                );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SySiteDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(s.count()).from(s)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: count")
                .where(
                        andSiteId(search),
                        andPathId(search),
                        andStatus(search),
                        andTypeCd(search),
                        andDateRange(search),
                        andSearchValue(search)
                ).fetchOne();

        SySiteDto.PageResponse res = new SySiteDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SySiteDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? s.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(SySiteDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? s.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_site"))
                : null;
    }

    /* siteStatusCd 정확 일치 */
    private BooleanExpression andStatus(SySiteDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? s.siteStatusCd.eq(search.getStatus()) : null;
    }

    /* siteTypeCd 정확 일치 */
    private BooleanExpression andTypeCd(SySiteDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? s.siteTypeCd.eq(search.getTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SySiteDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return s.regDate.goe(start).and(s.regDate.lt(endExcl));
            case "upd_date": return s.updDate.goe(start).and(s.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SySiteDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",configJson,", s.configJson, pattern);
        or = orLike(or, all, types, ",faviconUrl,", s.faviconUrl, pattern);
        or = orLike(or, all, types, ",logoUrl,", s.logoUrl, pattern);
        or = orLike(or, all, types, ",pathId,", s.pathId, pattern);
        or = orLike(or, all, types, ",siteAddress,", s.siteAddress, pattern);
        or = orLike(or, all, types, ",siteBusinessNo,", s.siteBusinessNo, pattern);
        or = orLike(or, all, types, ",siteCeo,", s.siteCeo, pattern);
        or = orLike(or, all, types, ",siteCode,", s.siteCode, pattern);
        or = orLike(or, all, types, ",siteDesc,", s.siteDesc, pattern);
        or = orLike(or, all, types, ",siteDomain,", s.siteDomain, pattern);
        or = orLike(or, all, types, ",siteEmail,", s.siteEmail, pattern);
        or = orLike(or, all, types, ",siteId,", s.siteId, pattern);
        or = orLike(or, all, types, ",siteNm,", s.siteNm, pattern);
        or = orLike(or, all, types, ",sitePhone,", s.sitePhone, pattern);
        or = orLike(or, all, types, ",siteStatusCd,", s.siteStatusCd, pattern);
        or = orLike(or, all, types, ",siteTypeCd,", s.siteTypeCd, pattern);
        or = orLike(or, all, types, ",siteZipCode,", s.siteZipCode, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SySiteDto.Request q) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = q == null ? null : q.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.siteId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("siteId".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.siteId));
                } else if ("siteNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.siteNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.siteId));
        }
        return orders;
    }

    /* 사이트 수정 */
    @Override
    public int updateSelective(SySite entity) {
        if (entity.getSiteId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSiteCode()       != null) { update.set(s.siteCode,       entity.getSiteCode());       hasAny = true; }
        if (entity.getSiteTypeCd()     != null) { update.set(s.siteTypeCd,     entity.getSiteTypeCd());     hasAny = true; }
        if (entity.getSiteNm()         != null) { update.set(s.siteNm,         entity.getSiteNm());         hasAny = true; }
        if (entity.getSiteDomain()     != null) { update.set(s.siteDomain,     entity.getSiteDomain());     hasAny = true; }
        if (entity.getLogoUrl()        != null) { update.set(s.logoUrl,        entity.getLogoUrl());        hasAny = true; }
        if (entity.getFaviconUrl()     != null) { update.set(s.faviconUrl,     entity.getFaviconUrl());     hasAny = true; }
        if (entity.getSiteDesc()       != null) { update.set(s.siteDesc,       entity.getSiteDesc());       hasAny = true; }
        if (entity.getSiteEmail()      != null) { update.set(s.siteEmail,      entity.getSiteEmail());      hasAny = true; }
        if (entity.getSitePhone()      != null) { update.set(s.sitePhone,      entity.getSitePhone());      hasAny = true; }
        if (entity.getSiteZipCode()    != null) { update.set(s.siteZipCode,    entity.getSiteZipCode());    hasAny = true; }
        if (entity.getSiteAddress()    != null) { update.set(s.siteAddress,    entity.getSiteAddress());    hasAny = true; }
        if (entity.getSiteBusinessNo() != null) { update.set(s.siteBusinessNo, entity.getSiteBusinessNo()); hasAny = true; }
        if (entity.getSiteCeo()        != null) { update.set(s.siteCeo,        entity.getSiteCeo());        hasAny = true; }
        if (entity.getSiteStatusCd()   != null) { update.set(s.siteStatusCd,   entity.getSiteStatusCd());   hasAny = true; }
        if (entity.getConfigJson()     != null) { update.set(s.configJson,     entity.getConfigJson());     hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(s.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(s.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()         != null) { update.set(s.pathId,         entity.getPathId());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.siteId.eq(entity.getSiteId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 사이트 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   - 일반 path_id 행 : 해당 노드 + 자손 path 의 사이트 수 (검색조건 적용)
     *   - '__total__'     : 검색조건에 부합하는 전체 사이트 수 (트리 루트 "전체" 노드)
     *   - '__orphan__'    : 검색조건에 부합 + path_id IS NULL 인 사이트 수
     *
     *   동적 SQL — search 의 null 항목은 SQL 에 포함하지 않아 옵티마이저 부담을 줄인다.
     */
    @Override
    public List<Map<String, Object>> findPathSiteTreeNodeCounts(SySiteDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* base.sy.repository.qrydsl.impl.QSySiteRepositoryImpl :: findPathSiteTreeNodeCounts() */ \n");
        /* CTE 헤더 — 재귀 path 자손 누적 + filtered_site WHERE 시작 */
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
                filtered_site /* 검색조건이 적용된 사이트 집합 */ AS (
                    SELECT site_id, path_id
                    FROM sy_site s
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_site");

        /* 검색조건 — if 분기로 SQL 조각 + 파라미터 함께 추가 */
        if (search != null && StringUtils.hasText(search.getStatus())) {
            sql.append("      AND s.site_status_cd = :statusCd \n");
            params.put("statusCd", search.getStatus());
        }
        if (search != null && StringUtils.hasText(search.getTypeCd())) {
            sql.append("      AND s.site_type_cd   = :typeCd \n");
            params.put("typeCd", search.getTypeCd());
        }
        if (search != null && StringUtils.hasText(search.getSearchValue())) {
            String searchType = search.getSearchType();
            boolean noType = !StringUtils.hasText(searchType);
            sql.append("      AND ( \n");
            sql.append("            1=0 \n");
            if (noType || searchType.contains(",siteCode,"))   sql.append("         OR s.site_code   ILIKE '%' || :searchValue || '%' \n");
            if (noType || searchType.contains(",siteNm,"))     sql.append("         OR s.site_nm     ILIKE '%' || :searchValue || '%' \n");
            if (noType || searchType.contains(",siteDomain,")) sql.append("         OR s.site_domain ILIKE '%' || :searchValue || '%' \n");
            if (noType || searchType.contains(",siteEmail,"))  sql.append("         OR s.site_email  ILIKE '%' || :searchValue || '%' \n");
            if (noType || searchType.contains(",siteCeo,"))    sql.append("         OR s.site_ceo    ILIKE '%' || :searchValue || '%' \n");
            sql.append("      ) \n");
            params.put("searchValue", search.getSearchValue());
        }
        if (search != null && StringUtils.hasText(search.getDateStart())) {
            sql.append("      AND s.reg_date >= CAST(:dateStart AS timestamp) \n");
            params.put("dateStart", search.getDateStart());
        }
        if (search != null && StringUtils.hasText(search.getDateEnd())) {
            sql.append("      AND s.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day' \n");
            params.put("dateEnd", search.getDateEnd());
        }

        /* CTE 닫기 + 메인 UNION ALL 3블록 */
        sql.append("""
                )
                /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                SELECT d.root_id AS path_id, COUNT(s.site_id) AS cnt
                FROM descendants d
                LEFT JOIN filtered_site s ON s.path_id = d.leaf_id
                GROUP BY d.root_id
                UNION ALL
                /* (2) '__total__' : 트리 루트 "전체" 노드용 — 검색조건에 부합하는 전체 카운트 */
                SELECT '__total__' AS path_id, COUNT(*) AS cnt
                FROM filtered_site
                UNION ALL
                /* (3) '__orphan__' : 경로 미지정(path_id IS NULL) 카운트 — 트리 외 표시 */
                SELECT '__orphan__' AS path_id, COUNT(*) AS cnt
                FROM filtered_site
                WHERE path_id IS NULL
                """);

        Query q = em.createNativeQuery(sql.toString());
        params.forEach(q::setParameter);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = (List<Object[]>) q.getResultList();

        /* Object[] → { pathId, cnt } 매핑 — Controller 가 그대로 JSON 직렬화 */
        List<Map<String, Object>> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("pathId", row[0] == null ? null : String.valueOf(row[0]));
            m.put("cnt",    row[1] == null ? 0L   : ((Number) row[1]).longValue());
            result.add(m);
        }
        return result;
    }
}
