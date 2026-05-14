package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSySiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SySite QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSySiteRepositoryImpl implements QSySiteRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSySite s = QSySite.sySite;
    private static final QSyCode cdSt = new QSyCode("cd_st");
    private static final QSyCode cdSs = new QSyCode("cd_ss");

    private JPAQuery<SySiteDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SySiteDto.Item.class,
                        s.siteId, s.siteCode, s.siteTypeCd, s.siteNm, s.siteDomain,
                        s.logoUrl, s.faviconUrl, s.siteDesc, s.siteEmail, s.sitePhone,
                        s.siteZipCode, s.siteAddress, s.siteBusinessNo, s.siteCeo,
                        s.siteStatusCd, s.configJson,
                        s.regBy, s.regDate, s.updBy, s.updDate, s.pathId,
                        cdSt.codeLabel.as("siteTypeCdNm"),
                        cdSs.codeLabel.as("siteStatusCdNm")
                ))
                .from(s)
                .leftJoin(cdSt).on(cdSt.codeGrp.eq("SITE_TYPE").and(cdSt.codeValue.eq(s.siteTypeCd)))
                .leftJoin(cdSs).on(cdSs.codeGrp.eq("SITE_STATUS").and(cdSs.codeValue.eq(s.siteStatusCd)));
    }

    @Override
    public Optional<SySiteDto.Item> selectById(String siteId) {
        SySiteDto.Item dto = buildBaseQuery()
                .where(s.siteId.eq(siteId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SySiteDto.Item> selectList(SySiteDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SySiteDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SySiteDto.PageResponse selectPageList(SySiteDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SySiteDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SySiteDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(s.count()).from(s).where(where).fetchOne();

        SySiteDto.PageResponse res = new SySiteDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SySiteDto.Request q) {
        BooleanBuilder w = new BooleanBuilder();
        if (q == null) return w;

        if (StringUtils.hasText(q.getSiteId())) w.and(s.siteId.eq(q.getSiteId()));
        if (StringUtils.hasText(q.getPathId())) w.and(s.pathId.eq(q.getPathId()));
        if (StringUtils.hasText(q.getStatus())) w.and(s.siteStatusCd.eq(q.getStatus()));
        if (StringUtils.hasText(q.getTypeCd())) w.and(s.siteTypeCd.eq(q.getTypeCd()));

        if (StringUtils.hasText(q.getSearchValue())) {
            String types = q.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + q.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_id"))   or.or(s.siteId.likeIgnoreCase(pattern));
            if (all || types.contains("def_name")) or.or(s.siteNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(q.getDateType())
                && StringUtils.hasText(q.getDateStart())
                && StringUtils.hasText(q.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(q.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(q.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (q.getDateType()) {
                case "reg_date":
                    w.and(s.regDate.goe(start)).and(s.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(s.updDate.goe(start)).and(s.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SySiteDto.Request q) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = q == null ? null : q.getSort();
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
                if ("siteId".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.siteId));
                } else if ("siteNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.siteNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(SySite entity) {
        if (entity.getSiteId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSiteCode()       != null) { update.set(s.siteCode,       entity.getSiteCode());       hasAny = true; }
        if (entity.getSiteTypeCd()     != null) { update.set(s.siteTypeCd,     entity.getSiteTypeCd());     hasAny = true; }
        if (entity.getSiteNm()         != null) { update.set(s.siteNm,         entity.getSiteNm());         hasAny = true; }
        if (entity.getSiteDomain()     != null) { update.set(s.siteDomain,     entity.getSiteDomain());     hasAny = true; }
        if (entity.getLogoUrl()        != null) { update.set(s.logoUrl,        entity.getLogoUrl());        hasAny = true; }
        if (entity.getFaviconUrl()     != null) { update.set(s.faviconUrl,     entity.getFaviconUrl());     hasAny = true; }
        if (entity.getSiteDesc()       != null) { update.set(s.siteDesc,       entity.getSiteDesc());       hasAny = true; }
        if (entity.getSiteEmail()      != null) { update.set(s.siteEmail,      entity.getSiteEmail());      hasAny = true; }
        if (entity.getSitePhone()      != null) { update.set(s.sitePhone,      entity.getSitePhone());      hasAny = true; }
        if (entity.getSiteZipCode()    != null) { update.set(s.siteZipCode,    entity.getSiteZipCode());    hasAny = true; }
        if (entity.getSiteAddress()    != null) { update.set(s.siteAddress,    entity.getSiteAddress());    hasAny = true; }
        if (entity.getSiteBusinessNo() != null) { update.set(s.siteBusinessNo, entity.getSiteBusinessNo()); hasAny = true; }
        if (entity.getSiteCeo()        != null) { update.set(s.siteCeo,        entity.getSiteCeo());        hasAny = true; }
        if (entity.getSiteStatusCd()   != null) { update.set(s.siteStatusCd,   entity.getSiteStatusCd());   hasAny = true; }
        if (entity.getConfigJson()     != null) { update.set(s.configJson,     entity.getConfigJson());     hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(s.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(s.updDate,        entity.getUpdDate());        hasAny = true; }
        if (entity.getPathId()         != null) { update.set(s.pathId,         entity.getPathId());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.siteId.eq(entity.getSiteId())).execute();
        return (int) affected;
    }
}
