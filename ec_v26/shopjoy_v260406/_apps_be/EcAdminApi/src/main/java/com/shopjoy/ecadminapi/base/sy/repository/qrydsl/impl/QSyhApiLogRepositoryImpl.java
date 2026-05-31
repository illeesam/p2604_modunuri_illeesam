package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhApiLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhApiLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhApiLogRepository;
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
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhApiLogRepositoryImpl";
    private static final QSyhApiLog a   = QSyhApiLog.syhApiLog;
    private static final QSySite    ste = QSySite.sySite;

    /* API 로그 baseSelColumnQuery */
    private JPAQuery<SyhApiLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhApiLogDto.Item.class,
                        a.logId,
                        a.siteId,
                        a.apiTypeCd,
                        a.apiNm,
                        a.uiNm,
                        a.cmdNm,
                        a.methodCd,
                        a.endpoint,
                        a.reqBody,
                        a.resBody,
                        a.httpStatus,
                        a.resultCd,
                        a.errorMsg,
                        a.elapsedMs,
                        a.refTypeCd,
                        a.refId,
                        a.callDate,
                        a.regBy,
                        a.regDate,
                        a.updBy,
                        a.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId));
    }

    /* API 로그 키조회 */
    @Override
    public Optional<SyhApiLogDto.Item> selectById(String id) {
        SyhApiLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(a.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* API 로그 목록조회 */
    @Override
    public List<SyhApiLogDto.Item> selectList(SyhApiLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhApiLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
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

    /* API 로그 페이지조회 */
    @Override
    public SyhApiLogDto.PageResponse selectPageData(SyhApiLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhApiLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhApiLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        SyhApiLogDto.PageResponse res = new SyhApiLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyhApiLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression baseAndLogId(SyhApiLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? a.logId.eq(search.getLogId()) : null;
    }

    /* apiTypeCd 정확 일치 */
    private BooleanExpression baseAndTypeCd(SyhApiLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? a.apiTypeCd.eq(search.getTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyhApiLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyhApiLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",apiNm,", a.apiNm, pattern);
        or = orLike(or, all, types, ",apiTypeCd,", a.apiTypeCd, pattern);
        or = orLike(or, all, types, ",cmdNm,", a.cmdNm, pattern);
        or = orLike(or, all, types, ",endpoint,", a.endpoint, pattern);
        or = orLike(or, all, types, ",errorMsg,", a.errorMsg, pattern);
        or = orLike(or, all, types, ",logId,", a.logId, pattern);
        or = orLike(or, all, types, ",methodCd,", a.methodCd, pattern);
        or = orLike(or, all, types, ",refId,", a.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", a.refTypeCd, pattern);
        or = orLike(or, all, types, ",reqBody,", a.reqBody, pattern);
        or = orLike(or, all, types, ",resBody,", a.resBody, pattern);
        or = orLike(or, all, types, ",resultCd,", a.resultCd, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",uiNm,", a.uiNm, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyhApiLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.logId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("logId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.logId));
                } else if ("apiNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.apiNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.logId));
        }
        return orders;
    }

    /* API 로그 수정 */
    @Override
    public int updateSelective(SyhApiLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(a.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getApiTypeCd()  != null) { update.set(a.apiTypeCd,  entity.getApiTypeCd());  hasAny = true; }
        if (entity.getApiNm()      != null) { update.set(a.apiNm,      entity.getApiNm());      hasAny = true; }
        if (entity.getUiNm()       != null) { update.set(a.uiNm,       entity.getUiNm());       hasAny = true; }
        if (entity.getCmdNm()      != null) { update.set(a.cmdNm,      entity.getCmdNm());      hasAny = true; }
        if (entity.getMethodCd()   != null) { update.set(a.methodCd,   entity.getMethodCd());   hasAny = true; }
        if (entity.getEndpoint()   != null) { update.set(a.endpoint,   entity.getEndpoint());   hasAny = true; }
        if (entity.getReqBody()    != null) { update.set(a.reqBody,    entity.getReqBody());    hasAny = true; }
        if (entity.getResBody()    != null) { update.set(a.resBody,    entity.getResBody());    hasAny = true; }
        if (entity.getHttpStatus() != null) { update.set(a.httpStatus, entity.getHttpStatus()); hasAny = true; }
        if (entity.getResultCd()   != null) { update.set(a.resultCd,   entity.getResultCd());   hasAny = true; }
        if (entity.getErrorMsg()   != null) { update.set(a.errorMsg,   entity.getErrorMsg());   hasAny = true; }
        if (entity.getElapsedMs()  != null) { update.set(a.elapsedMs,  entity.getElapsedMs());  hasAny = true; }
        if (entity.getRefTypeCd()  != null) { update.set(a.refTypeCd,  entity.getRefTypeCd());  hasAny = true; }
        if (entity.getRefId()      != null) { update.set(a.refId,      entity.getRefId());      hasAny = true; }
        if (entity.getCallDate()   != null) { update.set(a.callDate,   entity.getCallDate());   hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(a.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
