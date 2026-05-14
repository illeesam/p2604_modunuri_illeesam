package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyCode QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyCodeRepositoryImpl implements QSyCodeRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyCode c = QSyCode.syCode;
    private static final QSySite ste = QSySite.sySite;

    private JPAQuery<SyCodeDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyCodeDto.Item.class,
                        c.codeId, c.siteId, c.codeGrp, c.codeValue, c.codeLabel,
                        c.sortOrd, c.useYn, c.parentCodeValue, c.childCodeValues,
                        c.codeRemark, c.codeLevel, c.codeOpt1,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId));
    }

    @Override
    public Optional<SyCodeDto.Item> selectById(String codeId) {
        SyCodeDto.Item dto = buildBaseQuery()
                .where(c.codeId.eq(codeId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyCodeDto.Item> selectList(SyCodeDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyCodeDto.Item> query = buildBaseQuery().where(where);
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
    public SyCodeDto.PageResponse selectPageList(SyCodeDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyCodeDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyCodeDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(c.count()).from(c).where(where).fetchOne();

        SyCodeDto.PageResponse res = new SyCodeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyCodeDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))          w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCodeId()))          w.and(c.codeId.eq(s.getCodeId()));
        if (StringUtils.hasText(s.getCodeGrp()))         w.and(c.codeGrp.eq(s.getCodeGrp()));
        if (StringUtils.hasText(s.getCodeValue()))       w.and(c.codeValue.eq(s.getCodeValue()));
        if (StringUtils.hasText(s.getParentCodeValue())) w.and(c.parentCodeValue.eq(s.getParentCodeValue()));
        if (StringUtils.hasText(s.getUseYn()))           w.and(c.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_label")) or.or(c.codeLabel.likeIgnoreCase(pattern));
            if (all || types.contains("def_value")) or.or(c.codeValue.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyCodeDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            // 기본 정렬: sort_ord ASC (NULLS LAST), code_id ASC
            orders.add(new OrderSpecifier(Order.ASC, c.sortOrd).nullsLast());
            orders.add(new OrderSpecifier(Order.ASC, c.codeId));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  c.codeId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, c.codeId));  break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  c.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, c.regDate)); break;
            default:
                orders.add(new OrderSpecifier(Order.ASC, c.sortOrd).nullsLast());
                orders.add(new OrderSpecifier(Order.ASC, c.codeId));
                break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyCode entity) {
        if (entity.getCodeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(c.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getCodeGrp()         != null) { update.set(c.codeGrp,         entity.getCodeGrp());         hasAny = true; }
        if (entity.getCodeValue()       != null) { update.set(c.codeValue,       entity.getCodeValue());       hasAny = true; }
        if (entity.getCodeLabel()       != null) { update.set(c.codeLabel,       entity.getCodeLabel());       hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(c.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(c.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getParentCodeValue() != null) { update.set(c.parentCodeValue, entity.getParentCodeValue()); hasAny = true; }
        if (entity.getChildCodeValues() != null) { update.set(c.childCodeValues, entity.getChildCodeValues()); hasAny = true; }
        if (entity.getCodeRemark()      != null) { update.set(c.codeRemark,      entity.getCodeRemark());      hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(c.updBy,           entity.getUpdBy());           hasAny = true; }
        if (entity.getUpdDate()         != null) { update.set(c.updDate,         entity.getUpdDate());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.codeId.eq(entity.getCodeId())).execute();
        return (int) affected;
    }
}
