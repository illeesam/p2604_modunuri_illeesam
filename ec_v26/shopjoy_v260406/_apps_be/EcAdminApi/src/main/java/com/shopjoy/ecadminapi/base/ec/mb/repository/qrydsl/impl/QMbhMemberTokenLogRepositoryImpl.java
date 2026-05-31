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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbhMemberTokenLogRepository;
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
public class QMbhMemberTokenLogRepositoryImpl implements QMbhMemberTokenLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbhMemberTokenLogRepositoryImpl";
    private static final QMbhMemberTokenLog a    = QMbhMemberTokenLog.mbhMemberTokenLog;
    private static final QSySite            ste  = QSySite.sySite;
    private static final QMbMember          mem  = QMbMember.mbMember;
    private static final QSyCode            cdTa = new QSyCode("cd_ta");
    private static final QSyCode            cdTt = new QSyCode("cd_tt");

    /* baseSelColumnQuery */
    private JPAQuery<MbhMemberTokenLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbhMemberTokenLogDto.Item.class,
                        a.logId, a.siteId, a.memberId, a.loginLogId,
                        a.actionCd, a.tokenTypeCd,
                        a.accessToken, a.tokenExp, a.prevToken, a.refreshToken,
                        a.ip, a.deviceInfo, a.revokeReason, a.accessTokenExp,
                        a.uiNm, a.cmdNm,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm"),
                        mem.memberNm.as("memberNm"),
                        cdTa.codeLabel.as("actionCdNm"),
                        cdTt.codeLabel.as("tokenTypeCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(mem).on(mem.memberId.eq(a.memberId))
                .leftJoin(cdTa).on(cdTa.codeGrp.eq("TOKEN_ACTION").and(cdTa.codeValue.eq(a.actionCd)))
                .leftJoin(cdTt).on(cdTt.codeGrp.eq("TOKEN_TYPE").and(cdTt.codeValue.eq(a.tokenTypeCd)));
    }

    /* 키조회 */
    @Override
    public Optional<MbhMemberTokenLogDto.Item> selectById(String logId) {
        return Optional.ofNullable(baseSelColumnQuery().where(a.logId.eq(logId)).fetchOne());
    }

    /* 목록조회 */
    @Override
    public List<MbhMemberTokenLogDto.Item> selectList(MbhMemberTokenLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbhMemberTokenLogDto.Item> query = baseSelColumnQuery().where(
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

    /* 페이지조회 */
    @Override
    public MbhMemberTokenLogDto.PageResponse selectPageData(MbhMemberTokenLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbhMemberTokenLogDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbhMemberTokenLogDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        MbhMemberTokenLogDto.PageResponse res = new MbhMemberTokenLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "memberId" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(MbhMemberTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression baseAndLogId(MbhMemberTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? a.logId.eq(search.getLogId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(MbhMemberTokenLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(MbhMemberTokenLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accessToken,", a.accessToken, pattern);
        or = orLike(or, all, types, ",actionCd,", a.actionCd, pattern);
        or = orLike(or, all, types, ",authId,", a.authId, pattern);
        or = orLike(or, all, types, ",cmdNm,", a.cmdNm, pattern);
        or = orLike(or, all, types, ",deviceInfo,", a.deviceInfo, pattern);
        or = orLike(or, all, types, ",ip,", a.ip, pattern);
        or = orLike(or, all, types, ",logId,", a.logId, pattern);
        or = orLike(or, all, types, ",loginLogId,", a.loginLogId, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",prevToken,", a.prevToken, pattern);
        or = orLike(or, all, types, ",refreshToken,", a.refreshToken, pattern);
        or = orLike(or, all, types, ",revokeReason,", a.revokeReason, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",tokenTypeCd,", a.tokenTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(MbhMemberTokenLogDto.Request s) {
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

    /* 수정 */


    @Override
    public int updateSelective(MbhMemberTokenLog entity) {
        if (entity.getLogId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;
        if (entity.getSiteId()         != null) { update.set(a.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getAuthId()         != null) { update.set(a.authId,         entity.getAuthId());         hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(a.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getLoginLogId()     != null) { update.set(a.loginLogId,     entity.getLoginLogId());     hasAny = true; }
        if (entity.getActionCd()       != null) { update.set(a.actionCd,       entity.getActionCd());       hasAny = true; }
        if (entity.getTokenTypeCd()    != null) { update.set(a.tokenTypeCd,    entity.getTokenTypeCd());    hasAny = true; }
        if (entity.getAccessToken()    != null) { update.set(a.accessToken,    entity.getAccessToken());    hasAny = true; }
        if (entity.getTokenExp()       != null) { update.set(a.tokenExp,       entity.getTokenExp());       hasAny = true; }
        if (entity.getPrevToken()      != null) { update.set(a.prevToken,      entity.getPrevToken());      hasAny = true; }
        if (entity.getRefreshToken()   != null) { update.set(a.refreshToken,   entity.getRefreshToken());   hasAny = true; }
        if (entity.getIp()             != null) { update.set(a.ip,             entity.getIp());             hasAny = true; }
        if (entity.getDeviceInfo()     != null) { update.set(a.deviceInfo,     entity.getDeviceInfo());     hasAny = true; }
        if (entity.getRevokeReason()   != null) { update.set(a.revokeReason,   entity.getRevokeReason());   hasAny = true; }
        if (entity.getAccessTokenExp() != null) { update.set(a.accessTokenExp, entity.getAccessTokenExp()); hasAny = true; }
        if (entity.getUiNm()           != null) { update.set(a.uiNm,           entity.getUiNm());           hasAny = true; }
        if (entity.getCmdNm()          != null) { update.set(a.cmdNm,          entity.getCmdNm());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(a.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(a.logId.eq(entity.getLogId())).execute();
    }
}
