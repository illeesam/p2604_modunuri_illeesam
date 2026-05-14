package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVoc;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVocRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyVoc QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVocRepositoryImpl implements QSyVocRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyVoc v = QSyVoc.syVoc;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyVocDto.Item> selectById(String vocId) {
        SyVocDto.Item dto = baseQuery().where(v.vocId.eq(vocId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyVocDto.Item> selectList(SyVocDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVocDto.Item> query = baseQuery().where(where);
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
    public SyVocDto.PageResponse selectPageList(SyVocDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVocDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyVocDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(v.count()).from(v).where(where).fetchOne();

        SyVocDto.PageResponse res = new SyVocDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyVocDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyVocDto.Item.class,
                        v.vocId, v.siteId, v.vocMasterCd, v.vocDetailCd, v.vocNm, v.vocContent, v.useYn,
                        v.regBy, v.regDate, v.updBy, v.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(v)
                .leftJoin(ste).on(ste.siteId.eq(v.siteId));
    }

    private BooleanBuilder buildCondition(SyVocDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(v.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getVocId()))       w.and(v.vocId.eq(s.getVocId()));
        if (StringUtils.hasText(s.getVocMasterCd())) w.and(v.vocMasterCd.eq(s.getVocMasterCd()));
        if (StringUtils.hasText(s.getVocDetailCd())) w.and(v.vocDetailCd.eq(s.getVocDetailCd()));
        if (StringUtils.hasText(s.getUseYn()))       w.and(v.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_nm")) or.or(v.vocNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(v.regDate.goe(ds.atStartOfDay())).and(v.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(v.updDate.goe(ds.atStartOfDay())).and(v.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyVocDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, v.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  v.vocId));   break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, v.vocId));   break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  v.vocNm));   break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, v.vocNm));   break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  v.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, v.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, v.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyVoc entity) {
        if (entity.getVocId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(v);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(v.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getVocMasterCd() != null) { update.set(v.vocMasterCd, entity.getVocMasterCd()); hasAny = true; }
        if (entity.getVocDetailCd() != null) { update.set(v.vocDetailCd, entity.getVocDetailCd()); hasAny = true; }
        if (entity.getVocNm()       != null) { update.set(v.vocNm,       entity.getVocNm());       hasAny = true; }
        if (entity.getVocContent()  != null) { update.set(v.vocContent,  entity.getVocContent());  hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(v.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(v.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(v.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(v.vocId.eq(entity.getVocId())).execute();
        return (int) affected;
    }
}
