package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventBenefitRepository;
import lombok.RequiredArgsConstructor;

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
    private static final QPmEventBenefit pmEventBenefit = QPmEventBenefit.pmEventBenefit;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * BENEFIT_TYPE  {COUPON: '쿠폰', POINT: '적립금', DISCOUNT: '할인', GIFT: '사은품'} (코드: EVENT_BENEFIT_TYPE)
     */
    private JPAQuery<PmEventBenefitDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmEventBenefitDto.Item.class,
                        pmEventBenefit.eventBenefitId,       // 혜택ID (PK)
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
    public Optional<PmEventBenefitDto.Item> selectById(String eventBenefitId) {
        PmEventBenefitDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmEventBenefit.eventBenefitId.eq(eventBenefitId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 혜택 목록조회 */
    @Override
    public List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strIn(pmEventBenefit.eventId, search.getEventIds()));
        wheres.add(QdslUtil.strEq(pmEventBenefit.eventId, search.getEventId()));
        wheres.add(QdslUtil.strEq(pmEventBenefit.eventBenefitId, search.getEventBenefitId()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmEventBenefit.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmEventBenefit.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres2)
                .orderBy(orders);
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
    public BasePage<PmEventBenefitDto.Item> selectPageData(PmEventBenefitDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strIn(pmEventBenefit.eventId, search.getEventIds()));
        wheres.add(QdslUtil.strEq(pmEventBenefit.eventId, search.getEventId()));
        wheres.add(QdslUtil.strEq(pmEventBenefit.eventBenefitId, search.getEventBenefitId()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmEventBenefit.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmEventBenefit.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);

        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmEventBenefitDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmEventBenefit.count())
                .where(wheres2)
                .fetchOne();

        BasePage<PmEventBenefitDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("eventBenefitId", pmEventBenefit.eventBenefitId),
            QdslUtil.FieldDef.like("benefitNm", pmEventBenefit.benefitNm),
            QdslUtil.FieldDef.like("benefitTypeCd", pmEventBenefit.benefitTypeCd),
            QdslUtil.FieldDef.like("benefitValue", pmEventBenefit.benefitValue),
            QdslUtil.FieldDef.like("conditionDesc", pmEventBenefit.conditionDesc),
            QdslUtil.FieldDef.like("couponId", pmEventBenefit.couponId),
            QdslUtil.FieldDef.like("eventId", pmEventBenefit.eventId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("eventBenefitId", pmEventBenefit.eventBenefitId,
                   "benefitNm", pmEventBenefit.benefitNm,
                   "regDate", pmEventBenefit.regDate,
                   "sortOrd", pmEventBenefit.sortOrd),
        new OrderSpecifier<>(Order.ASC, pmEventBenefit.sortOrd),
        new OrderSpecifier<>(Order.ASC, pmEventBenefit.regDate),
        new OrderSpecifier<>(Order.ASC, pmEventBenefit.eventBenefitId));
    }

    /* 이벤트 혜택 수정 */
    @Override
    public int updateSelective(PmEventBenefit entity) {
        if (entity.getEventBenefitId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmEventBenefit);
        boolean hasAny = false;

        if (entity.getEventId()       != null) { update.set(pmEventBenefit.eventId,       entity.getEventId());       hasAny = true; }
        if (entity.getBenefitNm()     != null) { update.set(pmEventBenefit.benefitNm,     entity.getBenefitNm());     hasAny = true; }
        if (entity.getBenefitTypeCd() != null) { update.set(pmEventBenefit.benefitTypeCd, entity.getBenefitTypeCd()); hasAny = true; }
        if (entity.getConditionDesc() != null) { update.set(pmEventBenefit.conditionDesc, entity.getConditionDesc()); hasAny = true; }
        if (entity.getBenefitValue()  != null) { update.set(pmEventBenefit.benefitValue,  entity.getBenefitValue());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(pmEventBenefit.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(pmEventBenefit.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pmEventBenefit.updBy,         entity.getUpdBy());         hasAny = true; }
        update.set(pmEventBenefit.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmEventBenefit.eventBenefitId.eq(entity.getEventBenefitId())).execute();
        return (int) affected;
    }
}
