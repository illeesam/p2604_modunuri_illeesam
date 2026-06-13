package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhAccessErrorLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAccessErrorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyhAccessErrorLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhAccessErrorLogRepositoryImpl implements QSyhAccessErrorLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhAccessErrorLogRepositoryImpl";
    private static final QSyhAccessErrorLog syhAccessErrorLog = QSyhAccessErrorLog.syhAccessErrorLog;
    private static final QSySite   sySite   = QSySite.sySite;
    private static final QSyUser   syUser   = QSyUser.syUser;
    private static final QSyRole   syRole   = QSyRole.syRole;
    private static final QSyDept   syDept   = QSyDept.syDept;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyCode   cd_at    = new QSyCode("cd_at");

    /* baseSelColumnQuery — list/page/byId 공유 프로젝션 (코드명/연관명 조인 포함 풀필드) */
    private JPAQuery<SyhAccessErrorLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAccessErrorLogDto.Item.class,
                        syhAccessErrorLog.logId,
                        syhAccessErrorLog.siteId,
                        syhAccessErrorLog.reqMethod,
                        syhAccessErrorLog.reqHost,
                        syhAccessErrorLog.reqPath,
                        syhAccessErrorLog.reqQuery,
                        syhAccessErrorLog.reqIp,
                        syhAccessErrorLog.reqUa,
                        syhAccessErrorLog.appTypeCd,
                        syhAccessErrorLog.userId,
                        syhAccessErrorLog.roleId,
                        syhAccessErrorLog.deptId,
                        syhAccessErrorLog.vendorId,
                        syhAccessErrorLog.localeId,
                        syhAccessErrorLog.respTimeMs,
                        syhAccessErrorLog.errorType,
                        syhAccessErrorLog.errorMsg,
                        syhAccessErrorLog.stackTrace,
                        syhAccessErrorLog.uiNm,
                        syhAccessErrorLog.cmdNm,
                        syhAccessErrorLog.fileNm,
                        syhAccessErrorLog.funcNm,
                        syhAccessErrorLog.lineNo,
                        syhAccessErrorLog.traceId,
                        syhAccessErrorLog.serverNm,
                        syhAccessErrorLog.profile,
                        syhAccessErrorLog.threadNm,
                        syhAccessErrorLog.loggerNm,
                        syhAccessErrorLog.logDt,
                        syhAccessErrorLog.regDate,
                        sySite.siteNm.as("siteNm"),
                        cd_at.codeLabel.as("appTypeCdNm"),
                        syUser.userNm.as("userNm"),
                        syRole.roleNm.as("roleNm"),
                        syDept.deptNm.as("deptNm"),
                        syVendor.vendorNm.as("vendorNm")
                ))
                .from(syhAccessErrorLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhAccessErrorLog.siteId))
                .leftJoin(syUser).on(syUser.userId.eq(syhAccessErrorLog.userId))
                .leftJoin(syRole).on(syRole.roleId.eq(syhAccessErrorLog.roleId))
                .leftJoin(syDept).on(syDept.deptId.eq(syhAccessErrorLog.deptId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(syhAccessErrorLog.vendorId))
                .leftJoin(cd_at).on(cd_at.codeGrp.eq("APP_TYPE").and(cd_at.codeValue.eq(syhAccessErrorLog.appTypeCd)));
    }

    /* 단건 상세조회 (코드명/연관명 조인 포함 풀필드 — baseSelColumnQuery 공유) */
    @Override
    public Optional<SyhAccessErrorLogDto.Item> selectById(String id) {
        SyhAccessErrorLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhAccessErrorLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 페이지조회 */
    @Override
    public SyhAccessErrorLogDto.PageResponse selectPageData(SyhAccessErrorLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndMethod(search),
                baseAndPath(search),
                baseAndUiNm(search),
                baseAndTraceId(search),
                baseAndAppTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhAccessErrorLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhAccessErrorLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhAccessErrorLog.count())
                .where(wheres)
                .fetchOne();

        SyhAccessErrorLogDto.PageResponse res = new SyhAccessErrorLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* reqMethod 정확 일치 */
    private BooleanExpression baseAndMethod(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getMethod())
                ? syhAccessErrorLog.reqMethod.eq(search.getMethod()) : null;
    }

    /* reqPath LIKE (경로 부분 검색) */
    private BooleanExpression baseAndPath(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getPath())
                ? syhAccessErrorLog.reqPath.likeIgnoreCase("%" + search.getPath().trim() + "%") : null;
    }

    /* uiNm LIKE (x-ui-nm 화면명) */
    private BooleanExpression baseAndUiNm(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUiNm())
                ? syhAccessErrorLog.uiNm.likeIgnoreCase("%" + search.getUiNm().trim() + "%") : null;
    }

    /* traceId 정확 일치 */
    private BooleanExpression baseAndTraceId(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTraceId())
                ? syhAccessErrorLog.traceId.eq(search.getTraceId().trim()) : null;
    }

    /* appTypeCd 정확 일치 */
    private BooleanExpression baseAndAppTypeCd(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getAppTypeCd())
                ? syhAccessErrorLog.appTypeCd.eq(search.getAppTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyhAccessErrorLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syhAccessErrorLog.regDate.goe(start).and(syhAccessErrorLog.regDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyhAccessErrorLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",appTypeCd,", syhAccessErrorLog.appTypeCd, pattern);
        or = orLike(or, all, types, ",cmdNm,", syhAccessErrorLog.cmdNm, pattern);
        or = orLike(or, all, types, ",deptId,", syhAccessErrorLog.deptId, pattern);
        or = orLike(or, all, types, ",errorMsg,", syhAccessErrorLog.errorMsg, pattern);
        or = orLike(or, all, types, ",errorType,", syhAccessErrorLog.errorType, pattern);
        or = orLike(or, all, types, ",fileNm,", syhAccessErrorLog.fileNm, pattern);
        or = orLike(or, all, types, ",funcNm,", syhAccessErrorLog.funcNm, pattern);
        or = orLike(or, all, types, ",lineNo,", syhAccessErrorLog.lineNo, pattern);
        or = orLike(or, all, types, ",localeId,", syhAccessErrorLog.localeId, pattern);
        or = orLike(or, all, types, ",logId,", syhAccessErrorLog.logId, pattern);
        or = orLike(or, all, types, ",loggerNm,", syhAccessErrorLog.loggerNm, pattern);
        or = orLike(or, all, types, ",profile,", syhAccessErrorLog.profile, pattern);
        or = orLike(or, all, types, ",reqHost,", syhAccessErrorLog.reqHost, pattern);
        or = orLike(or, all, types, ",reqIp,", syhAccessErrorLog.reqIp, pattern);
        or = orLike(or, all, types, ",reqMethod,", syhAccessErrorLog.reqMethod, pattern);
        or = orLike(or, all, types, ",reqPath,", syhAccessErrorLog.reqPath, pattern);
        or = orLike(or, all, types, ",reqQuery,", syhAccessErrorLog.reqQuery, pattern);
        or = orLike(or, all, types, ",reqUa,", syhAccessErrorLog.reqUa, pattern);
        or = orLike(or, all, types, ",roleId,", syhAccessErrorLog.roleId, pattern);
        or = orLike(or, all, types, ",serverNm,", syhAccessErrorLog.serverNm, pattern);
        or = orLike(or, all, types, ",siteId,", syhAccessErrorLog.siteId, pattern);
        or = orLike(or, all, types, ",stackTrace,", syhAccessErrorLog.stackTrace, pattern);
        or = orLike(or, all, types, ",threadNm,", syhAccessErrorLog.threadNm, pattern);
        or = orLike(or, all, types, ",traceId,", syhAccessErrorLog.traceId, pattern);
        or = orLike(or, all, types, ",uiNm,", syhAccessErrorLog.uiNm, pattern);
        or = orLike(or, all, types, ",userId,", syhAccessErrorLog.userId, pattern);
        or = orLike(or, all, types, ",vendorId,", syhAccessErrorLog.vendorId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyhAccessErrorLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhAccessErrorLog.logDt));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAccessErrorLog.logId));
            return orders;
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhAccessErrorLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAccessErrorLog.logId));
        }
        return orders;
    }
}
