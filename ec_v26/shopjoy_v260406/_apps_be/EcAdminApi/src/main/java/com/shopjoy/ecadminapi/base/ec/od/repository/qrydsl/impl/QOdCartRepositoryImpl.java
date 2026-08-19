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
import com.querydsl.jpa.JPAExpressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdCart;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdCartRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** OdCart QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdCartRepositoryImpl implements QOdCartRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdCartRepositoryImpl";
    private static final QOdCart        odCart   = QOdCart.odCart;
    private static final QSySite        sySite = QSySite.sySite;
    private static final QMbMember      mbMember   = QMbMember.mbMember;
    private static final QMbMember      mbMemberEx = new QMbMember("mb_member_ex");
    private static final QPdProd        pdProd = QPdProd.pdProd;
    private static final QPdProdOpt oi1 = new QPdProdOpt("oi1");
    private static final QPdProdOpt oi2 = new QPdProdOpt("oi2");    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * od_cart 는 상태코드(*_cd) 컬럼 없음 (is_checked 는 Y/N 플래그)
     */
    private JPAQuery<OdCartDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdCartDto.Item.class,
                        odCart.cartId,      // 장바구니ID (YYMMDDhhmmss+rand4)
                        odCart.memberId,    // 회원ID (비회원 NULL)
                        odCart.sessionKey,  // 비회원 세션키
                        odCart.prodId,      // 상품ID (pd_prod.prod_id)
                        odCart.prodSkuId,   // SKU ID (pd_prod_sku.prod_sku_id)
                        odCart.prodOpt1Id,  // 옵션1 값ID (pd_prod_opt.opt_id, 예: 색상)
                        odCart.prodOpt2Id,  // 옵션2 값ID (pd_prod_opt.opt_id, 예: 사이즈)
                        odCart.unitPrice,   // 단가 (담을 시점 가격)
                        odCart.orderQty,    // 수량
                        odCart.itemPrice,   // 소계 (단가 × 수량)
                        odCart.isChecked,   // 주문선택여부 Y/N
                        odCart.regBy, odCart.regDate, odCart.updBy, odCart.updDate,
                        mbMember.memberNm.as("memberNm"),
                        pdProd.prodNm.as("prodNm"),
                        oi1.prodOptNm.as("prodOptNm1"),
                        oi2.prodOptNm.as("prodOptNm2")
                ))
                .from(odCart)
                .leftJoin(mbMember).on(mbMember.memberId.eq(odCart.memberId)) // 회원
                .leftJoin(pdProd).on(pdProd.prodId.eq(odCart.prodId)) // 상품
                .leftJoin(oi1).on(oi1.prodOptId.eq(odCart.prodOpt1Id)) // 옵션1
                .leftJoin(oi2).on(oi2.prodOptId.eq(odCart.prodOpt2Id)) // 옵션2
                ;
    }

    /* 장바구니 키조회 */
    @Override
    public Optional<OdCartDto.Item> selectById(String cartId) {
        OdCartDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odCart.cartId.eq(cartId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 장바구니 목록조회 */
    @Override
    public List<OdCartDto.Item> selectList(OdCartDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odCart.cartId, search.getCartId()));
        whereList.add((StringUtils.hasText(search.getMemberId()) || StringUtils.hasText(search.getMemberNm()))
                ? JPAExpressions.selectOne().from(mbMemberEx)
                      .where(mbMemberEx.memberId.eq(odCart.memberId),
                             QdslUtil.strEq(mbMemberEx.memberId, search.getMemberId()),
                             StringUtils.hasText(search.getMemberId()) ? null : QdslUtil.strLike(mbMemberEx.memberNm, search.getMemberNm())).exists()
                : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odCart.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odCart.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdCartDto.Item> query = baseListQuery()
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
        List<OdCartDto.Item> list = query.fetch();
        return list;
    }

    /* 장바구니 페이지조회 */
    @Override
    public BasePage<OdCartDto.Item> selectPageData(OdCartDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odCart.cartId, search.getCartId()));
        whereList.add((StringUtils.hasText(search.getMemberId()) || StringUtils.hasText(search.getMemberNm()))
                ? JPAExpressions.selectOne().from(mbMemberEx)
                      .where(mbMemberEx.memberId.eq(odCart.memberId),
                             QdslUtil.strEq(mbMemberEx.memberId, search.getMemberId()),
                             StringUtils.hasText(search.getMemberId()) ? null : QdslUtil.strLike(mbMemberEx.memberNm, search.getMemberNm())).exists()
                : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odCart.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odCart.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdCartDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdCartDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odCart.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdCartDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("cartId", odCart.cartId),
            QdslUtil.FieldDef.like("isChecked", odCart.isChecked),
            QdslUtil.FieldDef.like("memberId", odCart.memberId),
            QdslUtil.FieldDef.like("prodOpt1Id", odCart.prodOpt1Id),
            QdslUtil.FieldDef.like("prodOpt2Id", odCart.prodOpt2Id),
            QdslUtil.FieldDef.like("prodId", odCart.prodId),
            QdslUtil.FieldDef.like("sessionKey", odCart.sessionKey),
            QdslUtil.FieldDef.like("prodSkuId", odCart.prodSkuId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("cartId", odCart.cartId,
                   "regDate", odCart.regDate),
        new OrderSpecifier<>(Order.DESC, odCart.regDate),
        new OrderSpecifier<>(Order.ASC, odCart.cartId));
    }

    /* 장바구니 수정 */
    @Override
    public int updateSelective(OdCart entity) {
        if (entity.getCartId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odCart);
        boolean hasAny = false;

        if (entity.getMemberId()    != null) { update.set(odCart.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getSessionKey()  != null) { update.set(odCart.sessionKey,  entity.getSessionKey());  hasAny = true; }
        if (entity.getProdId()      != null) { update.set(odCart.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getProdSkuId()   != null) { update.set(odCart.prodSkuId,   entity.getProdSkuId());   hasAny = true; }
        if (entity.getProdOpt1Id()  != null) { update.set(odCart.prodOpt1Id,  entity.getProdOpt1Id());  hasAny = true; }
        if (entity.getProdOpt2Id()  != null) { update.set(odCart.prodOpt2Id,  entity.getProdOpt2Id());  hasAny = true; }
        if (entity.getUnitPrice()   != null) { update.set(odCart.unitPrice,   entity.getUnitPrice());   hasAny = true; }
        if (entity.getOrderQty()    != null) { update.set(odCart.orderQty,    entity.getOrderQty());    hasAny = true; }
        if (entity.getItemPrice()   != null) { update.set(odCart.itemPrice,   entity.getItemPrice());   hasAny = true; }
        if (entity.getIsChecked()   != null) { update.set(odCart.isChecked,   entity.getIsChecked());   hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(odCart.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(odCart.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odCart.cartId.eq(entity.getCartId())).execute();
        return (int) affected;
    }
}
