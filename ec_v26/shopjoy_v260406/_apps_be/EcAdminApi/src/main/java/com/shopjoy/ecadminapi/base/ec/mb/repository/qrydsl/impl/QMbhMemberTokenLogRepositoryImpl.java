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
    private static final QMbhMemberTokenLog mbhMemberTokenLog    = QMbhMemberTokenLog.mbhMemberTokenLog;
    private static final QSySite            sySite  = QSySite.sySite;
    private static final QMbMember          mbMember  = QMbMember.mbMember;
    private static final QSyCode            cdTa = new QSyCode("cd_ta");
    private static final QSyCode            cdTt = new QSyCode("cd_tt");

    /* baseSelColumnQuery */
    private JPAQuery<MbhMemberTokenLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbhMemberTokenLogDto.Item.class,
                        mbhMemberTokenLog.logId, mbhMemberTokenLog.siteId, mbhMemberTokenLog.memberId, mbhMemberTokenLog.loginLogId,
                        mbhMemberTokenLog.actionCd, mbhMemberTokenLog.tokenTypeCd,
                        mbhMemberTokenLog.accessToken, mbhMemberTokenLog.tokenExp, mbhMemberTokenLog.prevToken, mbhMemberTokenLog.refreshToken,
                        mbhMemberTokenLog.ip, mbhMemberTokenLog.deviceInfo, mbhMemberTokenLog.revokeReason, mbhMemberTokenLog.accessTokenExp,
                        mbhMemberTokenLog.uiNm, mbhMemberTokenLog.cmdNm,
                        mbhMemberTokenLog.regBy, mbhMemberTokenLog.regDate, mbhMemberTokenLog.updBy, mbhMemberTokenLog.updDate,
                        sySite.siteNm.as("siteNm"),
                        mbMember.memberNm.as("memberNm"),
                        cdTa.codeLabel.as("actionCdNm"),
                        cdTt.codeLabel.as("tokenTypeCdNm")
                ))
                .from(mbhMemberTokenLog)
                .leftJoin(sySite).on(sySite.siteId.eq(mbhMemberTokenLog.siteId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbhMemberTokenLog.memberId))
                .leftJoin(cdTa).on(cdTa.codeGrp.eq("TOKEN_ACTION").and(cdTa.codeValue.eq(mbhMemberTokenLog.actionCd)))
                .leftJoin(cdTt).on(cdTt.codeGrp.eq("TOKEN_TYPE").and(cdTt.codeValue.eq(mbhMemberTokenLog.tokenTypeCd)));
    }

    /* 키조회 */
    @Override
    public Optional<MbhMemberTokenLogDto.Item> selectById(String logId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbhMemberTokenLog.logId.eq(logId)).fetchOne());
    }

    /* 목록조회 */
    @Override
    public List<MbhMemberTokenLogDto.Item> selectList(MbhMemberTokenLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbhMemberTokenLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndLogId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public MbhMemberTokenLogDto.PageResponse selectPageData(MbhMemberTokenLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbhMemberTokenLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbhMemberTokenLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbhMemberTokenLog.count())
                .where(wheres)
                .fetchOne();

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
                ? mbhMemberTokenLog.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression baseAndLogId(MbhMemberTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? mbhMemberTokenLog.logId.eq(search.getLogId()) : null;
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
            case "reg_date": return mbhMemberTokenLog.regDate.goe(start).and(mbhMemberTokenLog.regDate.lt(endExcl));
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
        or = orLike(or, all, types, ",accessToken,", mbhMemberTokenLog.accessToken, pattern);
        or = orLike(or, all, types, ",actionCd,", mbhMemberTokenLog.actionCd, pattern);
        or = orLike(or, all, types, ",authId,", mbhMemberTokenLog.authId, pattern);
        or = orLike(or, all, types, ",cmdNm,", mbhMemberTokenLog.cmdNm, pattern);
        or = orLike(or, all, types, ",deviceInfo,", mbhMemberTokenLog.deviceInfo, pattern);
        or = orLike(or, all, types, ",ip,", mbhMemberTokenLog.ip, pattern);
        or = orLike(or, all, types, ",logId,", mbhMemberTokenLog.logId, pattern);
        or = orLike(or, all, types, ",loginLogId,", mbhMemberTokenLog.loginLogId, pattern);
        or = orLike(or, all, types, ",memberId,", mbhMemberTokenLog.memberId, pattern);
        or = orLike(or, all, types, ",prevToken,", mbhMemberTokenLog.prevToken, pattern);
        or = orLike(or, all, types, ",refreshToken,", mbhMemberTokenLog.refreshToken, pattern);
        or = orLike(or, all, types, ",revokeReason,", mbhMemberTokenLog.revokeReason, pattern);
        or = orLike(or, all, types, ",siteId,", mbhMemberTokenLog.siteId, pattern);
        or = orLike(or, all, types, ",tokenTypeCd,", mbhMemberTokenLog.tokenTypeCd, pattern);
        or = orLike(or, all, types, ",uiNm,", mbhMemberTokenLog.uiNm, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, mbhMemberTokenLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbhMemberTokenLog.logId));
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
                    orders.add(new OrderSpecifier(order, mbhMemberTokenLog.logId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbhMemberTokenLog.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbhMemberTokenLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbhMemberTokenLog.logId));
        }
        return orders;
    }

    /* 수정 */


    @Override
    public int updateSelective(MbhMemberTokenLog entity) {
        if (entity.getLogId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbhMemberTokenLog);
        boolean hasAny = false;
        if (entity.getSiteId()         != null) { update.set(mbhMemberTokenLog.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getAuthId()         != null) { update.set(mbhMemberTokenLog.authId,         entity.getAuthId());         hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(mbhMemberTokenLog.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getLoginLogId()     != null) { update.set(mbhMemberTokenLog.loginLogId,     entity.getLoginLogId());     hasAny = true; }
        if (entity.getActionCd()       != null) { update.set(mbhMemberTokenLog.actionCd,       entity.getActionCd());       hasAny = true; }
        if (entity.getTokenTypeCd()    != null) { update.set(mbhMemberTokenLog.tokenTypeCd,    entity.getTokenTypeCd());    hasAny = true; }
        if (entity.getAccessToken()    != null) { update.set(mbhMemberTokenLog.accessToken,    entity.getAccessToken());    hasAny = true; }
        if (entity.getTokenExp()       != null) { update.set(mbhMemberTokenLog.tokenExp,       entity.getTokenExp());       hasAny = true; }
        if (entity.getPrevToken()      != null) { update.set(mbhMemberTokenLog.prevToken,      entity.getPrevToken());      hasAny = true; }
        if (entity.getRefreshToken()   != null) { update.set(mbhMemberTokenLog.refreshToken,   entity.getRefreshToken());   hasAny = true; }
        if (entity.getIp()             != null) { update.set(mbhMemberTokenLog.ip,             entity.getIp());             hasAny = true; }
        if (entity.getDeviceInfo()     != null) { update.set(mbhMemberTokenLog.deviceInfo,     entity.getDeviceInfo());     hasAny = true; }
        if (entity.getRevokeReason()   != null) { update.set(mbhMemberTokenLog.revokeReason,   entity.getRevokeReason());   hasAny = true; }
        if (entity.getAccessTokenExp() != null) { update.set(mbhMemberTokenLog.accessTokenExp, entity.getAccessTokenExp()); hasAny = true; }
        if (entity.getUiNm()           != null) { update.set(mbhMemberTokenLog.uiNm,           entity.getUiNm());           hasAny = true; }
        if (entity.getCmdNm()          != null) { update.set(mbhMemberTokenLog.cmdNm,          entity.getCmdNm());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(mbhMemberTokenLog.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbhMemberTokenLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbhMemberTokenLog.logId.eq(entity.getLogId())).execute();
    }
}
