package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample3;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample3;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample3Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** ZzSample3 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample3RepositoryImpl implements QZzSample3Repository {

    private final JPAQueryFactory queryFactory;
    private static final QZzSample3 s = QZzSample3.zzSample3;

    private JPAQuery<ZzSample3Dto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample3Dto.Item.class,
                        s.sample3Id,
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
                        s.regBy,
                        s.regDate,
                        s.updBy,
                        s.updDate,
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
                        s.cateCds,
                        s.sample1Id,
                        s.sample2Id
                ))
                .from(s);
    }

    @Override
    public Optional<ZzSample3Dto.Item> selectById(String id) {
        ZzSample3Dto.Item dto = buildBaseQuery()
                .where(s.sample3Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<ZzSample3Dto.Item> selectList(ZzSample3Dto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample3Dto.Item> query = buildBaseQuery().where(where);
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
    public ZzSample3Dto.PageResponse selectPageList(ZzSample3Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample3Dto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzSample3Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(s.count())
                .from(s)
                .where(where)
                .fetchOne();

        ZzSample3Dto.PageResponse res = new ZzSample3Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(ZzSample3Dto.Request search) {
        BooleanBuilder w = new BooleanBuilder();
        if (search == null) return w;

        if (StringUtils.hasText(search.getSample3Id())) w.and(s.sample3Id.eq(search.getSample3Id()));
        if (StringUtils.hasText(search.getSample1Id())) w.and(s.sample1Id.eq(search.getSample1Id()));
        if (StringUtils.hasText(search.getSample2Id())) w.and(s.sample2Id.eq(search.getSample2Id()));
        if (StringUtils.hasText(search.getUseYn()))     w.and(s.useYn.eq(search.getUseYn()));
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzSample3Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sample3Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.sample3Id));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(ZzSample3 entity) {
        if (entity.getSample3Id() == null) return 0;

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
        if (entity.getUpdBy()      != null) { update.set(s.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(s.updDate,    entity.getUpdDate());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(s.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(s.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(s.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(s.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(s.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(s.cateCds,    entity.getCateCds());    hasAny = true; }
        if (entity.getSample1Id()  != null) { update.set(s.sample1Id,  entity.getSample1Id());  hasAny = true; }
        if (entity.getSample2Id()  != null) { update.set(s.sample2Id,  entity.getSample2Id());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.sample3Id.eq(entity.getSample3Id())).execute();
        return (int) affected;
    }
}
