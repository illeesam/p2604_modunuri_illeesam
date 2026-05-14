package com.shopjoy.ecadminapi.base.ec.pm.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCache;
import com.shopjoy.ecadminapi.base.ec.pm.repository.QPmCacheRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmCache QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCacheRepositoryImpl implements QPmCacheRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmCache c    = QPmCache.pmCache;
    private static final QSySite  ste  = QSySite.sySite;
    private static final QSyCode  cdCt = new QSyCode("cd_ct");

    @Override
    public Optional<PmCacheDto.Item> selectById(String cacheId) {
        PmCacheDto.Item dto = baseQuery()
                .where(c.cacheId.eq(cacheId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmCacheDto.Item> selectList(PmCacheDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCacheDto.Item> query = baseQuery().where(where);
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
    public PmCacheDto.PageResponse selectPageList(PmCacheDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCacheDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCacheDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(where)
                .fetchOne();

        PmCacheDto.PageResponse res = new PmCacheDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PmCacheDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmCacheDto.Item.class,
                        c.cacheId, c.siteId, c.memberId, c.memberNm,
                        c.cacheTypeCd, c.cacheAmt, c.balanceAmt,
                        c.refId, c.cacheDesc, c.procUserId,
                        c.cacheDate, c.expireDate,
                        c.regBy, c.regDate, c.updBy, c.updDate
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CACHE_TYPE").and(cdCt.codeValue.eq(c.cacheTypeCd)));
    }

    private BooleanBuilder buildCondition(PmCacheDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCacheId()))  w.and(c.cacheId.eq(s.getCacheId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_member_nm")) or.or(c.memberNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

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

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmCacheDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  c.cacheId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, c.cacheId));  break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  c.memberNm)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, c.memberNm)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  c.regDate));  break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, c.regDate));  break;
            default:         orders.add(new OrderSpecifier(Order.DESC, c.regDate));  break;
        }
        return orders;
    }

    @Override
    public int updateSelective(PmCache entity) {
        if (entity.getCacheId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(c.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getMemberId()    != null) { update.set(c.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getMemberNm()    != null) { update.set(c.memberNm,    entity.getMemberNm());    hasAny = true; }
        if (entity.getCacheTypeCd() != null) { update.set(c.cacheTypeCd, entity.getCacheTypeCd()); hasAny = true; }
        if (entity.getCacheAmt()    != null) { update.set(c.cacheAmt,    entity.getCacheAmt());    hasAny = true; }
        if (entity.getBalanceAmt()  != null) { update.set(c.balanceAmt,  entity.getBalanceAmt());  hasAny = true; }
        if (entity.getRefId()       != null) { update.set(c.refId,       entity.getRefId());       hasAny = true; }
        if (entity.getCacheDesc()   != null) { update.set(c.cacheDesc,   entity.getCacheDesc());   hasAny = true; }
        if (entity.getProcUserId()  != null) { update.set(c.procUserId,  entity.getProcUserId());  hasAny = true; }
        if (entity.getCacheDate()   != null) { update.set(c.cacheDate,   entity.getCacheDate());   hasAny = true; }
        if (entity.getExpireDate()  != null) { update.set(c.expireDate,  entity.getExpireDate());  hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(c.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(c.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.cacheId.eq(entity.getCacheId())).execute();
        return (int) affected;
    }
}
