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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhUserLoginLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyhUserLoginLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhUserLoginLogRepositoryImpl implements QSyhUserLoginLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhUserLoginLogRepositoryImpl";
    private static final QSyhUserLoginLog syhUserLoginLog   = QSyhUserLoginLog.syhUserLoginLog;
    private static final QSySite          sySite = QSySite.sySite;
    private static final QSyUser          syUser = QSyUser.syUser;
    private static final QSyCode          cd_lr = new QSyCode("cd_lr");

    /* 사용자 로그인 로그 baseSelColumnQuery */
    private JPAQuery<SyhUserLoginLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhUserLoginLogDto.Item.class,
                        syhUserLoginLog.logId,
                        syhUserLoginLog.siteId,
                        syhUserLoginLog.userId,
                        syhUserLoginLog.loginId,
                        syhUserLoginLog.loginDate,
                        syhUserLoginLog.resultCd,
                        syhUserLoginLog.failCnt,
                        syhUserLoginLog.ip,
                        syhUserLoginLog.device,
                        syhUserLoginLog.os,
                        syhUserLoginLog.browser,
                        syhUserLoginLog.accessToken,
                        syhUserLoginLog.accessTokenExp,
                        syhUserLoginLog.refreshToken,
                        syhUserLoginLog.refreshTokenExp,
                        syhUserLoginLog.uiNm,
                        syhUserLoginLog.cmdNm,
                        syhUserLoginLog.regBy,
                        syhUserLoginLog.regDate,
                        syhUserLoginLog.updBy,
                        syhUserLoginLog.updDate,
                        sySite.siteNm.as("siteNm"),
                        syUser.userNm.as("userNm"),
                        cd_lr.codeLabel.as("resultCdNm")
                ))
                .from(syhUserLoginLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhUserLoginLog.siteId))
                .leftJoin(syUser).on(syUser.userId.eq(syhUserLoginLog.userId))
                .leftJoin(cd_lr).on(cd_lr.codeGrp.eq("LOGIN_RESULT").and(cd_lr.codeValue.eq(syhUserLoginLog.resultCd)));
    }

    /* 사용자 로그인 로그 키조회 */
    @Override
    public Optional<SyhUserLoginLogDto.Item> selectById(String id) {
        SyhUserLoginLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhUserLoginLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사용자 로그인 로그 목록조회 */
    @Override
    public List<SyhUserLoginLogDto.Item> selectList(SyhUserLoginLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhUserLoginLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndUserId(search),
                baseAndResultCd(search),
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

    /* 사용자 로그인 로그 페이지조회 */
    @Override
    public SyhUserLoginLogDto.PageResponse selectPageData(SyhUserLoginLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndUserId(search),
                baseAndResultCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<SyhUserLoginLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhUserLoginLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(syhUserLoginLog.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt").from(syhUserLoginLog)
                .where(wheres)
                .fetchOne();

        SyhUserLoginLogDto.PageResponse res = new SyhUserLoginLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyhUserLoginLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syhUserLoginLog.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression baseAndLogId(SyhUserLoginLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? syhUserLoginLog.logId.eq(search.getLogId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression baseAndUserId(SyhUserLoginLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? syhUserLoginLog.userId.eq(search.getUserId()) : null;
    }

    /* resultCd 정확 일치 */
    private BooleanExpression baseAndResultCd(SyhUserLoginLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getResultCd())
                ? syhUserLoginLog.resultCd.eq(search.getResultCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyhUserLoginLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syhUserLoginLog.regDate.goe(start).and(syhUserLoginLog.regDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyhUserLoginLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accessToken,", syhUserLoginLog.accessToken, pattern);
        or = orLike(or, all, types, ",authId,", syhUserLoginLog.authId, pattern);
        or = orLike(or, all, types, ",browser,", syhUserLoginLog.browser, pattern);
        or = orLike(or, all, types, ",cmdNm,", syhUserLoginLog.cmdNm, pattern);
        or = orLike(or, all, types, ",device,", syhUserLoginLog.device, pattern);
        or = orLike(or, all, types, ",ip,", syhUserLoginLog.ip, pattern);
        or = orLike(or, all, types, ",logId,", syhUserLoginLog.logId, pattern);
        or = orLike(or, all, types, ",loginId,", syhUserLoginLog.loginId, pattern);
        or = orLike(or, all, types, ",os,", syhUserLoginLog.os, pattern);
        or = orLike(or, all, types, ",refreshToken,", syhUserLoginLog.refreshToken, pattern);
        or = orLike(or, all, types, ",resultCd,", syhUserLoginLog.resultCd, pattern);
        or = orLike(or, all, types, ",siteId,", syhUserLoginLog.siteId, pattern);
        or = orLike(or, all, types, ",uiNm,", syhUserLoginLog.uiNm, pattern);
        or = orLike(or, all, types, ",userId,", syhUserLoginLog.userId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyhUserLoginLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhUserLoginLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhUserLoginLog.logId));
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
                    orders.add(new OrderSpecifier(order, syhUserLoginLog.logId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhUserLoginLog.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhUserLoginLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhUserLoginLog.logId));
        }
        return orders;
    }

    /* 사용자 로그인 로그 수정 */
    @Override
    public int updateSelective(SyhUserLoginLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhUserLoginLog);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(syhUserLoginLog.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getUserId()          != null) { update.set(syhUserLoginLog.userId,          entity.getUserId());          hasAny = true; }
        if (entity.getLoginId()         != null) { update.set(syhUserLoginLog.loginId,         entity.getLoginId());         hasAny = true; }
        if (entity.getLoginDate()       != null) { update.set(syhUserLoginLog.loginDate,       entity.getLoginDate());       hasAny = true; }
        if (entity.getResultCd()        != null) { update.set(syhUserLoginLog.resultCd,        entity.getResultCd());        hasAny = true; }
        if (entity.getFailCnt()         != null) { update.set(syhUserLoginLog.failCnt,         entity.getFailCnt());         hasAny = true; }
        if (entity.getIp()              != null) { update.set(syhUserLoginLog.ip,              entity.getIp());              hasAny = true; }
        if (entity.getDevice()          != null) { update.set(syhUserLoginLog.device,          entity.getDevice());          hasAny = true; }
        if (entity.getOs()              != null) { update.set(syhUserLoginLog.os,              entity.getOs());              hasAny = true; }
        if (entity.getBrowser()         != null) { update.set(syhUserLoginLog.browser,         entity.getBrowser());         hasAny = true; }
        if (entity.getAccessToken()     != null) { update.set(syhUserLoginLog.accessToken,     entity.getAccessToken());     hasAny = true; }
        if (entity.getAccessTokenExp()  != null) { update.set(syhUserLoginLog.accessTokenExp,  entity.getAccessTokenExp());  hasAny = true; }
        if (entity.getRefreshToken()    != null) { update.set(syhUserLoginLog.refreshToken,    entity.getRefreshToken());    hasAny = true; }
        if (entity.getRefreshTokenExp() != null) { update.set(syhUserLoginLog.refreshTokenExp, entity.getRefreshTokenExp()); hasAny = true; }
        if (entity.getUiNm()            != null) { update.set(syhUserLoginLog.uiNm,            entity.getUiNm());            hasAny = true; }
        if (entity.getCmdNm()           != null) { update.set(syhUserLoginLog.cmdNm,           entity.getCmdNm());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(syhUserLoginLog.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhUserLoginLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhUserLoginLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
