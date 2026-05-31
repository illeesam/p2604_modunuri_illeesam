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
    private static final QSyhUserTokenLog l   = QSyhUserTokenLog.syhUserTokenLog;
    private static final QSySite          ste = QSySite.sySite;
    private static final QSyUser          usr = QSyUser.syUser;
    private static final QSyCode          cd_ta = new QSyCode("cd_ta");
    private static final QSyCode          cd_tt = new QSyCode("cd_tt");

    /* buildBaseQuery */
    private JPAQuery<SyhUserTokenLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhUserTokenLogDto.Item.class,
                        l.logId,
                        l.siteId,
                        l.userId,
                        l.loginLogId,
                        l.actionCd,
                        l.tokenTypeCd,
                        l.accessToken,
                        l.tokenExp,
                        l.prevToken,
                        l.refreshToken,
                        l.ip,
                        l.deviceInfo,
                        l.revokeReason,
                        l.accessTokenExp,
                        l.uiNm,
                        l.cmdNm,
                        l.regBy,
                        l.regDate,
                        l.updBy,
                        l.updDate,
                        ste.siteNm.as("siteNm"),
                        usr.userNm.as("userNm"),
                        cd_ta.codeLabel.as("actionCdNm"),
                        cd_tt.codeLabel.as("tokenTypeCdNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(usr).on(usr.userId.eq(l.userId))
                .leftJoin(cd_ta).on(cd_ta.codeGrp.eq("TOKEN_ACTION").and(cd_ta.codeValue.eq(l.actionCd)))
                .leftJoin(cd_tt).on(cd_tt.codeGrp.eq("TOKEN_TYPE").and(cd_tt.codeValue.eq(l.tokenTypeCd)));
    }

    /* 키조회 */
    @Override
    public Optional<SyhUserTokenLogDto.Item> selectById(String id) {
        SyhUserTokenLogDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(l.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<SyhUserTokenLogDto.Item> selectList(SyhUserTokenLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhUserTokenLogDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteId(search),
                andLogId(search),
                andUserId(search),
                andActionCd(search),
                andTokenTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
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

    /* 페이지조회 */
    @Override
    public SyhUserTokenLogDto.PageResponse selectPageList(SyhUserTokenLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhUserTokenLogDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andSiteId(search),
                andLogId(search),
                andUserId(search),
                andActionCd(search),
                andTokenTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhUserTokenLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(
                andSiteId(search),
                andLogId(search),
                andUserId(search),
                andActionCd(search),
                andTokenTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        SyhUserTokenLogDto.PageResponse res = new SyhUserTokenLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? l.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression andLogId(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? l.logId.eq(search.getLogId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression andUserId(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? l.userId.eq(search.getUserId()) : null;
    }

    /* actionCd 정확 일치 */
    private BooleanExpression andActionCd(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getActionCd())
                ? l.actionCd.eq(search.getActionCd()) : null;
    }

    /* tokenTypeCd 정확 일치 */
    private BooleanExpression andTokenTypeCd(SyhUserTokenLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTokenTypeCd())
                ? l.tokenTypeCd.eq(search.getTokenTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SyhUserTokenLogDto.Request search) {
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
    private BooleanExpression andSearchValue(SyhUserTokenLogDto.Request search) {
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
        or = orLike(or, all, types, ",prevToken,", l.prevToken, pattern);
        or = orLike(or, all, types, ",refreshToken,", l.refreshToken, pattern);
        or = orLike(or, all, types, ",revokeReason,", l.revokeReason, pattern);
        or = orLike(or, all, types, ",siteId,", l.siteId, pattern);
        or = orLike(or, all, types, ",tokenTypeCd,", l.tokenTypeCd, pattern);
        or = orLike(or, all, types, ",uiNm,", l.uiNm, pattern);
        or = orLike(or, all, types, ",userId,", l.userId, pattern);
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
    public int updateSelective(SyhUserTokenLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(l.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getUserId()         != null) { update.set(l.userId,         entity.getUserId());         hasAny = true; }
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

        long affected = update.where(l.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
