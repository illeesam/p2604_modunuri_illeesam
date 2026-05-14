package com.shopjoy.ecadminapi.base.sy.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.repository.QSyhBatchLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyhBatchLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhBatchLogRepositoryImpl implements QSyhBatchLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhBatchLog l   = QSyhBatchLog.syhBatchLog;
    private static final QSySite      ste = QSySite.sySite;

    private JPAQuery<SyhBatchLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhBatchLogDto.Item.class,
                        l.batchLogId,
                        l.siteId,
                        l.batchId,
                        l.batchCode,
                        l.batchNm,
                        l.runAt,
                        l.endAt,
                        l.durationMs,
                        l.runStatus,
                        l.procCount,
                        l.errorCount,
                        l.message,
                        l.detail,
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
    public Optional<SyhBatchLogDto.Item> selectById(String id) {
        SyhBatchLogDto.Item dto = buildBaseQuery()
                .where(l.batchLogId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyhBatchLogDto.Item> selectList(SyhBatchLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhBatchLogDto.Item> query = buildBaseQuery().where(where);
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
    public SyhBatchLogDto.PageResponse selectPageList(SyhBatchLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhBatchLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhBatchLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        SyhBatchLogDto.PageResponse res = new SyhBatchLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(SyhBatchLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBatchLogId())) w.and(l.batchLogId.eq(s.getBatchLogId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all  = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_batchNm")) or.or(l.batchNm.likeIgnoreCase(pattern));
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
    private List<OrderSpecifier<?>> buildOrder(SyhBatchLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  l.batchLogId)); break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, l.batchLogId)); break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  l.batchNm));    break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, l.batchNm));    break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  l.regDate));    break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, l.regDate));    break;
            default:         orders.add(new OrderSpecifier(Order.DESC, l.regDate));    break;
        }
        return orders;
    }

    @Override
    public int updateSelective(SyhBatchLog entity) {
        if (entity.getBatchLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(l.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getBatchId()    != null) { update.set(l.batchId,    entity.getBatchId());    hasAny = true; }
        if (entity.getBatchCode()  != null) { update.set(l.batchCode,  entity.getBatchCode());  hasAny = true; }
        if (entity.getBatchNm()    != null) { update.set(l.batchNm,    entity.getBatchNm());    hasAny = true; }
        if (entity.getRunAt()      != null) { update.set(l.runAt,      entity.getRunAt());      hasAny = true; }
        if (entity.getEndAt()      != null) { update.set(l.endAt,      entity.getEndAt());      hasAny = true; }
        if (entity.getDurationMs() != null) { update.set(l.durationMs, entity.getDurationMs()); hasAny = true; }
        if (entity.getRunStatus()  != null) { update.set(l.runStatus,  entity.getRunStatus());  hasAny = true; }
        if (entity.getProcCount()  != null) { update.set(l.procCount,  entity.getProcCount());  hasAny = true; }
        if (entity.getErrorCount() != null) { update.set(l.errorCount, entity.getErrorCount()); hasAny = true; }
        if (entity.getMessage()    != null) { update.set(l.message,    entity.getMessage());    hasAny = true; }
        if (entity.getDetail()     != null) { update.set(l.detail,     entity.getDetail());     hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(l.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(l.updDate,    entity.getUpdDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(l.batchLogId.eq(entity.getBatchLogId())).execute();
        return (int) affected;
    }
}
