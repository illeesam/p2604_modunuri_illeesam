package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbhMemberLoginLogRepositoryImpl implements QMbhMemberLoginLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbhMemberLoginLogRepositoryImpl";
    private static final QMbhMemberLoginLog mbhMemberLoginLog    = QMbhMemberLoginLog.mbhMemberLoginLog;
    private static final QSySite            sySite  = QSySite.sySite;
    private static final QMbMember          mbMember  = QMbMember.mbMember;
    private static final QSyCode            cdLr = new QSyCode("cd_lr");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", mbhMemberLoginLog.regDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("accessToken", mbhMemberLoginLog.accessToken),
        Map.entry("authId", mbhMemberLoginLog.authId),
        Map.entry("browser", mbhMemberLoginLog.browser),
        Map.entry("cmdNm", mbhMemberLoginLog.cmdNm),
        Map.entry("country", mbhMemberLoginLog.country),
        Map.entry("device", mbhMemberLoginLog.device),
        Map.entry("ip", mbhMemberLoginLog.ip),
        Map.entry("logId", mbhMemberLoginLog.logId),
        Map.entry("loginId", mbhMemberLoginLog.loginId),
        Map.entry("memberId", mbhMemberLoginLog.memberId),
        Map.entry("os", mbhMemberLoginLog.os),
        Map.entry("refreshToken", mbhMemberLoginLog.refreshToken),
        Map.entry("resultCd", mbhMemberLoginLog.resultCd),
        Map.entry("siteId", mbhMemberLoginLog.siteId),
        Map.entry("uiNm", mbhMemberLoginLog.uiNm)
    );

    /* 회원 로그인 로그 baseSelColumnQuery — list/page/byId 공유 (코드명 포함 풀필드) */
    private JPAQuery<MbhMemberLoginLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbhMemberLoginLogDto.Item.class,
                        mbhMemberLoginLog.logId, mbhMemberLoginLog.siteId, mbhMemberLoginLog.memberId, mbhMemberLoginLog.loginId, mbhMemberLoginLog.loginDate,
                        mbhMemberLoginLog.resultCd, mbhMemberLoginLog.failCnt, mbhMemberLoginLog.ip, mbhMemberLoginLog.device, mbhMemberLoginLog.os, mbhMemberLoginLog.browser, mbhMemberLoginLog.country,
                        mbhMemberLoginLog.accessToken, mbhMemberLoginLog.accessTokenExp, mbhMemberLoginLog.refreshToken, mbhMemberLoginLog.refreshTokenExp,
                        mbhMemberLoginLog.uiNm, mbhMemberLoginLog.cmdNm,
                        mbhMemberLoginLog.regBy, mbhMemberLoginLog.regDate, mbhMemberLoginLog.updBy, mbhMemberLoginLog.updDate,
                        sySite.siteNm.as("siteNm"),
                        mbMember.memberNm.as("memberNm"),
                        cdLr.codeLabel.as("resultCdNm")
                ))
                .from(mbhMemberLoginLog)
                .leftJoin(sySite).on(sySite.siteId.eq(mbhMemberLoginLog.siteId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbhMemberLoginLog.memberId))
                .leftJoin(cdLr).on(cdLr.codeGrp.eq("LOGIN_RESULT").and(cdLr.codeValue.eq(mbhMemberLoginLog.resultCd)));
    }

    /* 회원 로그인 로그 키조회 (단건 상세 — baseSelColumnQuery 공유) */
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
                    QdslUtil.strEq(mbhMemberLoginLog.siteId, search.getSiteId()),
                    QdslUtil.strEq(mbhMemberLoginLog.logId, search.getLogId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
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

    /* 회원 로그인 로그 페이지조회 */
    @Override
    public MbhMemberLoginLogDto.PageResponse selectPageData(MbhMemberLoginLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(mbhMemberLoginLog.siteId, search.getSiteId()),
                QdslUtil.strEq(mbhMemberLoginLog.logId, search.getLogId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbhMemberLoginLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbhMemberLoginLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbhMemberLoginLog.count())
                .where(wheres)
                .fetchOne();

        MbhMemberLoginLogDto.PageResponse res = new MbhMemberLoginLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "memberId,loginId" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(MbhMemberLoginLogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
