package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdClaimItemRepository;
import lombok.RequiredArgsConstructor;

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
    private static final QOdClaimItem odClaimItem = QOdClaimItem.odClaimItem;    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * CLAIM_ITEM_STATUS  {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
     */
    private JPAQuery<OdClaimItemDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdClaimItemDto.Item.class,
                        odClaimItem.claimItemId,             // 클레임항목ID (YYMMDDhhmmss+rand4)
                        odClaimItem.claimId,                 // 클레임ID (od_claim.)
                        odClaimItem.orderItemId,             // 주문상품ID (od_order_item.)
                        odClaimItem.prodId,                   // 상품ID
                        odClaimItem.prodNm,                   // 상품명 (주문시점 스냅샷)
                        odClaimItem.prodSkuId,                // SKU ID (pd_prod_sku.prod_sku_id, 주문시점 스냅샷)
                        odClaimItem.prodOpt1Id,               // 옵션1 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)
                        odClaimItem.prodOpt2Id,               // 옵션2 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)
                        odClaimItem.prodOption,               // 옵션 (색상/사이즈 스냅샷)
                        odClaimItem.newProdId,                // [교환] 교환 요청 상품ID (claim_type_cd=EXCHANGE 시에만 사용)
                        odClaimItem.newProdSkuId,             // [교환] 교환 요청 SKU ID
                        odClaimItem.newProdOpt1Id,            // [교환] 교환 요청 옵션1 값ID
                        odClaimItem.newProdOpt2Id,            // [교환] 교환 요청 옵션2 값ID
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strIn(odClaimItem.claimId, search.getClaimIds()));
        wheres.add(QdslUtil.strEq(odClaimItem.claimId, search.getClaimId()));
        wheres.add(QdslUtil.strEq(odClaimItem.claimItemId, search.getClaimItemId()));
        wheres.add(QdslUtil.strEq(odClaimItem.claimItemStatusCd, search.getClaimItemStatusCd()));
        wheres.add(QdslUtil.strIn(odClaimItem.claimItemStatusCd, search.getClaimItemStatusCds()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(odClaimItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(odClaimItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdClaimItemDto.Item> query = baseListQuery()
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

    /* 클레임 아이템 페이지조회 */
    @Override
    public BasePage<OdClaimItemDto.Item> selectPageData(OdClaimItemDto.Request search) {
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
        whereList.add(QdslUtil.strIn(odClaimItem.claimId, search.getClaimIds()));
        whereList.add(QdslUtil.strEq(odClaimItem.claimId, search.getClaimId()));
        whereList.add(QdslUtil.strEq(odClaimItem.claimItemId, search.getClaimItemId()));
        whereList.add(QdslUtil.strEq(odClaimItem.claimItemStatusCd, search.getClaimItemStatusCd()));
        whereList.add(QdslUtil.strIn(odClaimItem.claimItemStatusCd, search.getClaimItemStatusCds()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(odClaimItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(odClaimItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

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

        BasePage<OdClaimItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("claimId", odClaimItem.claimId),
            QdslUtil.FieldDef.like("claimItemId", odClaimItem.claimItemId),
            QdslUtil.FieldDef.like("claimItemStatusCd", odClaimItem.claimItemStatusCd),
            QdslUtil.FieldDef.like("claimItemStatusCdBefore", odClaimItem.claimItemStatusCdBefore),
            QdslUtil.FieldDef.like("orderItemId", odClaimItem.orderItemId),
            QdslUtil.FieldDef.like("prodId", odClaimItem.prodId),
            QdslUtil.FieldDef.like("prodNm", odClaimItem.prodNm),
            QdslUtil.FieldDef.like("prodOption", odClaimItem.prodOption)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("claimItemId", odClaimItem.claimItemId,
                   "prodNm", odClaimItem.prodNm,
                   "regDate", odClaimItem.regDate),
        new OrderSpecifier<>(Order.DESC, odClaimItem.regDate),
        new OrderSpecifier<>(Order.ASC, odClaimItem.claimItemId));
    }

    /* 클레임 아이템 수정 */
    @Override
    public int updateSelective(OdClaimItem entity) {
        if (entity.getClaimItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odClaimItem);
        boolean hasAny = false;

        if (entity.getClaimId()                 != null) { update.set(odClaimItem.claimId,                 entity.getClaimId());                 hasAny = true; }
        if (entity.getOrderItemId()             != null) { update.set(odClaimItem.orderItemId,             entity.getOrderItemId());             hasAny = true; }
        if (entity.getProdId()                  != null) { update.set(odClaimItem.prodId,                  entity.getProdId());                  hasAny = true; }
        if (entity.getProdNm()                  != null) { update.set(odClaimItem.prodNm,                  entity.getProdNm());                  hasAny = true; }
        if (entity.getProdSkuId()               != null) { update.set(odClaimItem.prodSkuId,               entity.getProdSkuId());               hasAny = true; }
        if (entity.getProdOpt1Id()              != null) { update.set(odClaimItem.prodOpt1Id,              entity.getProdOpt1Id());              hasAny = true; }
        if (entity.getProdOpt2Id()              != null) { update.set(odClaimItem.prodOpt2Id,              entity.getProdOpt2Id());              hasAny = true; }
        if (entity.getProdOption()              != null) { update.set(odClaimItem.prodOption,              entity.getProdOption());              hasAny = true; }
        if (entity.getNewProdId()               != null) { update.set(odClaimItem.newProdId,               entity.getNewProdId());               hasAny = true; }
        if (entity.getNewProdSkuId()            != null) { update.set(odClaimItem.newProdSkuId,            entity.getNewProdSkuId());            hasAny = true; }
        if (entity.getNewProdOpt1Id()           != null) { update.set(odClaimItem.newProdOpt1Id,           entity.getNewProdOpt1Id());           hasAny = true; }
        if (entity.getNewProdOpt2Id()           != null) { update.set(odClaimItem.newProdOpt2Id,           entity.getNewProdOpt2Id());           hasAny = true; }
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
