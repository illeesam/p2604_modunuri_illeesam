package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QZzSample1;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QZzSample1Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** ZzSample1 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample1RepositoryImpl implements QZzSample1Repository {

    private final JPAQueryFactory queryFactory;
    private static final QZzSample1 s = QZzSample1.zzSample1;

    private JPAQuery<ZzSample1Dto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample1Dto.Item.class,
                        s.sample1Id,
                        s.cdGrp,
                        s.cdVl,
                        s.cdNm,
                        s.srtordVl,
                        s.attrNm1,
                        s.attrNm2,
                        s.attrNm3,
                        s.attrNm4,
                        s.explnCn,
                        s.cdInfwSeCd,
                        s.useYn,
                        s.rgtr,
                        s.regDt,
                        s.mdfr,
                        s.mdfcnDt,
                        s.groupCd,
                        s.col01,
                        s.col02,
                        s.col03,
                        s.col04,
                        s.col05,
                        s.col06,
                        s.col07,
                        s.col08,
                        s.col09,
                        s.statusCd,
                        s.typeCd,
                        s.divCd,
                        s.kindCd,
                        s.cateCds
                ))
                .from(s);
    }

    @Override
    public Optional<ZzSample1Dto.Item> selectById(String id) {
        ZzSample1Dto.Item dto = buildBaseQuery()
                .where(s.sample1Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<ZzSample1Dto.Item> selectList(ZzSample1Dto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample1Dto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public ZzSample1Dto.PageResponse selectPageList(ZzSample1Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample1Dto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzSample1Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(s.count())
                .from(s)
                .where(where)
                .fetchOne();

        ZzSample1Dto.PageResponse res = new ZzSample1Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(ZzSample1Dto.Request search) {
        BooleanBuilder w = new BooleanBuilder();
        if (search == null) return w;

        if (StringUtils.hasText(search.getSample1Id())) w.and(s.sample1Id.eq(search.getSample1Id()));
        if (StringUtils.hasText(search.getUseYn()))     w.and(s.useYn.eq(search.getUseYn()));
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzSample1Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, s.regDt));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  s.sample1Id)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, s.sample1Id)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  s.regDt));     break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, s.regDt));     break;
            default:         orders.add(new OrderSpecifier(Order.DESC, s.regDt));     break;
        }
        return orders;
    }

    @Override
    public int updateSelective(ZzSample1 entity) {
        if (entity.getSample1Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getCdGrp()      != null) { update.set(s.cdGrp,      entity.getCdGrp());      hasAny = true; }
        if (entity.getCdVl()       != null) { update.set(s.cdVl,       entity.getCdVl());       hasAny = true; }
        if (entity.getCdNm()       != null) { update.set(s.cdNm,       entity.getCdNm());       hasAny = true; }
        if (entity.getSrtordVl()   != null) { update.set(s.srtordVl,   entity.getSrtordVl());   hasAny = true; }
        if (entity.getAttrNm1()    != null) { update.set(s.attrNm1,    entity.getAttrNm1());    hasAny = true; }
        if (entity.getAttrNm2()    != null) { update.set(s.attrNm2,    entity.getAttrNm2());    hasAny = true; }
        if (entity.getAttrNm3()    != null) { update.set(s.attrNm3,    entity.getAttrNm3());    hasAny = true; }
        if (entity.getAttrNm4()    != null) { update.set(s.attrNm4,    entity.getAttrNm4());    hasAny = true; }
        if (entity.getExplnCn()    != null) { update.set(s.explnCn,    entity.getExplnCn());    hasAny = true; }
        if (entity.getCdInfwSeCd() != null) { update.set(s.cdInfwSeCd, entity.getCdInfwSeCd()); hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(s.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getMdfr()       != null) { update.set(s.mdfr,       entity.getMdfr());       hasAny = true; }
        if (entity.getMdfcnDt()    != null) { update.set(s.mdfcnDt,    entity.getMdfcnDt());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(s.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(s.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(s.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(s.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(s.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(s.cateCds,    entity.getCateCds());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.sample1Id.eq(entity.getSample1Id())).execute();
        return (int) affected;
    }
}
