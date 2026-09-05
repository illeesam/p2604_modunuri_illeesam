package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmFaq;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmFaq;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmFaqRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyPath;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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

/** CmFaq(FAQ (자주 묻는 질문)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmFaqRepositoryImpl implements QCmFaqRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;

    @PersistenceContext
    private EntityManager em;

    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmFaqRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QCmFaq  cmFaq  = QCmFaq.cmFaq;
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyPath syPath = QSyPath.syPath;

    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값
     * USE_YN  {Y: '노출', N: '숨김'} — sy_code 미등록, use_yn 전역 공통 규약
     */
    private JPAQuery<CmFaqDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmFaqDto.Item.class,
                        cmFaq.faqId,             // FAQ ID (PK, YYMMDDhhmmss+rand4)
                        cmFaq.pathId,            // FAQ 분류 표시경로 (sy_path.path_id, biz_cd=cm_faq)
                        cmFaq.faqQuestion,       // 질문
                        cmFaq.faqAnswer,         // 답변(HTML)
                        cmFaq.sortOrd,           // 정렬순서
                        cmFaq.useYn,             // 노출여부 — USE_YN {Y: '노출', N: '숨김'}
                        cmFaq.viewCount,         // 조회수
                        cmFaq.regBy,             // 등록자
                        cmFaq.regDate,           // 등록일시
                        cmFaq.updBy,             // 수정자
                        cmFaq.updDate,           // 수정일시
                        syPath.pathLabel.as("pathLabel"), // 표시경로 라벨 (sy_path 조인)
                        cmFaq.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(cmFaq)
                .leftJoin(syPath).on(syPath.pathId.eq(cmFaq.pathId)) // 표시경로
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(cmFaq.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(cmFaq.regBy)) // 등록자
                ;
    }

    /* FAQ 키조회 */
    @Override
    public Optional<CmFaqDto.Item> selectById(String faqId) {
        CmFaqDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmFaq.faqId.eq(faqId)).fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* FAQ 목록조회 */
    @Override
    public List<CmFaqDto.Item> selectList(CmFaqDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmFaq.faqId, search.getFaqId())); // FAQ ID 필터
        whereList.add(andPathTreeIn(search));
        whereList.add(QdslUtil.strEq(cmFaq.useYn, search.getUseYn())); // 노출여부 Y/N 필터
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmFaqDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        List<CmFaqDto.Item> list = query.fetch();
        return list;
    }

    /* FAQ 페이지조회 */
    @Override
    public BasePage<CmFaqDto.Item> selectPageData(CmFaqDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmFaq.faqId, search.getFaqId())); // FAQ ID 필터
        whereList.add(andPathTreeIn(search));
        whereList.add(QdslUtil.strEq(cmFaq.useYn, search.getUseYn())); // 노출여부 Y/N 필터
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<CmFaqDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmFaqDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(pageSize)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmFaq.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmFaqDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* pathId — 선택 노드 + 모든 자손 path 포함 (트리 클릭 시 하위까지 조회) */
    private BooleanExpression andPathTreeIn(CmFaqDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getPathId())) return null;
        // [QueryDSL] 표시경로 트리 자손ID 수집
        List<String> ids = syPathRepository.selectTreePathIds(search.getPathId(), "cm_faq");
        return (ids == null || ids.isEmpty()) ? cmFaq.pathId.eq(search.getPathId()) : cmFaq.pathId.in(ids);
    }

    /* searchType 예: "faqId,faqQuestion,faqAnswer,pathId,useYn" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("faqId", cmFaq.faqId), // FAQ ID 필터
            QdslUtil.FieldDef.like("faqQuestion", cmFaq.faqQuestion), // 질문
            QdslUtil.FieldDef.like("faqAnswer", cmFaq.faqAnswer), // 답변(HTML)
            QdslUtil.FieldDef.like("pathId", cmFaq.pathId), // 선택 노드 (하위 트리 포함 조회)
            QdslUtil.FieldDef.like("useYn", cmFaq.useYn) // 노출여부 Y/N 필터
        ));
    }

    /**
     * 정렬조건 빌드 — 기본: sortOrd ASC, regDate DESC, faqId ASC (안정 정렬)
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("faqId", cmFaq.faqId,
                   "sortOrd", cmFaq.sortOrd,
                   "regDate", cmFaq.regDate),
        new OrderSpecifier<>(Order.DESC, cmFaq.regDate),
        new OrderSpecifier<>(Order.ASC, cmFaq.faqId));
    }

    /* FAQ 수정 (selective) */
    @Override
    public int updateSelective(CmFaq entity) {
        if (entity.getFaqId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmFaq);
        boolean hasAny = false;

        if (entity.getPathId()      != null) { update.set(cmFaq.pathId,      entity.getPathId());      hasAny = true; }
        if (entity.getFaqQuestion() != null) { update.set(cmFaq.faqQuestion, entity.getFaqQuestion()); hasAny = true; }
        if (entity.getFaqAnswer()   != null) { update.set(cmFaq.faqAnswer,   entity.getFaqAnswer());   hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(cmFaq.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(cmFaq.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getViewCount()   != null) { update.set(cmFaq.viewCount,   entity.getViewCount());   hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(cmFaq.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(cmFaq.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmFaq.faqId.eq(entity.getFaqId())).execute();
        return (int) affected;
    }

    /* selectPathTreeFaqCnts — 표시경로 노드별 FAQ 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    @Override
    public List<Map<String, Object>> selectPathTreeFaqCnts(CmFaqDto.Request search) {
        StringBuilder sql = new StringBuilder();
        Map<String, Object> params = new LinkedHashMap<>();

        sql.append("/* " + QRY_SRC + " :: selectPathTreeFaqCnts() */\n");
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
                    SELECT faq_id, path_id
                    FROM cm_faq t
                    WHERE 1=1
                """);
        params.put("bizCd", "cm_faq");

        /* 검색조건 — siteId/useYn/searchValue */
        if (search != null && StringUtils.hasText(search.getSiteId())) {
        }
        if (search != null && StringUtils.hasText(search.getUseYn())) {
            sql.append("      AND t.use_yn = :useYn\n");
            params.put("useYn", search.getUseYn());
        }
        if (search != null && StringUtils.hasText(search.getSearchValue())) {
            sql.append("      AND (t.faq_question LIKE :sv OR t.faq_answer LIKE :sv)\n");
            params.put("sv", "%" + search.getSearchValue() + "%");
        }

        sql.append("""
                )
                  /* (1) 일반 path_id 행 : 노드 + 자손 누적 카운트 */
                  SELECT d.root_id AS path_id, COUNT(t.faq_id) AS cnt
                  FROM descendants d
                    LEFT JOIN filtered t ON t.path_id = d.leaf_id
                  GROUP BY d.root_id
                UNION ALL
                  /* (2) '__total__' : 트리 루트 "전체" 노드용 */
                  SELECT '__total__' AS path_id, COUNT(*) AS cnt
                  FROM filtered
                UNION ALL
                  /* (3) '__orphan__' : 경로 미지정(path_id IS NULL) 카운트 */
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
}
