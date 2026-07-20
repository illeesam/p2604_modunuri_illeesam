package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syhAccessErrorLog.regDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("appTypeCd", syhAccessErrorLog.appTypeCd),
        Map.entry("cmdNm", syhAccessErrorLog.cmdNm),
        Map.entry("deptId", syhAccessErrorLog.deptId),
        Map.entry("errorMsg", syhAccessErrorLog.errorMsg),
        Map.entry("errorType", syhAccessErrorLog.errorType),
        Map.entry("fileNm", syhAccessErrorLog.fileNm),
        Map.entry("funcNm", syhAccessErrorLog.funcNm),
        Map.entry("lineNo", syhAccessErrorLog.lineNo),
        Map.entry("localeId", syhAccessErrorLog.localeId),
        Map.entry("logId", syhAccessErrorLog.logId),
        Map.entry("loggerNm", syhAccessErrorLog.loggerNm),
        Map.entry("profile", syhAccessErrorLog.profile),
        Map.entry("reqHost", syhAccessErrorLog.reqHost),
        Map.entry("reqIp", syhAccessErrorLog.reqIp),
        Map.entry("reqMethod", syhAccessErrorLog.reqMethod),
        Map.entry("reqPath", syhAccessErrorLog.reqPath),
        Map.entry("reqQuery", syhAccessErrorLog.reqQuery),
        Map.entry("reqUa", syhAccessErrorLog.reqUa),
        Map.entry("roleId", syhAccessErrorLog.roleId),
        Map.entry("serverNm", syhAccessErrorLog.serverNm),
        Map.entry("siteId", syhAccessErrorLog.siteId),
        Map.entry("stackTrace", syhAccessErrorLog.stackTrace),
        Map.entry("threadNm", syhAccessErrorLog.threadNm),
        Map.entry("traceId", syhAccessErrorLog.traceId),
        Map.entry("uiNm", syhAccessErrorLog.uiNm),
        Map.entry("userId", syhAccessErrorLog.userId),
        Map.entry("vendorId", syhAccessErrorLog.vendorId)
    );

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
                QdslUtil.strEq(syhAccessErrorLog.reqMethod, search.getMethod()),
                andPathLike(search),
                andUiNmLike(search),
                QdslUtil.strEqTrim(syhAccessErrorLog.traceId, search.getTraceId()),
                QdslUtil.strEq(syhAccessErrorLog.appTypeCd, search.getAppTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
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
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* reqPath LIKE (경로 부분 검색) */
    private BooleanExpression andPathLike(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getPath())
                ? syhAccessErrorLog.reqPath.likeIgnoreCase("%" + search.getPath().trim() + "%") : null;
    }

    /* uiNm LIKE (x-ui-nm 화면명) */
    private BooleanExpression andUiNmLike(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUiNm())
                ? syhAccessErrorLog.uiNm.likeIgnoreCase("%" + search.getUiNm().trim() + "%") : null;
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
