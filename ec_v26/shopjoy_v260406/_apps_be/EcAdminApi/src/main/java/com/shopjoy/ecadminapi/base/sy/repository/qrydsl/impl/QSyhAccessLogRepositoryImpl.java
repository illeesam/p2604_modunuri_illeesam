package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
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
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhAccessLogRepositoryImpl";
    private static final QSyhAccessLog syhAccessLog = QSyhAccessLog.syhAccessLog;

    /* baseSelColumnQuery */
    private JPAQuery<SyhAccessLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAccessLogDto.Item.class,
                        syhAccessLog.logId,
                        syhAccessLog.reqMethod,
                        syhAccessLog.reqHost,
                        syhAccessLog.reqPath,
                        syhAccessLog.reqQuery,
                        syhAccessLog.reqIp,
                        syhAccessLog.reqUa,
                        syhAccessLog.appTypeCd,
                        syhAccessLog.userId,
                        syhAccessLog.roleId,
                        syhAccessLog.deptId,
                        syhAccessLog.vendorId,
                        syhAccessLog.localeId,
                        syhAccessLog.respStatus,
                        syhAccessLog.respTimeMs,
                        syhAccessLog.serverNm,
                        syhAccessLog.profile,
                        syhAccessLog.threadNm,
                        syhAccessLog.uiNm,
                        syhAccessLog.cmdNm,
                        syhAccessLog.fileNm,
                        syhAccessLog.funcNm,
                        syhAccessLog.lineNo,
                        syhAccessLog.traceId,
                        syhAccessLog.reqDt,
                        syhAccessLog.regDate
                ))
                .from(syhAccessLog);
    }

    /* 페이지조회 */
    @Override
    public SyhAccessLogDto.PageResponse selectPageData(SyhAccessLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAccessLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndMethod(search),
                baseAndAppTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhAccessLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(syhAccessLog.count())
                .from(syhAccessLog)
                .where(
                baseAndMethod(search),
                baseAndAppTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        SyhAccessLogDto.PageResponse res = new SyhAccessLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* reqMethod 정확 일치 */
    private BooleanExpression baseAndMethod(SyhAccessLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getMethod())
                ? syhAccessLog.reqMethod.eq(search.getMethod()) : null;
    }

    /* appTypeCd 정확 일치 */
    private BooleanExpression baseAndAppTypeCd(SyhAccessLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getAppTypeCd())
                ? syhAccessLog.appTypeCd.eq(search.getAppTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyhAccessLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syhAccessLog.regDate.goe(start).and(syhAccessLog.regDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyhAccessLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",appTypeCd,", syhAccessLog.appTypeCd, pattern);
        or = orLike(or, all, types, ",cmdNm,", syhAccessLog.cmdNm, pattern);
        or = orLike(or, all, types, ",deptId,", syhAccessLog.deptId, pattern);
        or = orLike(or, all, types, ",fileNm,", syhAccessLog.fileNm, pattern);
        or = orLike(or, all, types, ",funcNm,", syhAccessLog.funcNm, pattern);
        or = orLike(or, all, types, ",lineNo,", syhAccessLog.lineNo, pattern);
        or = orLike(or, all, types, ",localeId,", syhAccessLog.localeId, pattern);
        or = orLike(or, all, types, ",logId,", syhAccessLog.logId, pattern);
        or = orLike(or, all, types, ",profile,", syhAccessLog.profile, pattern);
        or = orLike(or, all, types, ",reqBody,", syhAccessLog.reqBody, pattern);
        or = orLike(or, all, types, ",reqHost,", syhAccessLog.reqHost, pattern);
        or = orLike(or, all, types, ",reqIp,", syhAccessLog.reqIp, pattern);
        or = orLike(or, all, types, ",reqMethod,", syhAccessLog.reqMethod, pattern);
        or = orLike(or, all, types, ",reqPath,", syhAccessLog.reqPath, pattern);
        or = orLike(or, all, types, ",reqQuery,", syhAccessLog.reqQuery, pattern);
        or = orLike(or, all, types, ",reqUa,", syhAccessLog.reqUa, pattern);
        or = orLike(or, all, types, ",respBody,", syhAccessLog.respBody, pattern);
        or = orLike(or, all, types, ",roleId,", syhAccessLog.roleId, pattern);
        or = orLike(or, all, types, ",serverNm,", syhAccessLog.serverNm, pattern);
        or = orLike(or, all, types, ",siteId,", syhAccessLog.siteId, pattern);
        or = orLike(or, all, types, ",threadNm,", syhAccessLog.threadNm, pattern);
        or = orLike(or, all, types, ",traceId,", syhAccessLog.traceId, pattern);
        or = orLike(or, all, types, ",uiNm,", syhAccessLog.uiNm, pattern);
        or = orLike(or, all, types, ",userId,", syhAccessLog.userId, pattern);
        or = orLike(or, all, types, ",vendorId,", syhAccessLog.vendorId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
            orders.add(new OrderSpecifier(Order.DESC, syhAccessLog.reqDt));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAccessLog.logId));
            return orders;
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhAccessLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAccessLog.logId));
        }
        return orders;
    }
}
