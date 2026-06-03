package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbhMemberLoginLog;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbhMemberLoginLogRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QMbhMemberLoginLogRepositoryImpl implements QMbhMemberLoginLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbhMemberLoginLogRepositoryImpl";
    private static final QMbhMemberLoginLog mbhMemberLoginLog    = QMbhMemberLoginLog.mbhMemberLoginLog;
    private static final QSySite            sySite  = QSySite.sySite;
    private static final QMbMember          mbMember  = QMbMember.mbMember;
    private static final QSyCode            cdLr = new QSyCode("cd_lr");

    /* 회원 로그인 로그 baseSelColumnQuery */
    private JPAQuery<MbhMemberLoginLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbhMemberLoginLogDto.Item.class,
                        mbhMemberLoginLog.logId, mbhMemberLoginLog.siteId, mbhMemberLoginLog.memberId, mbhMemberLoginLog.loginId, mbhMemberLoginLog.loginDate,
                        mbhMemberLoginLog.resultCd, mbhMemberLoginLog.failCnt, mbhMemberLoginLog.ip, mbhMemberLoginLog.device, mbhMemberLoginLog.os, mbhMemberLoginLog.browser, mbhMemberLoginLog.country,
                        mbhMemberLoginLog.accessToken, mbhMemberLoginLog.accessTokenExp, mbhMemberLoginLog.refreshToken, mbhMemberLoginLog.refreshTokenExp,
                        mbhMemberLoginLog.uiNm, mbhMemberLoginLog.cmdNm,
                        mbhMemberLoginLog.regBy, mbhMemberLoginLog.regDate, mbhMemberLoginLog.updBy, mbhMemberLoginLog.updDate,
                        sySite.siteNm.as("siteNm"),
                        mbMember.memberNm.as("memberNm")
                ))
                .from(mbhMemberLoginLog)
                .leftJoin(sySite).on(sySite.siteId.eq(mbhMemberLoginLog.siteId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbhMemberLoginLog.memberId))
                .leftJoin(cdLr).on(cdLr.codeGrp.eq("LOGIN_RESULT").and(cdLr.codeValue.eq(mbhMemberLoginLog.resultCd)));
    }

    /* 회원 로그인 로그 키조회 */
    @Override
    public Optional<MbhMemberLoginLogDto.Item> selectById(String logId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbhMemberLoginLog.logId.eq(logId)).fetchOne());
    }

    /* 회원 로그인 로그 목록조회 */
    @Override
    public List<MbhMemberLoginLogDto.Item> selectList(MbhMemberLoginLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbhMemberLoginLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndLogId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 회원 로그인 로그 페이지조회 */
    @Override
    public MbhMemberLoginLogDto.PageResponse selectPageData(MbhMemberLoginLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<MbhMemberLoginLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbhMemberLoginLogDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory
                .select(mbhMemberLoginLog.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .from(mbhMemberLoginLog)
                .where(wheres)
                .fetchOne();

        MbhMemberLoginLogDto.PageResponse res = new MbhMemberLoginLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "memberId,loginId" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(MbhMemberLoginLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? mbhMemberLoginLog.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression baseAndLogId(MbhMemberLoginLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? mbhMemberLoginLog.logId.eq(search.getLogId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(MbhMemberLoginLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return mbhMemberLoginLog.regDate.goe(start).and(mbhMemberLoginLog.regDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(MbhMemberLoginLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accessToken,", mbhMemberLoginLog.accessToken, pattern);
        or = orLike(or, all, types, ",authId,", mbhMemberLoginLog.authId, pattern);
        or = orLike(or, all, types, ",browser,", mbhMemberLoginLog.browser, pattern);
        or = orLike(or, all, types, ",cmdNm,", mbhMemberLoginLog.cmdNm, pattern);
        or = orLike(or, all, types, ",country,", mbhMemberLoginLog.country, pattern);
        or = orLike(or, all, types, ",device,", mbhMemberLoginLog.device, pattern);
        or = orLike(or, all, types, ",ip,", mbhMemberLoginLog.ip, pattern);
        or = orLike(or, all, types, ",logId,", mbhMemberLoginLog.logId, pattern);
        or = orLike(or, all, types, ",loginId,", mbhMemberLoginLog.loginId, pattern);
        or = orLike(or, all, types, ",memberId,", mbhMemberLoginLog.memberId, pattern);
        or = orLike(or, all, types, ",os,", mbhMemberLoginLog.os, pattern);
        or = orLike(or, all, types, ",refreshToken,", mbhMemberLoginLog.refreshToken, pattern);
        or = orLike(or, all, types, ",resultCd,", mbhMemberLoginLog.resultCd, pattern);
        or = orLike(or, all, types, ",siteId,", mbhMemberLoginLog.siteId, pattern);
        or = orLike(or, all, types, ",uiNm,", mbhMemberLoginLog.uiNm, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(MbhMemberLoginLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbhMemberLoginLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbhMemberLoginLog.logId));
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
                    orders.add(new OrderSpecifier(order, mbhMemberLoginLog.logId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbhMemberLoginLog.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbhMemberLoginLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbhMemberLoginLog.logId));
        }
        return orders;
    }

    /* 회원 로그인 로그 수정 */


    @Override
    public int updateSelective(MbhMemberLoginLog entity) {
        if (entity.getLogId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbhMemberLoginLog);
        boolean hasAny = false;
        if (entity.getSiteId()          != null) { update.set(mbhMemberLoginLog.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getAuthId()          != null) { update.set(mbhMemberLoginLog.authId,          entity.getAuthId());          hasAny = true; }
        if (entity.getMemberId()        != null) { update.set(mbhMemberLoginLog.memberId,        entity.getMemberId());        hasAny = true; }
        if (entity.getLoginId()         != null) { update.set(mbhMemberLoginLog.loginId,         entity.getLoginId());         hasAny = true; }
        if (entity.getLoginDate()       != null) { update.set(mbhMemberLoginLog.loginDate,       entity.getLoginDate());       hasAny = true; }
        if (entity.getResultCd()        != null) { update.set(mbhMemberLoginLog.resultCd,        entity.getResultCd());        hasAny = true; }
        if (entity.getFailCnt()         != null) { update.set(mbhMemberLoginLog.failCnt,         entity.getFailCnt());         hasAny = true; }
        if (entity.getIp()              != null) { update.set(mbhMemberLoginLog.ip,              entity.getIp());              hasAny = true; }
        if (entity.getDevice()          != null) { update.set(mbhMemberLoginLog.device,          entity.getDevice());          hasAny = true; }
        if (entity.getOs()              != null) { update.set(mbhMemberLoginLog.os,              entity.getOs());              hasAny = true; }
        if (entity.getBrowser()         != null) { update.set(mbhMemberLoginLog.browser,         entity.getBrowser());         hasAny = true; }
        if (entity.getCountry()         != null) { update.set(mbhMemberLoginLog.country,         entity.getCountry());         hasAny = true; }
        if (entity.getAccessToken()     != null) { update.set(mbhMemberLoginLog.accessToken,     entity.getAccessToken());     hasAny = true; }
        if (entity.getAccessTokenExp()  != null) { update.set(mbhMemberLoginLog.accessTokenExp,  entity.getAccessTokenExp());  hasAny = true; }
        if (entity.getRefreshToken()    != null) { update.set(mbhMemberLoginLog.refreshToken,    entity.getRefreshToken());    hasAny = true; }
        if (entity.getRefreshTokenExp() != null) { update.set(mbhMemberLoginLog.refreshTokenExp, entity.getRefreshTokenExp()); hasAny = true; }
        if (entity.getUiNm()            != null) { update.set(mbhMemberLoginLog.uiNm,            entity.getUiNm());            hasAny = true; }
        if (entity.getCmdNm()           != null) { update.set(mbhMemberLoginLog.cmdNm,           entity.getCmdNm());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(mbhMemberLoginLog.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbhMemberLoginLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbhMemberLoginLog.logId.eq(entity.getLogId())).execute();
    }
}
