package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmDiscnt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntRepositoryImpl implements QPmDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmDiscnt d = QPmDiscnt.pmDiscnt;

    /* 할인 키조회 */
    @Override
    public Optional<PmDiscntDto.Item> selectById(String discntId) {
        PmDiscntDto.Item dto = baseQuery()
                .where(d.discntId.eq(discntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 할인 목록조회 */
    @Override
    public List<PmDiscntDto.Item> selectList(PmDiscntDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntDto.Item> query = baseQuery().where(where);
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

    /* 할인 페이지조회 */
    @Override
    public PmDiscntDto.PageResponse selectPageList(PmDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmDiscntDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(d.count())
                .from(d)
                .where(where)
                .fetchOne();

        PmDiscntDto.PageResponse res = new PmDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 할인 baseQuery */
    private JPAQuery<PmDiscntDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntDto.Item.class,
                        d.discntId, d.siteId, d.discntNm,
                        d.discntTypeCd, d.discntTargetCd, d.discntValue,
                        d.minOrderAmt, d.minOrderQty, d.maxDiscntAmt,
                        d.startDate, d.endDate,
                        d.discntStatusCd, d.discntStatusCdBefore,
                        d.discntDesc, d.memGradeCd,
                        d.selfCdivRate, d.sellerCdivRate,
                        d.dvcPcYn, d.dvcMwebYn, d.dvcMappYn,
                        d.useYn, d.regBy, d.regDate, d.updBy, d.updDate
                ))
                .from(d);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanBuilder buildCondition(PmDiscntDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(d.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDiscntId())) w.and(d.discntId.eq(s.getDiscntId()));
        if (StringUtils.hasText(s.getUseYn()))    w.and(d.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",discntNm,")) or.or(d.discntNm.likeIgnoreCase(pattern));
            if (all || types.contains(",discntId,")) or.or(d.discntId.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(s.getDateStart(), fmt);
            LocalDate endDate   = LocalDate.parse(s.getDateEnd(),   fmt);
            LocalDateTime start   = startDate.atStartOfDay();
            LocalDateTime endExcl = endDate.plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(d.regDate.goe(start)).and(d.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(d.updDate.goe(start)).and(d.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(PmDiscntDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, d.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("discntId".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.discntId));
                } else if ("discntNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.discntNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.regDate));
                }
            }
        }
        return orders;
    }

    /* 할인 수정 */
    @Override
    public int updateSelective(PmDiscnt entity) {
        if (entity.getDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(d);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(d.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getDiscntNm()             != null) { update.set(d.discntNm,             entity.getDiscntNm());             hasAny = true; }
        if (entity.getDiscntTypeCd()         != null) { update.set(d.discntTypeCd,         entity.getDiscntTypeCd());         hasAny = true; }
        if (entity.getDiscntTargetCd()       != null) { update.set(d.discntTargetCd,       entity.getDiscntTargetCd());       hasAny = true; }
        if (entity.getDiscntValue()          != null) { update.set(d.discntValue,          entity.getDiscntValue());          hasAny = true; }
        if (entity.getMinOrderAmt()          != null) { update.set(d.minOrderAmt,          entity.getMinOrderAmt());          hasAny = true; }
        if (entity.getMinOrderQty()          != null) { update.set(d.minOrderQty,          entity.getMinOrderQty());          hasAny = true; }
        if (entity.getMaxDiscntAmt()         != null) { update.set(d.maxDiscntAmt,         entity.getMaxDiscntAmt());         hasAny = true; }
        if (entity.getStartDate()            != null) { update.set(d.startDate,            entity.getStartDate());            hasAny = true; }
        if (entity.getEndDate()              != null) { update.set(d.endDate,              entity.getEndDate());              hasAny = true; }
        if (entity.getDiscntStatusCd()       != null) { update.set(d.discntStatusCd,       entity.getDiscntStatusCd());       hasAny = true; }
        if (entity.getDiscntStatusCdBefore() != null) { update.set(d.discntStatusCdBefore, entity.getDiscntStatusCdBefore()); hasAny = true; }
        if (entity.getDiscntDesc()           != null) { update.set(d.discntDesc,           entity.getDiscntDesc());           hasAny = true; }
        if (entity.getMemGradeCd()           != null) { update.set(d.memGradeCd,           entity.getMemGradeCd());           hasAny = true; }
        if (entity.getSelfCdivRate()         != null) { update.set(d.selfCdivRate,         entity.getSelfCdivRate());         hasAny = true; }
        if (entity.getSellerCdivRate()       != null) { update.set(d.sellerCdivRate,       entity.getSellerCdivRate());       hasAny = true; }
        if (entity.getDvcPcYn()              != null) { update.set(d.dvcPcYn,              entity.getDvcPcYn());              hasAny = true; }
        if (entity.getDvcMwebYn()            != null) { update.set(d.dvcMwebYn,            entity.getDvcMwebYn());            hasAny = true; }
        if (entity.getDvcMappYn()            != null) { update.set(d.dvcMappYn,            entity.getDvcMappYn());            hasAny = true; }
        if (entity.getUseYn()                != null) { update.set(d.useYn,                entity.getUseYn());                hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(d.updBy,                entity.getUpdBy());                hasAny = true; }
        if (entity.getUpdDate()              != null) { update.set(d.updDate,              entity.getUpdDate());              hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(d.discntId.eq(entity.getDiscntId())).execute();
        return (int) affected;
    }
}
