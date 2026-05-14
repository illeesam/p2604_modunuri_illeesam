package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdProdRelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdRel QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdRelRepositoryImpl implements QPdProdRelRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdRel r = QPdProdRel.pdProdRel;

    /** 단건 조회 */
    @Override
    public Optional<PdProdRelDto.Item> selectById(String prodRelId) {
        PdProdRelDto.Item dto = baseQuery()
                .where(r.prodRelId.eq(prodRelId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdProdRelDto.Item> selectList(PdProdRelDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdRelDto.Item> query = baseQuery().where(where);
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

    /** 페이지 목록 */
    @Override
    public PdProdRelDto.PageResponse selectPageList(PdProdRelDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdRelDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdRelDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(where).fetchOne();

        PdProdRelDto.PageResponse res = new PdProdRelDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    private JPAQuery<PdProdRelDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdRelDto.Item.class,
                        r.prodRelId, r.prodId, r.relProdId,
                        r.prodRelTypeCd, r.sortOrd, r.useYn,
                        r.regBy, r.regDate, r.updBy, r.updDate
                ))
                .from(r);
    }

    /** 검색조건 빌드 — Mapper XML pdProdRelCond 와 동일 동작 (DTO Request 필드 한정) */
    private BooleanBuilder buildCondition(PdProdRelDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getProdRelId())) w.and(r.prodRelId.eq(s.getProdRelId()));
        if (StringUtils.hasText(s.getProdId()))    w.and(r.prodId.eq(s.getProdId()));
        if (StringUtils.hasText(s.getUseYn()))     w.and(r.useYn.eq(s.getUseYn()));

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /** 정렬조건 빌드 */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdRelDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  r.prodRelId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, r.prodRelId)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  r.regDate));   break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, r.regDate));   break;
            default:         orders.add(new OrderSpecifier(Order.DESC, r.regDate));   break;
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdProdRel entity) {
        if (entity.getProdRelId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getProdId()        != null) { update.set(r.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getRelProdId()     != null) { update.set(r.relProdId,     entity.getRelProdId());     hasAny = true; }
        if (entity.getProdRelTypeCd() != null) { update.set(r.prodRelTypeCd, entity.getProdRelTypeCd()); hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(r.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(r.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(r.updBy,         entity.getUpdBy());         hasAny = true; }
        if (entity.getUpdDate()       != null) { update.set(r.updDate,       entity.getUpdDate());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.prodRelId.eq(entity.getProdRelId())).execute();
        return (int) affected;
    }
}
