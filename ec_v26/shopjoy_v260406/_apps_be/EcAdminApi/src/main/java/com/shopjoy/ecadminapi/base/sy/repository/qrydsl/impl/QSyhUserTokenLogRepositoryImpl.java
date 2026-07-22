package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhUserTokenLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syhUserTokenLog.regDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("accessToken", syhUserTokenLog.accessToken),
        Map.entry("actionCd", syhUserTokenLog.actionCd),
        Map.entry("authId", syhUserTokenLog.authId),
        Map.entry("cmdNm", syhUserTokenLog.cmdNm),
        Map.entry("deviceInfo", syhUserTokenLog.deviceInfo),
        Map.entry("ip", syhUserTokenLog.ip),
        Map.entry("logId", syhUserTokenLog.logId),
        Map.entry("loginLogId", syhUserTokenLog.loginLogId),
        Map.entry("prevToken", syhUserTokenLog.prevToken),
        Map.entry("refreshToken", syhUserTokenLog.refreshToken),
        Map.entry("revokeReason", syhUserTokenLog.revokeReason),
        Map.entry("siteId", syhUserTokenLog.siteId),
        Map.entry("tokenTypeCd", syhUserTokenLog.tokenTypeCd),
        Map.entry("uiNm", syhUserTokenLog.uiNm),
        Map.entry("userId", syhUserTokenLog.userId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * TOKEN_ACTION  {ISSUE: '발급', REFRESH: '갱신', EXPIRE: '만료', REVOKE: '강제폐기'}
     * TOKEN_TYPE    {ACCESS: '액세스', REFRESH: '리프레시', TEMP: '임시'}
     */
    private JPAQuery<SyhUserTokenLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhUserTokenLogDto.Item.class,
                        syhUserTokenLog.logId,              // 로그ID (PK, YYMMDDhhmmss+rand4)
                        syhUserTokenLog.siteId,              // 사이트ID (sy_site.site_id)
                        syhUserTokenLog.userId,               // 사용자ID (sy_user.user_id)
                        syhUserTokenLog.loginLogId,           // 최초 로그인 로그ID (sy_user_login_log.log_id)
                        syhUserTokenLog.actionCd,             // 토큰 액션 — TOKEN_ACTION {ISSUE: '발급', REFRESH: '갱신', EXPIRE: '만료', REVOKE: '강제폐기'}
                        syhUserTokenLog.tokenTypeCd,          // 토큰 유형 — TOKEN_TYPE {ACCESS: '액세스', REFRESH: '리프레시', TEMP: '임시'}
                        syhUserTokenLog.accessToken,          // 토큰값 (SHA-256 해시 저장 권장)
                        syhUserTokenLog.tokenExp,             // 토큰 만료일시
                        syhUserTokenLog.prevToken,            // 갱신 전 토큰 해시 (REFRESH 액션 시)
                        syhUserTokenLog.refreshToken,         // 리프레시 토큰
                        syhUserTokenLog.ip,                   // IP주소
                        syhUserTokenLog.deviceInfo,           // User-Agent
                        syhUserTokenLog.revokeReason,         // 폐기 사유 (LOGOUT/FORCE/EXPIRED 등)
                        syhUserTokenLog.accessTokenExp,       // 액세스 토큰 만료일시
                        syhUserTokenLog.uiNm,                 // 화면명 (X-UI-Nm 헤더)
                        syhUserTokenLog.cmdNm,                // 기능명 (X-Cmd-Nm 헤더)
                        syhUserTokenLog.regBy,                // 등록자
                        syhUserTokenLog.regDate,              // 등록일시
                        syhUserTokenLog.updBy,                // 수정자
                        syhUserTokenLog.updDate,              // 수정일시
                        sySite.siteNm.as("siteNm"),                    // 사이트명 (조인: sy_site)
                        syUser.userNm.as("userNm"),                    // 사용자명 (조인: sy_user)
                        cd_ta.codeLabel.as("actionCdNm"),               // 토큰액션 코드명 (조인: sy_code TOKEN_ACTION)
                        cd_tt.codeLabel.as("tokenTypeCdNm")             // 토큰유형 코드명 (조인: sy_code TOKEN_TYPE)
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
                QdslUtil.strEq(syhUserTokenLog.siteId, search.getSiteId()),
                QdslUtil.strEq(syhUserTokenLog.logId, search.getLogId()),
                QdslUtil.strEq(syhUserTokenLog.userId, search.getUserId()),
                QdslUtil.strEq(syhUserTokenLog.actionCd, search.getActionCd()),
                QdslUtil.strEq(syhUserTokenLog.tokenTypeCd, search.getTokenTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
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
                QdslUtil.strEq(syhUserTokenLog.siteId, search.getSiteId()),
                QdslUtil.strEq(syhUserTokenLog.logId, search.getLogId()),
                QdslUtil.strEq(syhUserTokenLog.userId, search.getUserId()),
                QdslUtil.strEq(syhUserTokenLog.actionCd, search.getActionCd()),
                QdslUtil.strEq(syhUserTokenLog.tokenTypeCd, search.getTokenTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyhUserTokenLogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
