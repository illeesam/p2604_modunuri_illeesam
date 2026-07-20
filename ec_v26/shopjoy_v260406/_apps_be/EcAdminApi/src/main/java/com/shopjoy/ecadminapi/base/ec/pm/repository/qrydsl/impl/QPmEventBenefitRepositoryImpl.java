package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventBenefitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmEventBenefit QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventBenefitRepositoryImpl implements QPmEventBenefitRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventBenefitRepositoryImpl";
    private static final QPmEventBenefit pmEventBenefit = QPmEventBenefit.pmEventBenefit;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmEventBenefit.regDate,
        "upd_date", pmEventBenefit.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("benefitId", pmEventBenefit.benefitId),
        Map.entry("benefitNm", pmEventBenefit.benefitNm),
        Map.entry("benefitTypeCd", pmEventBenefit.benefitTypeCd),
        Map.entry("benefitValue", pmEventBenefit.benefitValue),
        Map.entry("conditionDesc", pmEventBenefit.conditionDesc),
        Map.entry("couponId", pmEventBenefit.couponId),
        Map.entry("eventId", pmEventBenefit.eventId),
        Map.entry("siteId", pmEventBenefit.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * BENEFIT_TYPE  {COUPON: '쿠폰', POINT: '적립금', DISCOUNT: '할인', GIFT: '사은품'} (코드: EVENT_BENEFIT_TYPE)
     */
    private JPAQuery<PmEventBenefitDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmEventBenefitDto.Item.class,
                        pmEventBenefit.benefitId,       // 혜택ID (PK)
                        pmEventBenefit.siteId,          // 사이트ID
                        pmEventBenefit.eventId,         // 이벤트ID
                        pmEventBenefit.benefitNm,       // 혜택명
                        pmEventBenefit.benefitTypeCd,   // 혜택유형 — BENEFIT_TYPE {COUPON: '쿠폰', POINT: '적립금', DISCOUNT: '할인', GIFT: '사은품'}
                        pmEventBenefit.conditionDesc,   // 조건 설명
                        pmEventBenefit.benefitValue,    // 혜택 값
                        pmEventBenefit.couponId,        // 연결 쿠폰ID
                        pmEventBenefit.sortOrd,         // 정렬순서
                        pmEventBenefit.regBy, pmEventBenefit.regDate, pmEventBenefit.updBy, pmEventBenefit.updDate
                ))
                .from(pmEventBenefit);
    }

    /* 이벤트 혜택 키조회 */
    @Override
    public Optional<PmEventBenefitDto.Item> selectById(String benefitId) {
        PmEventBenefitDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmEventBenefit.benefitId.eq(benefitId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 혜택 목록조회 */
    @Override
    public List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pmEventBenefit.eventId, search.getEventIds()),
                    QdslUtil.strEq(pmEventBenefit.eventId, search.getEventId()),
                    QdslUtil.strEq(pmEventBenefit.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmEventBenefit.benefitId, search.getBenefitId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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

    /* 이벤트 혜택 페이지조회 */
    @Override
    public PmEventBenefitDto.PageResponse selectPageData(PmEventBenefitDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pmEventBenefit.eventId, search.getEventIds()),
                QdslUtil.strEq(pmEventBenefit.eventId, search.getEventId()),
                QdslUtil.strEq(pmEventBenefit.siteId, search.getSiteId()),
                QdslUtil.strEq(pmEventBenefit.benefitId, search.getBenefitId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmEventBenefitDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmEventBenefit.count())
                .where(wheres)
                .fetchOne();

        PmEventBenefitDto.PageResponse res = new PmEventBenefitDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PmEventBenefitDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmEventBenefitDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.benefitId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("benefitId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEventBenefit.benefitId));
                } else if ("benefitNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEventBenefit.benefitNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEventBenefit.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pmEventBenefit.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.benefitId));
        }
        return orders;
    }

    /* 이벤트 혜택 수정 */

    @Override
    public int updateSelective(PmEventBenefit entity) {
        if (entity.getBenefitId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmEventBenefit);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(pmEventBenefit.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getEventId()       != null) { update.set(pmEventBenefit.eventId,       entity.getEventId());       hasAny = true; }
        if (entity.getBenefitNm()     != null) { update.set(pmEventBenefit.benefitNm,     entity.getBenefitNm());     hasAny = true; }
        if (entity.getBenefitTypeCd() != null) { update.set(pmEventBenefit.benefitTypeCd, entity.getBenefitTypeCd()); hasAny = true; }
        if (entity.getConditionDesc() != null) { update.set(pmEventBenefit.conditionDesc, entity.getConditionDesc()); hasAny = true; }
        if (entity.getBenefitValue()  != null) { update.set(pmEventBenefit.benefitValue,  entity.getBenefitValue());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(pmEventBenefit.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(pmEventBenefit.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pmEventBenefit.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmEventBenefit.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmEventBenefit.benefitId.eq(entity.getBenefitId())).execute();
        return (int) affected;
    }
}
