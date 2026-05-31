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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyTemplateRepository;
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
/** SyTemplate QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyTemplateRepositoryImpl implements QSyTemplateRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyTemplateRepositoryImpl";
    private static final QSyTemplate t = QSyTemplate.syTemplate;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 템플릿 키조회 */
    @Override
    public Optional<SyTemplateDto.Item> selectById(String templateId) {
        SyTemplateDto.Item dto = baseQuery().where(t.templateId.eq(templateId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 템플릿 목록조회 */
    @Override
    public List<SyTemplateDto.Item> selectList(SyTemplateDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyTemplateDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndTemplateId(search),
                baseAndTemplateTypeCd(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 템플릿 페이지조회 */
    @Override
    public SyTemplateDto.PageResponse selectPageList(SyTemplateDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyTemplateDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndTemplateId(search),
                baseAndTemplateTypeCd(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyTemplateDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(
                baseAndSiteId(search),
                baseAndPathId(search),
                baseAndTemplateId(search),
                baseAndTemplateTypeCd(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyTemplateDto.PageResponse res = new SyTemplateDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 템플릿 baseQuery */
    private JPAQuery<SyTemplateDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyTemplateDto.Item.class,
                        t.templateId, t.siteId, t.templateTypeCd, t.templateCode, t.templateNm,
                        t.templateSubject, t.templateContent, t.sampleParams, t.useYn, t.pathId,
                        t.regBy, t.regDate, t.updBy, t.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(t)
                .leftJoin(ste).on(ste.siteId.eq(t.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? t.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression baseAndPathId(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? t.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_template"))
                : null;
    }

    /* templateId 정확 일치 */
    private BooleanExpression baseAndTemplateId(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getTemplateId())
                ? t.templateId.eq(search.getTemplateId()) : null;
    }

    /* templateTypeCd 정확 일치 */
    private BooleanExpression baseAndTemplateTypeCd(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getTemplateTypeCd())
                ? t.templateTypeCd.eq(search.getTemplateTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? t.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyTemplateDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",pathId,", t.pathId, pattern);
        or = orLike(or, all, types, ",sampleParams,", t.sampleParams, pattern);
        or = orLike(or, all, types, ",siteId,", t.siteId, pattern);
        or = orLike(or, all, types, ",templateCode,", t.templateCode, pattern);
        or = orLike(or, all, types, ",templateContent,", t.templateContent, pattern);
        or = orLike(or, all, types, ",templateId,", t.templateId, pattern);
        or = orLike(or, all, types, ",templateNm,", t.templateNm, pattern);
        or = orLike(or, all, types, ",templateSubject,", t.templateSubject, pattern);
        or = orLike(or, all, types, ",templateTypeCd,", t.templateTypeCd, pattern);
        or = orLike(or, all, types, ",useYn,", t.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyTemplateDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.templateId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("templateId".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.templateId));
                } else if ("templateNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.templateNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.templateId));
        }
        return orders;
    }

    /* 템플릿 수정 */
    @Override
    public int updateSelective(SyTemplate entity) {
        if (entity.getTemplateId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(t.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getTemplateTypeCd()  != null) { update.set(t.templateTypeCd,  entity.getTemplateTypeCd());  hasAny = true; }
        if (entity.getTemplateCode()    != null) { update.set(t.templateCode,    entity.getTemplateCode());    hasAny = true; }
        if (entity.getTemplateNm()      != null) { update.set(t.templateNm,      entity.getTemplateNm());      hasAny = true; }
        if (entity.getTemplateSubject() != null) { update.set(t.templateSubject, entity.getTemplateSubject()); hasAny = true; }
        if (entity.getTemplateContent() != null) { update.set(t.templateContent, entity.getTemplateContent()); hasAny = true; }
        if (entity.getSampleParams()    != null) { update.set(t.sampleParams,    entity.getSampleParams());    hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(t.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(t.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(t.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()          != null) { update.set(t.pathId,          entity.getPathId());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(t.templateId.eq(entity.getTemplateId())).execute();
        return (int) affected;
    }

    /* 표시경로 노드별 sy_template 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL)
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    @Override
    public List<Map<String, Object>> selectPathTreeTemplateCnts(SyTemplateDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeTemplateCnts() */\n");
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
                    SELECT template_id, path_id
                    FROM sy_template t
                    WHERE 1=1
                """);
        params.put("bizCd", "sy_template");

        /* 검색조건 — pathtreeAnd*() 헬퍼로 SQL 조각 + 파라미터 함께 추가 */
        pathtreeAndUseYn(search, sql, params);
        pathtreeAndSearchValue(search, sql, params);
        pathtreeAndDateRange(search, sql, params);

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.template_id) AS cnt
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
     * selectPathTreeTemplateCnts 전용 SQL 조건 헬퍼
     * ============================================================ */

    private void pathtreeAndUseYn(SyTemplateDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getUseYn())) return;
        sql.append("      AND t.use_yn = :useYn\n");
        p.put("useYn", s.getUseYn());
    }

    private void pathtreeAndSearchValue(SyTemplateDto.Request s, StringBuilder sql, Map<String, Object> p) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return;
        String raw = s.getSearchType();
        boolean noType = !StringUtils.hasText(raw);
        String st = noType ? "" : "," + raw.trim() + ",";
        sql.append("      AND (\n");
        sql.append("            1=0\n");
        if (noType || st.contains(",templateCode,")) sql.append("         OR t.template_code ILIKE '%' || :searchValue || '%'\n");
        if (noType || st.contains(",templateNm,"))   sql.append("         OR t.template_nm   ILIKE '%' || :searchValue || '%'\n");
        sql.append("      )\n");
        p.put("searchValue", s.getSearchValue());
    }

    private void pathtreeAndDateRange(SyTemplateDto.Request s, StringBuilder sql, Map<String, Object> p) {
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
