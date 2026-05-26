package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhAccessLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAccessLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
/** SyhAccessLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhAccessLogRepositoryImpl implements QSyhAccessLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhAccessLog l = QSyhAccessLog.syhAccessLog;

    /* buildBaseQuery */
    private JPAQuery<SyhAccessLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhAccessLogDto.Item.class,
                        l.logId,
                        l.reqMethod,
                        l.reqHost,
                        l.reqPath,
                        l.reqQuery,
                        l.reqIp,
                        l.reqUa,
                        l.appTypeCd,
                        l.userId,
                        l.roleId,
                        l.deptId,
                        l.vendorId,
                        l.localeId,
                        l.respStatus,
                        l.respTimeMs,
                        l.serverNm,
                        l.profile,
                        l.threadNm,
                        l.uiNm,
                        l.cmdNm,
                        l.fileNm,
                        l.funcNm,
                        l.lineNo,
                        l.traceId,
                        l.reqDt,
                        l.regDate
                ))
                .from(l);
    }

    /* 페이지조회 */
    @Override
    public SyhAccessLogDto.PageResponse selectPageList(SyhAccessLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAccessLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhAccessLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        SyhAccessLogDto.PageResponse res = new SyhAccessLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanBuilder buildCondition(SyhAccessLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getMethod()))    w.and(l.reqMethod.eq(s.getMethod()));
        if (StringUtils.hasText(s.getStatus())) {
            try { w.and(l.respStatus.eq(Integer.parseInt(s.getStatus()))); } catch (NumberFormatException ignore) {}
        }
        if (StringUtils.hasText(s.getPath()))      w.and(l.reqPath.like("%" + s.getPath() + "%"));
        if (StringUtils.hasText(s.getAppTypeCd())) w.and(l.appTypeCd.eq(s.getAppTypeCd()));
        if (StringUtils.hasText(s.getUiNm()))      w.and(l.uiNm.like("%" + s.getUiNm() + "%"));
        if (StringUtils.hasText(s.getTraceId()))   w.and(l.traceId.like("%" + s.getTraceId() + "%"));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",reqIp,"))  or.or(l.reqIp.like(pattern));
            if (all || types.contains(",userId,")) or.or(l.userId.like(pattern));
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
                default:
                    break;
            }
        }
        /* searchValue LIKE OR — QSyhAccessLog 의 String 필드 (감사필드 제외) */
        if (s != null && StringUtils.hasText(s.getSearchValue())) {
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            or.or(l.appTypeCd.likeIgnoreCase(pattern));
            or.or(l.cmdNm.likeIgnoreCase(pattern));
            or.or(l.deptId.likeIgnoreCase(pattern));
            or.or(l.fileNm.likeIgnoreCase(pattern));
            or.or(l.funcNm.likeIgnoreCase(pattern));
            or.or(l.lineNo.likeIgnoreCase(pattern));
            or.or(l.localeId.likeIgnoreCase(pattern));
            or.or(l.logId.likeIgnoreCase(pattern));
            or.or(l.profile.likeIgnoreCase(pattern));
            or.or(l.reqBody.likeIgnoreCase(pattern));
            or.or(l.reqHost.likeIgnoreCase(pattern));
            or.or(l.reqIp.likeIgnoreCase(pattern));
            or.or(l.reqMethod.likeIgnoreCase(pattern));
            or.or(l.reqPath.likeIgnoreCase(pattern));
            or.or(l.reqQuery.likeIgnoreCase(pattern));
            or.or(l.reqUa.likeIgnoreCase(pattern));
            or.or(l.respBody.likeIgnoreCase(pattern));
            or.or(l.roleId.likeIgnoreCase(pattern));
            or.or(l.serverNm.likeIgnoreCase(pattern));
            or.or(l.siteId.likeIgnoreCase(pattern));
            or.or(l.threadNm.likeIgnoreCase(pattern));
            or.or(l.traceId.likeIgnoreCase(pattern));
            or.or(l.uiNm.likeIgnoreCase(pattern));
            or.or(l.userId.likeIgnoreCase(pattern));
            or.or(l.vendorId.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhAccessLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, l.reqDt));
            /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
            if (orders.isEmpty()) orders.add(new OrderSpecifier<>(Order.DESC, l.regDate));
            return orders;
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        if (orders.isEmpty()) orders.add(new OrderSpecifier<>(Order.DESC, l.regDate));
        return orders;
    }
}
