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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftCondRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmGiftCond QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftCondRepositoryImpl implements QPmGiftCondRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmGiftCondRepositoryImpl";
    private static final QPmGiftCond pmGiftCond    = QPmGiftCond.pmGiftCond;
    private static final QPmGift     pmGift  = QPmGift.pmGift;
    private static final QSySite     sySite  = QSySite.sySite;
    private static final QVwSyCode     cdGct = new QVwSyCode("cd_gct");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GIFT_COND_TYPE  {ORDER_AMT: '주문금액', PRODUCT: '특정상품', MEMBER_GRADE: '회원등급'}
     * targetTypeCd    {PRODUCT: '상품', CATEGORY: '카테고리', MEMBER_GRADE: '회원등급'} (Entity 주석 기준)
     */
    private JPAQuery<PmGiftCondDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftCondDto.Item.class,
                        pmGiftCond.giftCondId,     // 사은품조건ID (PK)
                        pmGiftCond.giftId,         // 사은품ID (pm_gift.gift_id)
                        pmGiftCond.condTypeCd,     // 조건유형 — GIFT_COND_TYPE {ORDER_AMT: '주문금액', PRODUCT: '특정상품', MEMBER_GRADE: '회원등급'}
                        pmGiftCond.minOrderAmt,    // 최소주문금액 (ORDER_AMT 조건)
                        pmGiftCond.targetTypeCd,   // 대상유형 — PRODUCT/CATEGORY/MEMBER_GRADE
                        pmGiftCond.targetId,       // 대상ID
                        pmGiftCond.regBy, pmGiftCond.regDate
                ))
                .from(pmGiftCond)
                .leftJoin(pmGift).on(pmGift.giftId.eq(pmGiftCond.giftId))
                .leftJoin(cdGct).on(cdGct.codeGrp.eq("COND_TYPE_CD").and(cdGct.codeValue.eq(pmGiftCond.condTypeCd)));
    }

    /* 사은품 지급 조건 키조회 */
    @Override
    public Optional<PmGiftCondDto.Item> selectById(String giftCondId) {
        PmGiftCondDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmGiftCond.giftCondId.eq(giftCondId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사은품 지급 조건 목록조회 */
    @Override
    public List<PmGiftCondDto.Item> selectList(PmGiftCondDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmGiftCond.giftCondId, search.getGiftCondId()));
        wheres.add(QdslUtil.strEq(pmGiftCond.giftId, search.getGiftId()));
        wheres.add(QdslUtil.strEq(pmGiftCond.targetTypeCd, search.getTargetTypeCd()));
        wheres.add(QdslUtil.strEq(pmGiftCond.targetId, search.getTargetId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(pmGiftCond.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(pmGiftCond.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PmGiftCondDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres.toArray(BooleanExpression[]::new))
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

    /* 사은품 지급 조건 페이지조회 */
    @Override
    public BasePage<PmGiftCondDto.Item> selectPageData(PmGiftCondDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmGiftCond.giftCondId, search.getGiftCondId()));
        whereList.add(QdslUtil.strEq(pmGiftCond.giftId, search.getGiftId()));
        whereList.add(QdslUtil.strEq(pmGiftCond.targetTypeCd, search.getTargetTypeCd()));
        whereList.add(QdslUtil.strEq(pmGiftCond.targetId, search.getTargetId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pmGiftCond.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pmGiftCond.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmGiftCondDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmGiftCondDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmGiftCond.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmGiftCondDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("condTypeCd", pmGiftCond.condTypeCd),
            QdslUtil.FieldDef.like("giftCondId", pmGiftCond.giftCondId),
            QdslUtil.FieldDef.like("giftId", pmGiftCond.giftId),
            QdslUtil.FieldDef.like("targetId", pmGiftCond.targetId),
            QdslUtil.FieldDef.like("targetTypeCd", pmGiftCond.targetTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("giftCondId", pmGiftCond.giftCondId,
                   "regDate", pmGiftCond.regDate),
        new OrderSpecifier<>(Order.DESC, pmGiftCond.regDate),
        new OrderSpecifier<>(Order.ASC, pmGiftCond.giftCondId));
    }

    /* 사은품 지급 조건 수정 */
    @Override
    public int updateSelective(PmGiftCond entity) {
        if (entity.getGiftCondId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmGiftCond);
        boolean hasAny = false;

        if (entity.getGiftId()       != null) { update.set(pmGiftCond.giftId,       entity.getGiftId());       hasAny = true; }
        if (entity.getCondTypeCd()   != null) { update.set(pmGiftCond.condTypeCd,   entity.getCondTypeCd());   hasAny = true; }
        if (entity.getMinOrderAmt()  != null) { update.set(pmGiftCond.minOrderAmt,  entity.getMinOrderAmt());  hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(pmGiftCond.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(pmGiftCond.targetId,     entity.getTargetId());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmGiftCond.giftCondId.eq(entity.getGiftCondId())).execute();
        return (int) affected;
    }
}
