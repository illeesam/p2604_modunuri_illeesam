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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhUserTokenLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyhUserTokenLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhUserTokenLogRepositoryImpl implements QSyhUserTokenLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhUserTokenLogRepositoryImpl";
    private static final QSyhUserTokenLog syhUserTokenLog   = QSyhUserTokenLog.syhUserTokenLog;
    private static final QSySite          sySite = QSySite.sySite;
    private static final QSyUser          syUser = QSyUser.syUser;
    private static final QSyCode          cd_ta = new QSyCode("cd_ta");
    private static final QSyCode          cd_tt = new QSyCode("cd_tt");

    /* baseSelColumnQuery */
    private JPAQuery<SyhUserTokenLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhUserTokenLogDto.Item.class,
                        syhUserTokenLog.logId,
                        syhUserTokenLog.siteId,
                        syhUserTokenLog.userId,
                        syhUserTokenLog.loginLogId,
                        syhUserTokenLog.actionCd,
                        syhUserTokenLog.tokenTypeCd,
                        syhUserTokenLog.accessToken,
                        syhUserTokenLog.tokenExp,
                        syhUserTokenLog.prevToken,
                        syhUserTokenLog.refreshToken,
                        syhUserTokenLog.ip,
                        syhUserTokenLog.deviceInfo,
                        syhUserTokenLog.revokeReason,
                        syhUserTokenLog.accessTokenExp,
                        syhUserTokenLog.uiNm,
                        syhUserTokenLog.cmdNm,
                        syhUserTokenLog.regBy,
                        syhUserTokenLog.regDate,
                        syhUserTokenLog.updBy,
                        syhUserTokenLog.updDate,
                        sySite.siteNm.as("siteNm"),
                        syUser.userNm.as("userNm"),
                        cd_ta.codeLabel.as("actionCdNm"),
                        cd_tt.codeLabel.as("tokenTypeCdNm")
                ))
                .from(syhUserTokenLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhUserTokenLog.siteId))
                .leftJoin(syUser).on(syUser.userId.eq(syhUserTokenLog.userId))
                .leftJoin(cd_ta).on(cd_ta.codeGrp.eq("TOKEN_ACTION").and(cd_ta.codeValue.eq(syhUserTokenLog.actionCd)))
                .leftJoin(cd_tt).on(cd_tt.codeGrp.eq("TOKEN_TYPE").and(cd_tt.codeValue.eq(syhUserTokenLog.tokenTypeCd)));
    }

    /* 키조회 */
    @Override
    public Optional<SyhUserTokenLogDto.Item> selectById(String id) {
        SyhUserTokenLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhUserTokenLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<SyhUserTokenLogDto.Item> selectList(SyhUserTokenLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhUserTokenLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteIdEq(search),
                andLogIdEq(search),
                andUserIdEq(search),
                andActionCdEq(search),
                andTokenTypeCdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public SyhUserTokenLogDto.PageResponse selectPageData(SyhUserTokenLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andLogIdEq(search),
                andUserIdEq(search),
                andActionCdEq(search),
                andTokenTypeCdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhUserTokenLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhUserTokenLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhUserTokenLog.count())
                .where(wheres)
                .fetchOne();

        SyhUserTokenLogDto.PageResponse res = new SyhUserTokenLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syhUserTokenLog.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression andLogIdEq(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? syhUserTokenLog.logId.eq(search.getLogId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression andUserIdEq(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? syhUserTokenLog.userId.eq(search.getUserId()) : null;
    }

    /* actionCd 정확 일치 */
    private BooleanExpression andActionCdEq(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getActionCd())
                ? syhUserTokenLog.actionCd.eq(search.getActionCd()) : null;
    }

    /* tokenTypeCd 정확 일치 */
    private BooleanExpression andTokenTypeCdEq(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTokenTypeCd())
                ? syhUserTokenLog.tokenTypeCd.eq(search.getTokenTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(SyhUserTokenLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syhUserTokenLog.regDate.goe(start).and(syhUserTokenLog.regDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(SyhUserTokenLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",accessToken,", syhUserTokenLog.accessToken, pattern);
        or = orLike(or, all, types, ",actionCd,", syhUserTokenLog.actionCd, pattern);
        or = orLike(or, all, types, ",authId,", syhUserTokenLog.authId, pattern);
        or = orLike(or, all, types, ",cmdNm,", syhUserTokenLog.cmdNm, pattern);
        or = orLike(or, all, types, ",deviceInfo,", syhUserTokenLog.deviceInfo, pattern);
        or = orLike(or, all, types, ",ip,", syhUserTokenLog.ip, pattern);
        or = orLike(or, all, types, ",logId,", syhUserTokenLog.logId, pattern);
        or = orLike(or, all, types, ",loginLogId,", syhUserTokenLog.loginLogId, pattern);
        or = orLike(or, all, types, ",prevToken,", syhUserTokenLog.prevToken, pattern);
        or = orLike(or, all, types, ",refreshToken,", syhUserTokenLog.refreshToken, pattern);
        or = orLike(or, all, types, ",revokeReason,", syhUserTokenLog.revokeReason, pattern);
        or = orLike(or, all, types, ",siteId,", syhUserTokenLog.siteId, pattern);
        or = orLike(or, all, types, ",tokenTypeCd,", syhUserTokenLog.tokenTypeCd, pattern);
        or = orLike(or, all, types, ",uiNm,", syhUserTokenLog.uiNm, pattern);
        or = orLike(or, all, types, ",userId,", syhUserTokenLog.userId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyhUserTokenLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhUserTokenLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhUserTokenLog.logId));
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
                    orders.add(new OrderSpecifier(order, syhUserTokenLog.logId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhUserTokenLog.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhUserTokenLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhUserTokenLog.logId));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(SyhUserTokenLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhUserTokenLog);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(syhUserTokenLog.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getUserId()         != null) { update.set(syhUserTokenLog.userId,         entity.getUserId());         hasAny = true; }
        if (entity.getLoginLogId()     != null) { update.set(syhUserTokenLog.loginLogId,     entity.getLoginLogId());     hasAny = true; }
        if (entity.getActionCd()       != null) { update.set(syhUserTokenLog.actionCd,       entity.getActionCd());       hasAny = true; }
        if (entity.getTokenTypeCd()    != null) { update.set(syhUserTokenLog.tokenTypeCd,    entity.getTokenTypeCd());    hasAny = true; }
        if (entity.getAccessToken()    != null) { update.set(syhUserTokenLog.accessToken,    entity.getAccessToken());    hasAny = true; }
        if (entity.getTokenExp()       != null) { update.set(syhUserTokenLog.tokenExp,       entity.getTokenExp());       hasAny = true; }
        if (entity.getPrevToken()      != null) { update.set(syhUserTokenLog.prevToken,      entity.getPrevToken());      hasAny = true; }
        if (entity.getRefreshToken()   != null) { update.set(syhUserTokenLog.refreshToken,   entity.getRefreshToken());   hasAny = true; }
        if (entity.getIp()             != null) { update.set(syhUserTokenLog.ip,             entity.getIp());             hasAny = true; }
        if (entity.getDeviceInfo()     != null) { update.set(syhUserTokenLog.deviceInfo,     entity.getDeviceInfo());     hasAny = true; }
        if (entity.getRevokeReason()   != null) { update.set(syhUserTokenLog.revokeReason,   entity.getRevokeReason());   hasAny = true; }
        if (entity.getAccessTokenExp() != null) { update.set(syhUserTokenLog.accessTokenExp, entity.getAccessTokenExp()); hasAny = true; }
        if (entity.getUiNm()           != null) { update.set(syhUserTokenLog.uiNm,           entity.getUiNm());           hasAny = true; }
        if (entity.getCmdNm()          != null) { update.set(syhUserTokenLog.cmdNm,          entity.getCmdNm());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(syhUserTokenLog.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhUserTokenLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhUserTokenLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
