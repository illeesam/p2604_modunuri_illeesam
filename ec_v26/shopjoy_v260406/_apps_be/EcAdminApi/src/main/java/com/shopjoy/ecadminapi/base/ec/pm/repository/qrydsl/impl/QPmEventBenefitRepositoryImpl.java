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
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmEventBenefit(이벤트 혜택) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventBenefitRepositoryImpl implements QPmEventBenefitRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventBenefitRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
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
                        pmEventBenefit.regBy,      // 등록자
                        pmEventBenefit.regDate,    // 등록일시
                        pmEventBenefit.updBy,      // 수정자
                        pmEventBenefit.updDate,    // 수정일시
                        pmEventBenefit.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pmEventBenefit.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pmEventBenefit)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pmEventBenefit.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pmEventBenefit.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pmEventBenefit.siteId)) // 사이트

                ;
    }

    /* 이벤트 혜택 키조회 */
    @Override
    public Optional<PmEventBenefitDto.Item> selectById(String eventBenefitId) {
        PmEventBenefitDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmEventBenefit.eventBenefitId.eq(eventBenefitId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 이벤트 혜택 목록조회 */
    @Override
    public List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pmEventBenefit.eventId, search.getEventIds()));
        whereList.add(QdslUtil.strEq(pmEventBenefit.eventId, search.getEventId()));
        whereList.add(QdslUtil.strEq(pmEventBenefit.eventBenefitId, search.getEventBenefitId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmEventBenefit.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmEventBenefit.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmEventBenefit.siteId, search.getSiteId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery()
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
        List<PmEventBenefitDto.Item> list = query.fetch();
        return list;
    }

    /* 이벤트 혜택 페이지조회 */
    @Override
    public BasePage<PmEventBenefitDto.Item> selectPageData(PmEventBenefitDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pmEventBenefit.eventId, search.getEventIds()));
        whereList.add(QdslUtil.strEq(pmEventBenefit.eventId, search.getEventId()));
        whereList.add(QdslUtil.strEq(pmEventBenefit.eventBenefitId, search.getEventBenefitId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmEventBenefit.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmEventBenefit.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmEventBenefit.siteId, search.getSiteId()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmEventBenefitDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmEventBenefit.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmEventBenefitDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
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
