package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhUserTokenLogRepository;
import lombok.RequiredArgsConstructor;

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
    private static final QVwSyCode          cd_ta = new QVwSyCode("cd_ta");
    private static final QVwSyCode          cd_tt = new QVwSyCode("cd_tt");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * TOKEN_ACTION  {ISSUE: '발급', REFRESH: '갱신', EXPIRE: '만료', REVOKE: '강제폐기'}
     * TOKEN_TYPE    {ACCESS: '액세스', REFRESH: '리프레시', TEMP: '임시'}
     */
    private JPAQuery<SyhUserTokenLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhUserTokenLogDto.Item.class,
                        syhUserTokenLog.logId,              // 로그ID (PK, YYMMDDhhmmss+rand4)
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
                        syhUserTokenLog.revokeReasonCd,         // 폐기 사유 (LOGOUT/FORCE/EXPIRED 등)
                        syhUserTokenLog.accessTokenExp,       // 액세스 토큰 만료일시
                        syhUserTokenLog.uiNm,                 // 화면명 (X-UI-Nm 헤더)
                        syhUserTokenLog.cmdNm,                // 기능명 (X-Cmd-Nm 헤더)
                        syhUserTokenLog.regBy,                // 등록자
                        syhUserTokenLog.regDate,              // 등록일시
                        syhUserTokenLog.updBy,                // 수정자
                        syhUserTokenLog.updDate,              // 수정일시
                        syUser.userNm.as("userNm"),                    // 사용자명 (조인: sy_user)
                        cd_ta.codeLabel.as("actionCdNm"),               // 토큰액션 코드명 (조인: sy_code TOKEN_ACTION)
                        cd_tt.codeLabel.as("tokenTypeCdNm")             // 토큰유형 코드명 (조인: sy_code TOKEN_TYPE)
                ))
                .from(syhUserTokenLog)
                .leftJoin(syUser).on(syUser.userId.eq(syhUserTokenLog.userId)) // 사용자
                .leftJoin(cd_ta).on(cd_ta.codeGrp.eq("ACTION_CD").and(cd_ta.codeValue.eq(syhUserTokenLog.actionCd))) // 액션
                .leftJoin(cd_tt).on(cd_tt.codeGrp.eq("TOKEN_TYPE").and(cd_tt.codeValue.eq(syhUserTokenLog.tokenTypeCd))) // 토큰유형
                ;
    }

    /* 키조회 */
    @Override
    public Optional<SyhUserTokenLogDto.Item> selectById(String id) {
        SyhUserTokenLogDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhUserTokenLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 목록조회 */
    @Override
    public List<SyhUserTokenLogDto.Item> selectList(SyhUserTokenLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhUserTokenLog.logId, search.getLogId()));
        whereList.add(QdslUtil.strEq(syhUserTokenLog.userId, search.getUserId()));
        whereList.add(QdslUtil.strEq(syhUserTokenLog.actionCd, search.getActionCd()));
        whereList.add(QdslUtil.strEq(syhUserTokenLog.tokenTypeCd, search.getTokenTypeCd()));
        whereList.add(QdslUtil.dateBetween(syhUserTokenLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyhUserTokenLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyhUserTokenLogDto.Item> list = query.fetch();
        return list;
    }

    /* 페이지조회 */
    @Override
    public BasePage<SyhUserTokenLogDto.Item> selectPageData(SyhUserTokenLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhUserTokenLog.logId, search.getLogId()));
        whereList.add(QdslUtil.strEq(syhUserTokenLog.userId, search.getUserId()));
        whereList.add(QdslUtil.strEq(syhUserTokenLog.actionCd, search.getActionCd()));
        whereList.add(QdslUtil.strEq(syhUserTokenLog.tokenTypeCd, search.getTokenTypeCd()));
        whereList.add(QdslUtil.dateBetween(syhUserTokenLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyhUserTokenLogDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhUserTokenLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhUserTokenLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhUserTokenLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("accessToken", syhUserTokenLog.accessToken),
            QdslUtil.FieldDef.like("actionCd", syhUserTokenLog.actionCd),
            QdslUtil.FieldDef.like("authId", syhUserTokenLog.authId),
            QdslUtil.FieldDef.like("cmdNm", syhUserTokenLog.cmdNm),
            QdslUtil.FieldDef.like("deviceInfo", syhUserTokenLog.deviceInfo),
            QdslUtil.FieldDef.like("ip", syhUserTokenLog.ip),
            QdslUtil.FieldDef.like("logId", syhUserTokenLog.logId),
            QdslUtil.FieldDef.like("loginLogId", syhUserTokenLog.loginLogId),
            QdslUtil.FieldDef.like("prevToken", syhUserTokenLog.prevToken),
            QdslUtil.FieldDef.like("refreshToken", syhUserTokenLog.refreshToken),
            QdslUtil.FieldDef.like("revokeReasonCd", syhUserTokenLog.revokeReasonCd),
            QdslUtil.FieldDef.like("tokenTypeCd", syhUserTokenLog.tokenTypeCd),
            QdslUtil.FieldDef.like("uiNm", syhUserTokenLog.uiNm),
            QdslUtil.FieldDef.like("userId", syhUserTokenLog.userId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("logId", syhUserTokenLog.logId,
                   "regDate", syhUserTokenLog.regDate),
        new OrderSpecifier<>(Order.DESC, syhUserTokenLog.regDate),
        new OrderSpecifier<>(Order.ASC, syhUserTokenLog.logId));
    }

    /* 수정 */
    @Override
    public int updateSelective(SyhUserTokenLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhUserTokenLog);
        boolean hasAny = false;

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
        if (entity.getRevokeReasonCd()   != null) { update.set(syhUserTokenLog.revokeReasonCd,   entity.getRevokeReasonCd());   hasAny = true; }
        if (entity.getAccessTokenExp() != null) { update.set(syhUserTokenLog.accessTokenExp, entity.getAccessTokenExp()); hasAny = true; }
        if (entity.getUiNm()           != null) { update.set(syhUserTokenLog.uiNm,           entity.getUiNm());           hasAny = true; }
        if (entity.getCmdNm()          != null) { update.set(syhUserTokenLog.cmdNm,          entity.getCmdNm());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(syhUserTokenLog.updBy,          entity.getUpdBy());          hasAny = true; }
        update.set(syhUserTokenLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhUserTokenLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
