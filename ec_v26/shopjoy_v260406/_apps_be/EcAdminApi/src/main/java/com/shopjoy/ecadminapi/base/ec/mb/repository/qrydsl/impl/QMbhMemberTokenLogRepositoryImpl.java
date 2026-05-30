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
    private static final QMbhMemberTokenLog l    = QMbhMemberTokenLog.mbhMemberTokenLog;
    private static final QSySite            ste  = QSySite.sySite;
    private static final QMbMember          mem  = QMbMember.mbMember;
    private static final QSyCode            cdTa = new QSyCode("cd_ta");
    private static final QSyCode            cdTt = new QSyCode("cd_tt");

    /* 키조회 */
    @Override
    public Optional<MbhMemberTokenLogDto.Item> selectById(String logId) {
        return Optional.ofNullable(baseQuery().where(l.logId.eq(logId)).fetchOne());
    }

    /* 목록조회 */
    @Override
    public List<MbhMemberTokenLogDto.Item> selectList(MbhMemberTokenLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbhMemberTokenLogDto.Item> query = baseQuery().where(
                andSiteId(search),
                andLogId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public MbhMemberTokenLogDto.PageResponse selectPageList(MbhMemberTokenLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbhMemberTokenLogDto.Item> query = baseQuery().where(
                andSiteId(search),
                andLogId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbhMemberTokenLogDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(l.count()).from(l).where(
                andSiteId(search),
                andLogId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        MbhMemberTokenLogDto.PageResponse res = new MbhMemberTokenLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* baseQuery */
    private JPAQuery<MbhMemberTokenLogDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbhMemberTokenLogDto.Item.class,
                        l.logId, l.siteId, l.memberId, l.loginLogId,
                        l.actionCd, l.tokenTypeCd,
                        l.accessToken, l.tokenExp, l.prevToken, l.refreshToken,
                        l.ip, l.deviceInfo, l.revokeReason, l.accessTokenExp,
                        l.uiNm, l.cmdNm,
                        l.regBy, l.regDate, l.updBy, l.updDate,
                        ste.siteNm.as("siteNm"),
                        mem.memberNm.as("memberNm"),
                        cdTa.codeLabel.as("actionCdNm"),
                        cdTt.codeLabel.as("tokenTypeCdNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(mem).on(mem.memberId.eq(l.memberId))
                .leftJoin(cdTa).on(cdTa.codeGrp.eq("TOKEN_ACTION").and(cdTa.codeValue.eq(l.actionCd)))
                .leftJoin(cdTt).on(cdTt.codeGrp.eq("TOKEN_TYPE").and(cdTt.codeValue.eq(l.tokenTypeCd)));
    }

    /* searchType 사용 예  searchType = "memberId" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(MbhMemberTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? l.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression andLogId(MbhMemberTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? l.logId.eq(search.getLogId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(MbhMemberTokenLogDto.Request search) {
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
    private BooleanExpression andSearchValue(MbhMemberTokenLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accessToken,", l.accessToken, pattern);
        or = orLike(or, all, types, ",actionCd,", l.actionCd, pattern);
        or = orLike(or, all, types, ",authId,", l.authId, pattern);
        or = orLike(or, all, types, ",cmdNm,", l.cmdNm, pattern);
        or = orLike(or, all, types, ",deviceInfo,", l.deviceInfo, pattern);
        or = orLike(or, all, types, ",ip,", l.ip, pattern);
        or = orLike(or, all, types, ",logId,", l.logId, pattern);
        or = orLike(or, all, types, ",loginLogId,", l.loginLogId, pattern);
        or = orLike(or, all, types, ",memberId,", l.memberId, pattern);
        or = orLike(or, all, types, ",prevToken,", l.prevToken, pattern);
        or = orLike(or, all, types, ",refreshToken,", l.refreshToken, pattern);
        or = orLike(or, all, types, ",revokeReason,", l.revokeReason, pattern);
        or = orLike(or, all, types, ",siteId,", l.siteId, pattern);
        or = orLike(or, all, types, ",tokenTypeCd,", l.tokenTypeCd, pattern);
        or = orLike(or, all, types, ",uiNm,", l.uiNm, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.logId));
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
                    orders.add(new OrderSpecifier(order, l.logId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.logId));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(MbhMemberTokenLog entity) {
        if (entity.getLogId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;
        if (entity.getSiteId()         != null) { update.set(l.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getAuthId()         != null) { update.set(l.authId,         entity.getAuthId());         hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(l.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getLoginLogId()     != null) { update.set(l.loginLogId,     entity.getLoginLogId());     hasAny = true; }
        if (entity.getActionCd()       != null) { update.set(l.actionCd,       entity.getActionCd());       hasAny = true; }
        if (entity.getTokenTypeCd()    != null) { update.set(l.tokenTypeCd,    entity.getTokenTypeCd());    hasAny = true; }
        if (entity.getAccessToken()    != null) { update.set(l.accessToken,    entity.getAccessToken());    hasAny = true; }
        if (entity.getTokenExp()       != null) { update.set(l.tokenExp,       entity.getTokenExp());       hasAny = true; }
        if (entity.getPrevToken()      != null) { update.set(l.prevToken,      entity.getPrevToken());      hasAny = true; }
        if (entity.getRefreshToken()   != null) { update.set(l.refreshToken,   entity.getRefreshToken());   hasAny = true; }
        if (entity.getIp()             != null) { update.set(l.ip,             entity.getIp());             hasAny = true; }
        if (entity.getDeviceInfo()     != null) { update.set(l.deviceInfo,     entity.getDeviceInfo());     hasAny = true; }
        if (entity.getRevokeReason()   != null) { update.set(l.revokeReason,   entity.getRevokeReason());   hasAny = true; }
        if (entity.getAccessTokenExp() != null) { update.set(l.accessTokenExp, entity.getAccessTokenExp()); hasAny = true; }
        if (entity.getUiNm()           != null) { update.set(l.uiNm,           entity.getUiNm());           hasAny = true; }
        if (entity.getCmdNm()          != null) { update.set(l.cmdNm,          entity.getCmdNm());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(l.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(l.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(l.logId.eq(entity.getLogId())).execute();
    }
}
