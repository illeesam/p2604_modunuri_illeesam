package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdClaimItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** OdClaimItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdClaimItemRepositoryImpl implements QOdClaimItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdClaimItemRepositoryImpl";
    private static final QOdClaimItem odClaimItem = QOdClaimItem.odClaimItem;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", odClaimItem.regDate,
        "upd_date", odClaimItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("claimId", odClaimItem.claimId),
        Map.entry("claimItemId", odClaimItem.claimItemId),
        Map.entry("claimItemStatusCd", odClaimItem.claimItemStatusCd),
        Map.entry("claimItemStatusCdBefore", odClaimItem.claimItemStatusCdBefore),
        Map.entry("orderItemId", odClaimItem.orderItemId),
        Map.entry("prodId", odClaimItem.prodId),
        Map.entry("prodNm", odClaimItem.prodNm),
        Map.entry("prodOption", odClaimItem.prodOption),
        Map.entry("siteId", odClaimItem.siteId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * CLAIM_ITEM_STATUS  {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
     */
    private JPAQuery<OdClaimItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimItemDto.Item.class,
                        odClaimItem.claimItemId,             // 클레임항목ID (YYMMDDhhmmss+rand4)
                        odClaimItem.siteId,                  // 사이트ID
                        odClaimItem.claimId,                 // 클레임ID (od_claim.)
                        odClaimItem.orderItemId,             // 주문상품ID (od_order_item.)
                        odClaimItem.prodId,                   // 상품ID
                        odClaimItem.prodNm,                   // 상품명 (주문시점 스냅샷)
                        odClaimItem.prodSkuId,                // SKU ID (pd_prod_sku.prod_sku_id, 주문시점 스냅샷)
                        odClaimItem.prodOptId1,               // 옵션1 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)
                        odClaimItem.prodOptId2,               // 옵션2 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)
                        odClaimItem.prodOption,               // 옵션 (색상/사이즈 스냅샷)
                        odClaimItem.newProdId,                // [교환] 교환 요청 상품ID (claim_type_cd=EXCHANGE 시에만 사용)
                        odClaimItem.newProdSkuId,             // [교환] 교환 요청 SKU ID
                        odClaimItem.newProdOptId1,            // [교환] 교환 요청 옵션1 값ID
                        odClaimItem.newProdOptId2,            // [교환] 교환 요청 옵션2 값ID
                        odClaimItem.newProdNm,                 // [교환] 교환 요청 상품명
                        odClaimItem.newProdOption,            // [교환] 교환 요청 옵션 텍스트
                        odClaimItem.newQty,                    // [교환] 교환 요청 수량
                        odClaimItem.newUnitPrice,             // [교환] 교환 요청 단가 (정산 차액 계산: new_unit_price*new_qty - unit_price*claim_qty)
                        odClaimItem.unitPrice,                 // 판매가 (단가)
                        odClaimItem.claimQty,                  // 클레임 수량
                        odClaimItem.itemAmt,                   // 클레임금액 (unit_price × claim_qty)
                        odClaimItem.refundAmt,                 // 환불금액
                        odClaimItem.claimItemStatusCd,        // 항목상태 — CLAIM_ITEM_STATUS {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
                        odClaimItem.claimItemStatusCdBefore,  // 변경 전 클레임상태 — CLAIM_ITEM_STATUS (동일 코드그룹)
                        odClaimItem.returnShippingFee,        // 해당 항목의 수거배송료
                        odClaimItem.inboundShippingFee,       // 해당 항목의 반입배송료
                        odClaimItem.exchangeShippingFee,      // 해당 항목의 교환 발송배송료
                        odClaimItem.regBy, odClaimItem.regDate, odClaimItem.updBy, odClaimItem.updDate
                ))
                .from(odClaimItem);
    }

    /* 클레임 아이템 키조회 */
    @Override
    public Optional<OdClaimItemDto.Item> selectById(String claimItemId) {
        OdClaimItemDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odClaimItem.claimItemId.eq(claimItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 클레임 아이템 목록조회 */
    @Override
    public List<OdClaimItemDto.Item> selectList(OdClaimItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdClaimItemDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(odClaimItem.claimId, search.getClaimIds()),
                    QdslUtil.strEq(odClaimItem.claimId, search.getClaimId()),
                    QdslUtil.strEq(odClaimItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(odClaimItem.claimItemId, search.getClaimItemId()),
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

    /* 클레임 아이템 페이지조회 */
    @Override
    public OdClaimItemDto.PageResponse selectPageData(OdClaimItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(odClaimItem.claimId, search.getClaimIds()),
                QdslUtil.strEq(odClaimItem.claimId, search.getClaimId()),
                QdslUtil.strEq(odClaimItem.siteId, search.getSiteId()),
                QdslUtil.strEq(odClaimItem.claimItemId, search.getClaimItemId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdClaimItemDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdClaimItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odClaimItem.count())
                .where(wheres)
                .fetchOne();

        OdClaimItemDto.PageResponse res = new OdClaimItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(OdClaimItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdClaimItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, odClaimItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odClaimItem.claimItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("claimItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, odClaimItem.claimItemId));
                } else if ("prodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, odClaimItem.prodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odClaimItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odClaimItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odClaimItem.claimItemId));
        }
        return orders;
    }

    /* 클레임 아이템 수정 */
    @Override
    public int updateSelective(OdClaimItem entity) {
        if (entity.getClaimItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odClaimItem);
        boolean hasAny = false;

        if (entity.getSiteId()                  != null) { update.set(odClaimItem.siteId,                  entity.getSiteId());                  hasAny = true; }
        if (entity.getClaimId()                 != null) { update.set(odClaimItem.claimId,                 entity.getClaimId());                 hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(odClaimItem.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getProdId()                  != null) { update.set(odClaimItem.prodId,                  entity.getProdId());                  hasAny = true; }
        if (entity.getProdNm()                  != null) { update.set(odClaimItem.prodNm,                  entity.getProdNm());                  hasAny = true; }
        if (entity.getProdSkuId()               != null) { update.set(odClaimItem.prodSkuId,               entity.getProdSkuId());               hasAny = true; }
        if (entity.getProdOptId1()              != null) { update.set(odClaimItem.prodOptId1,              entity.getProdOptId1());              hasAny = true; }
        if (entity.getProdOptId2()              != null) { update.set(odClaimItem.prodOptId2,              entity.getProdOptId2());              hasAny = true; }
        if (entity.getProdOption()              != null) { update.set(odClaimItem.prodOption,              entity.getProdOption());              hasAny = true; }
        if (entity.getNewProdId()               != null) { update.set(odClaimItem.newProdId,               entity.getNewProdId());               hasAny = true; }
        if (entity.getNewProdSkuId()            != null) { update.set(odClaimItem.newProdSkuId,            entity.getNewProdSkuId());            hasAny = true; }
        if (entity.getNewProdOptId1()           != null) { update.set(odClaimItem.newProdOptId1,           entity.getNewProdOptId1());           hasAny = true; }
        if (entity.getNewProdOptId2()           != null) { update.set(odClaimItem.newProdOptId2,           entity.getNewProdOptId2());           hasAny = true; }
        if (entity.getNewProdNm()               != null) { update.set(odClaimItem.newProdNm,               entity.getNewProdNm());               hasAny = true; }
        if (entity.getNewProdOption()           != null) { update.set(odClaimItem.newProdOption,           entity.getNewProdOption());           hasAny = true; }
        if (entity.getNewQty()                  != null) { update.set(odClaimItem.newQty,                  entity.getNewQty());                  hasAny = true; }
        if (entity.getNewUnitPrice()            != null) { update.set(odClaimItem.newUnitPrice,            entity.getNewUnitPrice());            hasAny = true; }
        if (entity.getUnitPrice()               != null) { update.set(odClaimItem.unitPrice,               entity.getUnitPrice());               hasAny = true; }
        if (entity.getClaimQty()                != null) { update.set(odClaimItem.claimQty,                entity.getClaimQty());                hasAny = true; }
        if (entity.getItemAmt()                 != null) { update.set(odClaimItem.itemAmt,                 entity.getItemAmt());                 hasAny = true; }
        if (entity.getRefundAmt()               != null) { update.set(odClaimItem.refundAmt,               entity.getRefundAmt());               hasAny = true; }
        if (entity.getClaimItemStatusCd()       != null) { update.set(odClaimItem.claimItemStatusCd,       entity.getClaimItemStatusCd());       hasAny = true; }
        if (entity.getClaimItemStatusCdBefore() != null) { update.set(odClaimItem.claimItemStatusCdBefore, entity.getClaimItemStatusCdBefore()); hasAny = true; }
        if (entity.getReturnShippingFee()       != null) { update.set(odClaimItem.returnShippingFee,       entity.getReturnShippingFee());       hasAny = true; }
        if (entity.getInboundShippingFee()      != null) { update.set(odClaimItem.inboundShippingFee,      entity.getInboundShippingFee());      hasAny = true; }
        if (entity.getExchangeShippingFee()     != null) { update.set(odClaimItem.exchangeShippingFee,     entity.getExchangeShippingFee());     hasAny = true; }
        if (entity.getUpdBy()                   != null) { update.set(odClaimItem.updBy,                   entity.getUpdBy());                   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odClaimItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odClaimItem.claimItemId.eq(entity.getClaimItemId())).execute();
        return (int) affected;
    }
}
