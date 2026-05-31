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

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAccessLogDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andMethod(search),
                andAppTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhAccessLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(
                andMethod(search),
                andAppTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
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
    private BooleanExpression andMethod(SyhAccessLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getMethod())
                ? l.reqMethod.eq(search.getMethod()) : null;
    }

    /* appTypeCd 정확 일치 */
    private BooleanExpression andAppTypeCd(SyhAccessLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getAppTypeCd())
                ? l.appTypeCd.eq(search.getAppTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SyhAccessLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return l.regDate.goe(start).and(l.regDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyhAccessLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",appTypeCd,", l.appTypeCd, pattern);
        or = orLike(or, all, types, ",cmdNm,", l.cmdNm, pattern);
        or = orLike(or, all, types, ",deptId,", l.deptId, pattern);
        or = orLike(or, all, types, ",fileNm,", l.fileNm, pattern);
        or = orLike(or, all, types, ",funcNm,", l.funcNm, pattern);
        or = orLike(or, all, types, ",lineNo,", l.lineNo, pattern);
        or = orLike(or, all, types, ",localeId,", l.localeId, pattern);
        or = orLike(or, all, types, ",logId,", l.logId, pattern);
        or = orLike(or, all, types, ",profile,", l.profile, pattern);
        or = orLike(or, all, types, ",reqBody,", l.reqBody, pattern);
        or = orLike(or, all, types, ",reqHost,", l.reqHost, pattern);
        or = orLike(or, all, types, ",reqIp,", l.reqIp, pattern);
        or = orLike(or, all, types, ",reqMethod,", l.reqMethod, pattern);
        or = orLike(or, all, types, ",reqPath,", l.reqPath, pattern);
        or = orLike(or, all, types, ",reqQuery,", l.reqQuery, pattern);
        or = orLike(or, all, types, ",reqUa,", l.reqUa, pattern);
        or = orLike(or, all, types, ",respBody,", l.respBody, pattern);
        or = orLike(or, all, types, ",roleId,", l.roleId, pattern);
        or = orLike(or, all, types, ",serverNm,", l.serverNm, pattern);
        or = orLike(or, all, types, ",siteId,", l.siteId, pattern);
        or = orLike(or, all, types, ",threadNm,", l.threadNm, pattern);
        or = orLike(or, all, types, ",traceId,", l.traceId, pattern);
        or = orLike(or, all, types, ",uiNm,", l.uiNm, pattern);
        or = orLike(or, all, types, ",userId,", l.userId, pattern);
        or = orLike(or, all, types, ",vendorId,", l.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, l.reqDt));
            orders.add(new OrderSpecifier<>(Order.ASC, l.logId));
            return orders;
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.logId));
        }
        return orders;
    }
}
