package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdCart;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdCartRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOptItem;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdCart QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdCartRepositoryImpl implements QOdCartRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdCart        c   = QOdCart.odCart;
    private static final QSySite        ste = QSySite.sySite;
    private static final QMbMember      mem = QMbMember.mbMember;
    private static final QPdProd        prd = QPdProd.pdProd;
    private static final QPdProdOptItem oi1 = new QPdProdOptItem("oi1");
    private static final QPdProdOptItem oi2 = new QPdProdOptItem("oi2");

    @Override
    public Optional<OdCartDto.Item> selectById(String cartId) {
        OdCartDto.Item dto = baseListQuery()
                .where(c.cartId.eq(cartId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdCartDto.Item> selectList(OdCartDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdCartDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public OdCartDto.PageResponse selectPageList(OdCartDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdCartDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdCartDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .leftJoin(mem).on(mem.memberId.eq(c.memberId))
                .leftJoin(prd).on(prd.prodId.eq(c.prodId))
                .where(where)
                .fetchOne();

        OdCartDto.PageResponse res = new OdCartDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<OdCartDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdCartDto.Item.class,
                        c.cartId, c.siteId, c.memberId, c.sessionKey, c.prodId, c.skuId,
                        c.optItemId1, c.optItemId2, c.unitPrice, c.orderQty, c.itemPrice, c.isChecked,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        ste.siteNm.as("siteNm"),
                        mem.memberNm.as("memberNm"),
                        prd.prodNm.as("prodNm"),
                        oi1.optNm.as("optNm1"),
                        oi2.optNm.as("optNm2")
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId))
                .leftJoin(mem).on(mem.memberId.eq(c.memberId))
                .leftJoin(prd).on(prd.prodId.eq(c.prodId))
                .leftJoin(oi1).on(oi1.optItemId.eq(c.optItemId1))
                .leftJoin(oi2).on(oi2.optItemId.eq(c.optItemId2));
    }

    // searchTypes 사용 예 (콤마 경계 매칭):
    //   - 단일 조건  : searchTypes = "def_blog_title"
    //   - 복합 조건  : searchTypes = "def_blog_title,def_blog_author"   (UI 에서 aaa,bbb 형태로 전달)
    //   - 미지정     : searchTypes = null/"" 이면 all=true 로 전체 컬럼 OR 검색
    //
    //   buildCondition 내부에서는
    //     String types = "," + searchTypes + ",";   // 예: ",def_blog_title,def_blog_author,"
    //     types.contains(",def_blog_title,")         // 토큰 경계 정확 매칭 (부분문자열 오매칭 방지)
    //   형태로 비교한다.
    private BooleanBuilder buildCondition(OdCartDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCartId()))   w.and(c.cartId.eq(s.getCartId()));
        if (StringUtils.hasText(s.getMemberId())) w.and(c.memberId.eq(s.getMemberId()));

        // searchValue + searchTypes
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_member_nm,")) or.or(mem.memberNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_member_id,")) or.or(c.memberId.likeIgnoreCase(pattern));
            if (all || types.contains(",def_prod_id,"))   or.or(c.prodId.likeIgnoreCase(pattern));
            if (all || types.contains(",def_prod_nm,"))   or.or(prd.prodNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(OdCartDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("cartId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.cartId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(OdCart entity) {
        if (entity.getCartId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(c.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getMemberId()    != null) { update.set(c.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getSessionKey()  != null) { update.set(c.sessionKey,  entity.getSessionKey());  hasAny = true; }
        if (entity.getProdId()      != null) { update.set(c.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getSkuId()       != null) { update.set(c.skuId,       entity.getSkuId());       hasAny = true; }
        if (entity.getOptItemId1()  != null) { update.set(c.optItemId1,  entity.getOptItemId1());  hasAny = true; }
        if (entity.getOptItemId2()  != null) { update.set(c.optItemId2,  entity.getOptItemId2());  hasAny = true; }
        if (entity.getUnitPrice()   != null) { update.set(c.unitPrice,   entity.getUnitPrice());   hasAny = true; }
        if (entity.getOrderQty()    != null) { update.set(c.orderQty,    entity.getOrderQty());    hasAny = true; }
        if (entity.getItemPrice()   != null) { update.set(c.itemPrice,   entity.getItemPrice());   hasAny = true; }
        if (entity.getIsChecked()   != null) { update.set(c.isChecked,   entity.getIsChecked());   hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(c.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(c.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.cartId.eq(entity.getCartId())).execute();
        return (int) affected;
    }
}
