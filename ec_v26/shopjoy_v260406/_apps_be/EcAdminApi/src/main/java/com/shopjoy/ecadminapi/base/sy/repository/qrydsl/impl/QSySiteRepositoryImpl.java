package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSySiteRepository;
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
/** SySite QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSySiteRepositoryImpl implements QSySiteRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private final EntityManager em;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSySiteRepositoryImpl";
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyCode cdSt = new QSyCode("cd_st");
    private static final QSyCode cdSs = new QSyCode("cd_ss");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", sySite.regDate,
        "upd_date", sySite.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("configJson", sySite.configJson),
        Map.entry("faviconUrl", sySite.faviconUrl),
        Map.entry("logoUrl", sySite.logoUrl),
        Map.entry("pathId", sySite.pathId),
        Map.entry("siteAddress", sySite.siteAddress),
        Map.entry("siteBusinessNo", sySite.siteBusinessNo),
        Map.entry("siteCeo", sySite.siteCeo),
        Map.entry("siteCode", sySite.siteCode),
        Map.entry("siteDesc", sySite.siteDesc),
        Map.entry("siteDomain", sySite.siteDomain),
        Map.entry("siteEmail", sySite.siteEmail),
        Map.entry("siteId", sySite.siteId),
        Map.entry("siteNm", sySite.siteNm),
        Map.entry("sitePhone", sySite.sitePhone),
        Map.entry("siteStatusCd", sySite.siteStatusCd),
        Map.entry("siteTypeCd", sySite.siteTypeCd),
        Map.entry("siteZipCode", sySite.siteZipCode)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * SITE_TYPE   {EC: '이커머스', ADMIN: '관리자', API: 'API'}
     * SITE_STATUS {ACTIVE: '활성', MAINTENANCE: '점검중', INACTIVE: '비활성'}
     */
    private JPAQuery<SySiteDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SySiteDto.Item.class,
                        sySite.siteId,           // 사이트ID (YYMMDDhhmmss+rand4)
                        sySite.siteCode,         // 사이트코드
                        sySite.siteTypeCd,       // 사이트유형 — SITE_TYPE {EC: '이커머스', ADMIN: '관리자', API: 'API'}
                        sySite.siteNm,           // 사이트명
                        sySite.siteDomain,       // 도메인
                        sySite.logoUrl,          // 로고URL
                        sySite.faviconUrl,       // 파비콘URL
                        sySite.siteDesc,         // 사이트설명
                        sySite.siteEmail,        // 대표이메일
                        sySite.sitePhone,        // 대표전화
                        sySite.siteZipCode,      // 우편번호
                        sySite.siteAddress,      // 주소
                        sySite.siteBusinessNo,   // 사업자번호
                        sySite.siteCeo,          // 대표자명
                        sySite.siteStatusCd,     // 상태 — SITE_STATUS {ACTIVE: '활성', MAINTENANCE: '점검중', INACTIVE: '비활성'}
                        sySite.configJson,       // 확장설정 (JSON)
                        sySite.regBy,            // 등록자
                        sySite.regDate,          // 등록일시
                        sySite.updBy,            // 수정자
                        sySite.updDate,          // 수정일시
                        sySite.pathId,           // 점(.) 구분 표시경로 (트리 빌드용)
                        cdSt.codeLabel.as("siteTypeCdNm"),     // 사이트유형 라벨 (sy_code SITE_TYPE 조인)
                        cdSs.codeLabel.as("siteStatusCdNm")    // 상태 라벨 (sy_code SITE_STATUS 조인)
                ))
                .from(sySite)
                .leftJoin(cdSt).on(cdSt.codeGrp.eq("SITE_TYPE").and(cdSt.codeValue.eq(sySite.siteTypeCd)))
                .leftJoin(cdSs).on(cdSs.codeGrp.eq("SITE_STATUS").and(cdSs.codeValue.eq(sySite.siteStatusCd)));
    }

    /* 사이트 키조회 */
    @Override
    public Optional<SySiteDto.Item> selectById(String siteId) {
        SySiteDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(sySite.siteId.eq(siteId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사이트 목록조회 */
    @Override
    public List<SySiteDto.Item> selectList(SySiteDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SySiteDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(sySite.siteId, search.getSiteId()),
                    andPathIdIn(search),
                    QdslUtil.strEq(sySite.siteStatusCd, search.getStatus()),
                    QdslUtil.strEq(sySite.siteTypeCd, search.getTypeCd()),
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

    /* 사이트 페이지조회 */
    @Override
    public SySiteDto.PageResponse selectPageData(SySiteDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(sySite.siteId, search.getSiteId()),
                andPathIdIn(search),
                QdslUtil.strEq(sySite.siteStatusCd, search.getStatus()),
                QdslUtil.strEq(sySite.siteTypeCd, search.getTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SySiteDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SySiteDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(sySite.count())
                .where(wheres)
                .fetchOne();

        SySiteDto.PageResponse res = new SySiteDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(SySiteDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? sySite.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_site"))
                : null;
    }

    private BooleanExpression andSearchValueLike(SySiteDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
            orders.add(new OrderSpecifier(Order.DESC, sySite.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, sySite.siteId));
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
                    orders.add(new OrderSpecifier(order, sySite.siteId));
                } else if ("siteNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, sySite.siteNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, sySite.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, sySite.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, sySite.siteId));
        }
        return orders;
    }

    /* 사이트 수정 */
    @Override
    public int updateSelective(SySite entity) {
        if (entity.getSiteId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(sySite);
        boolean hasAny = false;

        if (entity.getSiteCode()       != null) { update.set(sySite.siteCode,       entity.getSiteCode());       hasAny = true; }
        if (entity.getSiteTypeCd()     != null) { update.set(sySite.siteTypeCd,     entity.getSiteTypeCd());     hasAny = true; }
        if (entity.getSiteNm()         != null) { update.set(sySite.siteNm,         entity.getSiteNm());         hasAny = true; }
        if (entity.getSiteDomain()     != null) { update.set(sySite.siteDomain,     entity.getSiteDomain());     hasAny = true; }
        if (entity.getLogoUrl()        != null) { update.set(sySite.logoUrl,        entity.getLogoUrl());        hasAny = true; }
        if (entity.getFaviconUrl()     != null) { update.set(sySite.faviconUrl,     entity.getFaviconUrl());     hasAny = true; }
        if (entity.getSiteDesc()       != null) { update.set(sySite.siteDesc,       entity.getSiteDesc());       hasAny = true; }
        if (entity.getSiteEmail()      != null) { update.set(sySite.siteEmail,      entity.getSiteEmail());      hasAny = true; }
        if (entity.getSitePhone()      != null) { update.set(sySite.sitePhone,      entity.getSitePhone());      hasAny = true; }
        if (entity.getSiteZipCode()    != null) { update.set(sySite.siteZipCode,    entity.getSiteZipCode());    hasAny = true; }
        if (entity.getSiteAddress()    != null) { update.set(sySite.siteAddress,    entity.getSiteAddress());    hasAny = true; }
        if (entity.getSiteBusinessNo() != null) { update.set(sySite.siteBusinessNo, entity.getSiteBusinessNo()); hasAny = true; }
        if (entity.getSiteCeo()        != null) { update.set(sySite.siteCeo,        entity.getSiteCeo());        hasAny = true; }
        if (entity.getSiteStatusCd()   != null) { update.set(sySite.siteStatusCd,   entity.getSiteStatusCd());   hasAny = true; }
        if (entity.getConfigJson()     != null) { update.set(sySite.configJson,     entity.getConfigJson());     hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(sySite.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(sySite.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()         != null) { update.set(sySite.pathId,         entity.getPathId());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(sySite.siteId.eq(entity.getSiteId())).execute();
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
    public List<Map<String, Object>> selectPathTreeSiteCnts(SySiteDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* base.sy.repository.qrydsl.impl.QSySiteRepositoryImpl :: selectPathTreeSiteCnts() */ \n");
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
                    SELECT a.site_id, a.path_id
                    FROM sy_site a
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_site");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 (네이밍은 QueryDSL andXxx() 와 구분) */
        pathtreeAndStatus(search, sql, params);
        pathtreeAndTypeCd(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        /* CTE 닫기 + 메인 UNION ALL 3블록 */
        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(sySite.site_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered_site sySite ON sySite.path_id = d.leaf_id
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

    /* ============================================================
     * selectPathTreeSiteCnts 전용 SQL 조건 헬퍼 (sql prefix)
     *   - QueryDSL andXxx() (BooleanExpression 반환) 과 구분하기 위해 pathtreeAnd* 사용
     *   - 각 메서드는 SQL 조각을 sql 에 추가하고 동시에 params 에 바인딩
     * ============================================================ */

    /* AND a.site_status_cd = :statusCd (a = filtered_site CTE 의 sy_site) */
    private void pathtreeAndStatus(SySiteDto.Request sySite, StringBuilder sql, Map<String, Object> p) {
        if (sySite == null || !StringUtils.hasText(sySite.getStatus())) return;
        sql.append("      AND a.site_status_cd = :statusCd \n");
        p.put("statusCd", sySite.getStatus());
    }

    /* AND a.site_type_cd = :typeCd */
    private void pathtreeAndTypeCd(SySiteDto.Request sySite, StringBuilder sql, Map<String, Object> p) {
        if (sySite == null || !StringUtils.hasText(sySite.getTypeCd())) return;
        sql.append("      AND a.site_type_cd   = :typeCd \n");
        p.put("typeCd", sySite.getTypeCd());
    }

    /* AND ( OR a.col_x ILIKE :searchValue ... ) — searchType csv 로 컬럼 분기
     *   searchType 은 ",a,b,c," 양끝 콤마 wrap 후 contains() 매칭 — "a"/"c" 같은 양끝 토큰 누락 방지 */
    private void pathtreeAndSearchValue(SySiteDto.Request sySite, StringBuilder sql, Map<String, Object> p) {
        if (sySite == null || !StringUtils.hasText(sySite.getSearchValue())) return;
        String raw = sySite.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND ( \n");
        sql.append("            1=0 \n");
        if (noType || st.contains(",siteCode,"))   sql.append("         OR a.site_code   ILIKE '%' || :searchValue || '%' \n");
        if (noType || st.contains(",siteNm,"))     sql.append("         OR a.site_nm     ILIKE '%' || :searchValue || '%' \n");
        if (noType || st.contains(",siteDomain,")) sql.append("         OR a.site_domain ILIKE '%' || :searchValue || '%' \n");
        if (noType || st.contains(",siteEmail,"))  sql.append("         OR a.site_email  ILIKE '%' || :searchValue || '%' \n");
        if (noType || st.contains(",siteCeo,"))    sql.append("         OR a.site_ceo    ILIKE '%' || :searchValue || '%' \n");
        sql.append("      ) \n");
        p.put("searchValue", sySite.getSearchValue());
    }

    /* AND a.reg_date >= :dateStart AND a.reg_date <= :dateEnd + 1 day */
    private void pathtreeAndDateRange(SySiteDto.Request sySite, StringBuilder sql, Map<String, Object> p) {
        if (sySite == null) return;
        if (StringUtils.hasText(sySite.getDateStart())) {
            sql.append("      AND a.reg_date >= CAST(:dateStart AS timestamp) \n");
            p.put("dateStart", sySite.getDateStart());
        }
        if (StringUtils.hasText(sySite.getDateEnd())) {
            sql.append("      AND a.reg_date <= CAST(:dateEnd   AS timestamp) + INTERVAL '1 day' \n");
            p.put("dateEnd", sySite.getDateEnd());
        }
    }
}
