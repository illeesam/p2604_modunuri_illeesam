package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmFaq;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmFaq;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmFaqRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyPath;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmFaq QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmFaqRepositoryImpl implements QCmFaqRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmFaqRepositoryImpl";
    private static final QCmFaq  cmFaq  = QCmFaq.cmFaq;
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyPath syPath = QSyPath.syPath;

    /* FAQ baseSelColumnQuery */
    private JPAQuery<CmFaqDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmFaqDto.Item.class,
                        cmFaq.faqId, cmFaq.siteId, cmFaq.pathId, cmFaq.faqQuestion, cmFaq.faqAnswer,
                        cmFaq.sortOrd, cmFaq.useYn, cmFaq.viewCount,
                        cmFaq.regBy, cmFaq.regDate, cmFaq.updBy, cmFaq.updDate,
                        sySite.siteNm.as("siteNm"),
                        syPath.pathLabel.as("pathLabel")
                ))
                .from(cmFaq)
                .leftJoin(sySite).on(sySite.siteId.eq(cmFaq.siteId))
                .leftJoin(syPath).on(syPath.pathId.eq(cmFaq.pathId));
    }

    /* FAQ 키조회 */
    @Override
    public Optional<CmFaqDto.Item> selectById(String faqId) {
        CmFaqDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmFaq.faqId.eq(faqId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* FAQ 목록조회 */
    @Override
    public List<CmFaqDto.Item> selectList(CmFaqDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmFaqDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndFaqId(search),
                    baseAndPathTree(search),
                    baseAndUseYn(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* FAQ 페이지조회 */
    @Override
    public CmFaqDto.PageResponse selectPageData(CmFaqDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndFaqId(search),
                baseAndPathTree(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        };

        JPAQuery<CmFaqDto.Item> query = baseSelColumnQuery();

        List<CmFaqDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(pageSize)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmFaq.count())
                .where(wheres)
                .fetchOne();

        CmFaqDto.PageResponse res = new CmFaqDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(CmFaqDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? cmFaq.siteId.eq(search.getSiteId()) : null;
    }

    /* faqId 정확 일치 */
    private BooleanExpression baseAndFaqId(CmFaqDto.Request search) {
        return search != null && StringUtils.hasText(search.getFaqId())
                ? cmFaq.faqId.eq(search.getFaqId()) : null;
    }

    /* pathId — 선택 노드 + 모든 자손 path 포함 (트리 클릭 시 하위까지 조회) */
    private BooleanExpression baseAndPathTree(CmFaqDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getPathId())) return null;
        List<String> ids = syPathRepository.findTreePathIds(search.getPathId(), "cm_faq");
        return (ids == null || ids.isEmpty()) ? cmFaq.pathId.eq(search.getPathId()) : cmFaq.pathId.in(ids);
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(CmFaqDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? cmFaq.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(CmFaqDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",faqId,", cmFaq.faqId, pattern);
        or = orLike(or, all, types, ",faqQuestion,", cmFaq.faqQuestion, pattern);
        or = orLike(or, all, types, ",faqAnswer,", cmFaq.faqAnswer, pattern);
        or = orLike(or, all, types, ",pathId,", cmFaq.pathId, pattern);
        or = orLike(or, all, types, ",useYn,", cmFaq.useYn, pattern);
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
     * 정렬조건 빌드 — 기본: sortOrd ASC, regDate DESC, faqId ASC (안정 정렬)
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmFaqDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (StringUtils.hasText(sort)) {
            String[] sortParts = sort.split(",");
            for (String part : sortParts) {
                String[] fieldAndDir = part.trim().split(" ");
                if (fieldAndDir.length == 2) {
                    String field = fieldAndDir[0];
                    Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                    if ("faqId".equals(field)) {
                        orders.add(new OrderSpecifier(order, cmFaq.faqId));
                    } else if ("sortOrd".equals(field)) {
                        orders.add(new OrderSpecifier(order, cmFaq.sortOrd));
                    } else if ("regDate".equals(field)) {
                        orders.add(new OrderSpecifier(order, cmFaq.regDate));
                    }
                }
            }
        }
        /* 기본/fallback 정렬 — 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier(Order.ASC, cmFaq.sortOrd));
            orders.add(new OrderSpecifier<>(Order.DESC, cmFaq.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmFaq.faqId));
        }
        return orders;
    }

    /* FAQ 수정 (selective) */
    @Override
    public int updateSelective(CmFaq entity) {
        if (entity.getFaqId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmFaq);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(cmFaq.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getPathId()      != null) { update.set(cmFaq.pathId,      entity.getPathId());      hasAny = true; }
        if (entity.getFaqQuestion() != null) { update.set(cmFaq.faqQuestion, entity.getFaqQuestion()); hasAny = true; }
        if (entity.getFaqAnswer()   != null) { update.set(cmFaq.faqAnswer,   entity.getFaqAnswer());   hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(cmFaq.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(cmFaq.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getViewCount()   != null) { update.set(cmFaq.viewCount,   entity.getViewCount());   hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(cmFaq.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmFaq.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmFaq.faqId.eq(entity.getFaqId())).execute();
        return (int) affected;
    }
}
