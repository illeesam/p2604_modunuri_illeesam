package com.shopjoy.ecadminapi.base.sy.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.repository.QSyTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyTemplate QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyTemplateRepositoryImpl implements QSyTemplateRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyTemplate t = QSyTemplate.syTemplate;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyTemplateDto.Item> selectById(String templateId) {
        SyTemplateDto.Item dto = baseQuery().where(t.templateId.eq(templateId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyTemplateDto.Item> selectList(SyTemplateDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyTemplateDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyTemplateDto.PageResponse selectPageList(SyTemplateDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyTemplateDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyTemplateDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(where).fetchOne();

        SyTemplateDto.PageResponse res = new SyTemplateDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyTemplateDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyTemplateDto.Item.class,
                        t.templateId, t.siteId, t.templateTypeCd, t.templateCode, t.templateNm,
                        t.templateSubject, t.templateContent, t.sampleParams, t.useYn, t.pathId,
                        t.regBy, t.regDate, t.updBy, t.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(t)
                .leftJoin(ste).on(ste.siteId.eq(t.siteId));
    }

    private BooleanBuilder buildCondition(SyTemplateDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))         w.and(t.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getTemplateId()))     w.and(t.templateId.eq(s.getTemplateId()));
        if (StringUtils.hasText(s.getPathId()))         w.and(t.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getTemplateTypeCd())) w.and(t.templateTypeCd.eq(s.getTemplateTypeCd()));
        if (StringUtils.hasText(s.getUseYn()))          w.and(t.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_nm"))   or.or(t.templateNm.likeIgnoreCase(pattern));
            if (all || types.contains("def_code")) or.or(t.templateCode.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(t.regDate.goe(ds.atStartOfDay())).and(t.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(t.updDate.goe(ds.atStartOfDay())).and(t.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyTemplateDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  t.templateId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, t.templateId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  t.templateNm)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, t.templateNm)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  t.regDate));    break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, t.regDate));    break;
            default:         orders.add(new OrderSpecifier(Order.DESC, t.regDate));    break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyTemplate entity) {
        if (entity.getTemplateId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(t.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getTemplateTypeCd()  != null) { update.set(t.templateTypeCd,  entity.getTemplateTypeCd());  hasAny = true; }
        if (entity.getTemplateCode()    != null) { update.set(t.templateCode,    entity.getTemplateCode());    hasAny = true; }
        if (entity.getTemplateNm()      != null) { update.set(t.templateNm,      entity.getTemplateNm());      hasAny = true; }
        if (entity.getTemplateSubject() != null) { update.set(t.templateSubject, entity.getTemplateSubject()); hasAny = true; }
        if (entity.getTemplateContent() != null) { update.set(t.templateContent, entity.getTemplateContent()); hasAny = true; }
        if (entity.getSampleParams()    != null) { update.set(t.sampleParams,    entity.getSampleParams());    hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(t.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(t.updBy,           entity.getUpdBy());           hasAny = true; }
        if (entity.getUpdDate()         != null) { update.set(t.updDate,         entity.getUpdDate());         hasAny = true; }
        if (entity.getPathId()          != null) { update.set(t.pathId,          entity.getPathId());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(t.templateId.eq(entity.getTemplateId())).execute();
        return (int) affected;
    }
}
