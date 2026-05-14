package com.shopjoy.ecadminapi.base.sy.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhApiLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhApiLog;
import com.shopjoy.ecadminapi.base.sy.repository.QSyhApiLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyhApiLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhApiLogRepositoryImpl implements QSyhApiLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhApiLog l   = QSyhApiLog.syhApiLog;
    private static final QSySite    ste = QSySite.sySite;

    private JPAQuery<SyhApiLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhApiLogDto.Item.class,
                        l.logId,
                        l.siteId,
                        l.apiTypeCd,
                        l.apiNm,
                        l.uiNm,
                        l.cmdNm,
                        l.methodCd,
                        l.endpoint,
                        l.reqBody,
                        l.resBody,
                        l.httpStatus,
                        l.resultCd,
                        l.errorMsg,
                        l.elapsedMs,
                        l.refTypeCd,
                        l.refId,
                        l.callDate,
                        l.regBy,
                        l.regDate,
                        l.updBy,
                        l.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId));
    }

    @Override
    public Optional<SyhApiLogDto.Item> selectById(String id) {
        SyhApiLogDto.Item dto = buildBaseQuery()
                .where(l.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyhApiLogDto.Item> selectList(SyhApiLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhApiLogDto.Item> query = buildBaseQuery().where(where);
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
    public SyhApiLogDto.PageResponse selectPageList(SyhApiLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhApiLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhApiLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        SyhApiLogDto.PageResponse res = new SyhApiLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyhApiLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getLogId()))  w.and(l.logId.eq(s.getLogId()));
        if (StringUtils.hasText(s.getTypeCd())) w.and(l.apiTypeCd.eq(s.getTypeCd()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all  = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_apiNm")) or.or(l.apiNm.likeIgnoreCase(pattern));
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
                    w.and(l.regDate.goe(start)).and(l.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(l.updDate.goe(start)).and(l.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhApiLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  l.logId));   break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, l.logId));   break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  l.apiNm));   break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, l.apiNm));   break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  l.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, l.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, l.regDate)); break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyhApiLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(l.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getApiTypeCd()  != null) { update.set(l.apiTypeCd,  entity.getApiTypeCd());  hasAny = true; }
        if (entity.getApiNm()      != null) { update.set(l.apiNm,      entity.getApiNm());      hasAny = true; }
        if (entity.getUiNm()       != null) { update.set(l.uiNm,       entity.getUiNm());       hasAny = true; }
        if (entity.getCmdNm()      != null) { update.set(l.cmdNm,      entity.getCmdNm());      hasAny = true; }
        if (entity.getMethodCd()   != null) { update.set(l.methodCd,   entity.getMethodCd());   hasAny = true; }
        if (entity.getEndpoint()   != null) { update.set(l.endpoint,   entity.getEndpoint());   hasAny = true; }
        if (entity.getReqBody()    != null) { update.set(l.reqBody,    entity.getReqBody());    hasAny = true; }
        if (entity.getResBody()    != null) { update.set(l.resBody,    entity.getResBody());    hasAny = true; }
        if (entity.getHttpStatus() != null) { update.set(l.httpStatus, entity.getHttpStatus()); hasAny = true; }
        if (entity.getResultCd()   != null) { update.set(l.resultCd,   entity.getResultCd());   hasAny = true; }
        if (entity.getErrorMsg()   != null) { update.set(l.errorMsg,   entity.getErrorMsg());   hasAny = true; }
        if (entity.getElapsedMs()  != null) { update.set(l.elapsedMs,  entity.getElapsedMs());  hasAny = true; }
        if (entity.getRefTypeCd()  != null) { update.set(l.refTypeCd,  entity.getRefTypeCd());  hasAny = true; }
        if (entity.getRefId()      != null) { update.set(l.refId,      entity.getRefId());      hasAny = true; }
        if (entity.getCallDate()   != null) { update.set(l.callDate,   entity.getCallDate());   hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(l.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(l.updDate,    entity.getUpdDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(l.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
