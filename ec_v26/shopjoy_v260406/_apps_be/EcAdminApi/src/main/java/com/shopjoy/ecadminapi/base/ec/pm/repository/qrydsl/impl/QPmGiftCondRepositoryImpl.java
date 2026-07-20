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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftCondRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QSyCode     cdGct = new QSyCode("cd_gct");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmGiftCond.regDate,
        "upd_date", pmGiftCond.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("condTypeCd", pmGiftCond.condTypeCd),
        Map.entry("giftCondId", pmGiftCond.giftCondId),
        Map.entry("giftId", pmGiftCond.giftId),
        Map.entry("siteId", pmGiftCond.siteId),
        Map.entry("targetId", pmGiftCond.targetId),
        Map.entry("targetTypeCd", pmGiftCond.targetTypeCd)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GIFT_COND_TYPE  {ORDER_AMT: '주문금액', PRODUCT: '특정상품', MEMBER_GRADE: '회원등급'}
     * targetTypeCd    {PRODUCT: '상품', CATEGORY: '카테고리', MEMBER_GRADE: '회원등급'} (Entity 주석 기준)
     */
    private JPAQuery<PmGiftCondDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftCondDto.Item.class,
                        pmGiftCond.giftCondId,     // 사은품조건ID (PK)
                        pmGiftCond.giftId,         // 사은품ID (pm_gift.gift_id)
                        pmGiftCond.siteId,         // 사이트ID
                        pmGiftCond.condTypeCd,     // 조건유형 — GIFT_COND_TYPE {ORDER_AMT: '주문금액', PRODUCT: '특정상품', MEMBER_GRADE: '회원등급'}
                        pmGiftCond.minOrderAmt,    // 최소주문금액 (ORDER_AMT 조건)
                        pmGiftCond.targetTypeCd,   // 대상유형 — PRODUCT/CATEGORY/MEMBER_GRADE
                        pmGiftCond.targetId,       // 대상ID
                        pmGiftCond.regBy, pmGiftCond.regDate
                ))
                .from(pmGiftCond)
                .leftJoin(pmGift).on(pmGift.giftId.eq(pmGiftCond.giftId))
                .leftJoin(sySite).on(sySite.siteId.eq(pmGiftCond.siteId))
                .leftJoin(cdGct).on(cdGct.codeGrp.eq("GIFT_COND_TYPE").and(cdGct.codeValue.eq(pmGiftCond.condTypeCd)));
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftCondDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmGiftCond.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmGiftCond.giftCondId, search.getGiftCondId()),
                    QdslUtil.strEq(pmGiftCond.giftId, search.getGiftId()),
                    QdslUtil.strEq(pmGiftCond.targetTypeCd, search.getTargetTypeCd()),
                    QdslUtil.strEq(pmGiftCond.targetId, search.getTargetId()),
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

    /* 사은품 지급 조건 페이지조회 */
    @Override
    public PmGiftCondDto.PageResponse selectPageData(PmGiftCondDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmGiftCond.siteId, search.getSiteId()),
                QdslUtil.strEq(pmGiftCond.giftCondId, search.getGiftCondId()),
                QdslUtil.strEq(pmGiftCond.giftId, search.getGiftId()),
                QdslUtil.strEq(pmGiftCond.targetTypeCd, search.getTargetTypeCd()),
                QdslUtil.strEq(pmGiftCond.targetId, search.getTargetId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

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

        PmGiftCondDto.PageResponse res = new PmGiftCondDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PmGiftCondDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmGiftCondDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmGiftCond.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmGiftCond.giftCondId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("giftCondId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGiftCond.giftCondId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGiftCond.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmGiftCond.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmGiftCond.giftCondId));
        }
        return orders;
    }

    /* 사은품 지급 조건 수정 */
    @Override
    public int updateSelective(PmGiftCond entity) {
        if (entity.getGiftCondId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmGiftCond);
        boolean hasAny = false;

        if (entity.getGiftId()       != null) { update.set(pmGiftCond.giftId,       entity.getGiftId());       hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(pmGiftCond.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getCondTypeCd()   != null) { update.set(pmGiftCond.condTypeCd,   entity.getCondTypeCd());   hasAny = true; }
        if (entity.getMinOrderAmt()  != null) { update.set(pmGiftCond.minOrderAmt,  entity.getMinOrderAmt());  hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(pmGiftCond.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(pmGiftCond.targetId,     entity.getTargetId());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmGiftCond.giftCondId.eq(entity.getGiftCondId())).execute();
        return (int) affected;
    }
}
