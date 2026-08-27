package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyTemplateRepository;
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
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
/** SyTemplate(발송 템플릿) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyTemplateRepositoryImpl implements QSyTemplateRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyTemplateRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyTemplate syTemplate = QSyTemplate.syTemplate;    /*
     * baseQuery — 코드성 필드 예시 코드값
     * TEMPLATE_TYPE  {EMAIL: '이메일', SMS: 'SMS', KAKAO: '알림톡', PUSH: '푸시'}
     */
    private JPAQuery<SyTemplateDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyTemplateDto.Item.class,
                        syTemplate.templateId,                    // 템플릿ID (PK, YYMMDDhhmmss+rand4)
                        syTemplate.templateTypeCd,                 // 템플릿유형 — TEMPLATE_TYPE {EMAIL: '이메일', SMS: 'SMS', KAKAO: '알림톡', PUSH: '푸시'}
                        syTemplate.templateCode,                   // 템플릿코드
                        syTemplate.templateNm,                     // 템플릿명
                        syTemplate.templateSubject,                // 제목 (이메일용)
                        syTemplate.templateContent,                // 내용 (치환변수 포함)
                        syTemplate.sampleParams,                   // 치환변수 예시 (JSON)
                        syTemplate.useYn,                          // 사용여부 Y/N
                        syTemplate.pathId,                         // 점(.) 구분 표시경로 (트리 빌드용)
                        syTemplate.regBy,                          // 등록자
                        syTemplate.regDate,                        // 등록일시
                        syTemplate.updBy,                          // 수정자
                        syTemplate.updDate,                        // 수정일시
                        syTemplate.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syTemplate)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syTemplate.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syTemplate.regBy)) // 등록자
                ;
    }

    /* 템플릿 키조회 */
    @Override
    public Optional<SyTemplateDto.Item> selectById(String templateId) {
        SyTemplateDto.Item dtl = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syTemplate.templateId.eq(templateId)).fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* (templateCode, useYn) 발송용 단건 조회 — 관리 엔티티 그대로 반환 */
    @Override
    public Optional<SyTemplate> selectFirstByTemplateCodeAndUseYn(String templateCode, String useYn) {
        SyTemplate result = queryFactory.selectFrom(syTemplate)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectFirstByTemplateCodeAndUseYn()")
                .where(syTemplate.templateCode.eq(templateCode).and(syTemplate.useYn.eq(useYn)))
                .fetchFirst();
        return Optional.ofNullable(result);
    }

    /* 템플릿 목록조회 */
    @Override
    public List<SyTemplateDto.Item> selectList(SyTemplateDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andPathIdIn(search));
        whereList.add(QdslUtil.strEq(syTemplate.templateId, search.getTemplateId())); // 템플릿ID 검색값
        whereList.add(QdslUtil.strEq(syTemplate.templateTypeCd, search.getTemplateTypeCd())); // 템플릿유형 검색값
        whereList.add(QdslUtil.strEq(syTemplate.useYn, search.getUseYn())); // 사용여부 검색값 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syTemplate.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syTemplate.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyTemplateDto.Item> query = baseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyTemplateDto.Item> list = query.fetch();
        return list;
    }

    /* 템플릿 페이지조회 */
    @Override
    public BasePage<SyTemplateDto.Item> selectPageData(SyTemplateDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andPathIdIn(search));
        whereList.add(QdslUtil.strEq(syTemplate.templateId, search.getTemplateId())); // 템플릿ID 검색값
        whereList.add(QdslUtil.strEq(syTemplate.templateTypeCd, search.getTemplateTypeCd())); // 템플릿유형 검색값
        whereList.add(QdslUtil.strEq(syTemplate.useYn, search.getUseYn())); // 사용여부 검색값 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syTemplate.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syTemplate.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyTemplateDto.Item> query = baseQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyTemplateDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syTemplate.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyTemplateDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathIdIn(SyTemplateDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? syTemplate.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_template"))
                : null;
    }

    /* searchType 예: "pathId,sampleParams,templateCode,templateContent,templateId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("pathId", syTemplate.pathId), // 표시경로ID 검색값
            QdslUtil.FieldDef.like("sampleParams", syTemplate.sampleParams), // 치환변수 예시 (JSON)
            QdslUtil.FieldDef.like("templateCode", syTemplate.templateCode), // 템플릿코드 검색값
            QdslUtil.FieldDef.like("templateContent", syTemplate.templateContent), // 내용 (치환변수 포함)
            QdslUtil.FieldDef.like("templateId", syTemplate.templateId), // 템플릿ID 검색값
            QdslUtil.FieldDef.like("templateNm", syTemplate.templateNm), // 템플릿명
            QdslUtil.FieldDef.like("templateSubject", syTemplate.templateSubject), // 제목 (이메일용)
            QdslUtil.FieldDef.like("templateTypeCd", syTemplate.templateTypeCd), // 템플릿유형 검색값
            QdslUtil.FieldDef.like("useYn", syTemplate.useYn) // 사용여부 검색값 Y/N
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("templateId", syTemplate.templateId,
                   "templateNm", syTemplate.templateNm,
                   "regDate", syTemplate.regDate),
        new OrderSpecifier<>(Order.DESC, syTemplate.regDate),
        new OrderSpecifier<>(Order.ASC, syTemplate.templateId));
    }

    /* 템플릿 수정 */
    @Override
    public int updateSelective(SyTemplate entity) {
        if (entity.getTemplateId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syTemplate);
        boolean hasAny = false;

        if (entity.getTemplateTypeCd()  != null) { update.set(syTemplate.templateTypeCd,  entity.getTemplateTypeCd());  hasAny = true; }
        if (entity.getTemplateCode()    != null) { update.set(syTemplate.templateCode,    entity.getTemplateCode());    hasAny = true; }
        if (entity.getTemplateNm()      != null) { update.set(syTemplate.templateNm,      entity.getTemplateNm());      hasAny = true; }
        if (entity.getTemplateSubject() != null) { update.set(syTemplate.templateSubject, entity.getTemplateSubject()); hasAny = true; }
        if (entity.getTemplateContent() != null) { update.set(syTemplate.templateContent, entity.getTemplateContent()); hasAny = true; }
        if (entity.getSampleParams()    != null) { update.set(syTemplate.sampleParams,    entity.getSampleParams());    hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(syTemplate.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(syTemplate.updBy,           entity.getUpdBy());           hasAny = true; }
        update.set(syTemplate.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()          != null) { update.set(syTemplate.pathId,          entity.getPathId());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(syTemplate.templateId.eq(entity.getTemplateId())).execute();
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
                    SELECT t.template_id, t.path_id
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
                  SELECT d.root_id AS path_id, COUNT(syTemplate.template_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered syTemplate ON syTemplate.path_id = d.leaf_id
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
        if (StringUtils.hasText(s.getDateRangeStart())) {
            sql.append("      AND t.reg_date >= CAST(:dateRangeStart AS timestamp)\n");
            p.put("dateRangeStart", s.getDateRangeStart());
        }
        if (StringUtils.hasText(s.getDateRangeEnd())) {
            sql.append("      AND t.reg_date <= CAST(:dateRangeEnd   AS timestamp) + INTERVAL '23:59:59.999999'\n");
            p.put("dateRangeEnd", s.getDateRangeEnd());
        }
    }
}
