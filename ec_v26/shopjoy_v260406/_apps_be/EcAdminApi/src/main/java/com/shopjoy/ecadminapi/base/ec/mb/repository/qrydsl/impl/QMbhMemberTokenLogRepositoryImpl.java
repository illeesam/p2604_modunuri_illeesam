package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbhMemberTokenLogRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbhMemberTokenLogRepositoryImpl implements QMbhMemberTokenLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbhMemberTokenLogRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMbhMemberTokenLog mbhMemberTokenLog    = QMbhMemberTokenLog.mbhMemberTokenLog;
    private static final QSySite            sySite  = QSySite.sySite;
    private static final QMbMember          mbMember  = QMbMember.mbMember;
    private static final QVwSyCode            codeActionCd = new QVwSyCode("cd_ta");
    private static final QVwSyCode            codeTokenTypeCd = new QVwSyCode("cd_tt");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * ACTION_CD (코드: ACTION_CD)      {ISSUE: '발급', REFRESH: '갱신', REVOKE: '강제폐기', EXPIRE: '만료'}
     * TOKEN_TYPE_CD (코드: TOKEN_TYPE)    {ACCESS: '액세스', REFRESH: '리프레시', TEMP: '임시'}
     */
    private JPAQuery<MbhMemberTokenLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbhMemberTokenLogDto.Item.class,
                        mbhMemberTokenLog.logId,             // 로그ID (PK)
                        mbhMemberTokenLog.memberId,          // 회원ID (mb_member.member_id)
                        mbhMemberTokenLog.loginLogId,        // 최초 로그인 로그ID (mbh_member_login_log)
                        mbhMemberTokenLog.actionCd,          // 토큰 액션 — TOKEN_ACTION {ISSUE: '발급', REFRESH: '갱신', REVOKE: '강제폐기', EXPIRE: '만료'}
                        mbhMemberTokenLog.tokenTypeCd,       // 토큰 유형 — TOKEN_TYPE {ACCESS: '액세스', REFRESH: '리프레시', TEMP: '임시'}
                        mbhMemberTokenLog.accessToken,       // 토큰값 (SHA-256 해시 저장 권장)
                        mbhMemberTokenLog.tokenExp,          // 토큰 만료일시
                        mbhMemberTokenLog.prevToken,         // 갱신 전 토큰 해시 (REFRESH 액션 시)
                        mbhMemberTokenLog.refreshToken,      // 리프레시 토큰
                        mbhMemberTokenLog.ip,                // IP주소
                        mbhMemberTokenLog.deviceInfo,        // User-Agent
                        mbhMemberTokenLog.revokeReasonCd,      // 폐기 사유 (LOGOUT/FORCE/EXPIRED 등)
                        mbhMemberTokenLog.accessTokenExp,    // 액세스 토큰 만료일시
                        mbhMemberTokenLog.uiNm,              // 화면명 (X-UI-Nm 헤더)
                        mbhMemberTokenLog.cmdNm,             // 기능명 (X-Cmd-Nm 헤더)
                        mbhMemberTokenLog.regBy,             // 등록자 (sy_user.user_id, mb_member.member_id)
                        mbhMemberTokenLog.regDate,           // 등록일
                        mbhMemberTokenLog.updBy,             // 수정자 (sy_user.user_id, mb_member.member_id)
                        mbhMemberTokenLog.updDate,           // 수정일
                        mbMember.memberNm.as("memberNm"),           // 회원명 (mb_member 조인)
                        codeActionCd.codeLabel.as("actionCdNm"),            // 토큰 액션 코드라벨 (sy_code TOKEN_ACTION 조인)
                        codeTokenTypeCd.codeLabel.as("tokenTypeCdNm"),          // 토큰 유형 코드라벨 (sy_code TOKEN_TYPE 조인)
                        mbhMemberTokenLog.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(mbhMemberTokenLog)
                .innerJoin(mbMember).on(mbMember.memberId.eq(mbhMemberTokenLog.memberId)) // 회원
                .innerJoin(codeActionCd).on(codeActionCd.codeGrp.eq("ACTION_CD").and(codeActionCd.codeValue.eq(mbhMemberTokenLog.actionCd))) // 액션
                .innerJoin(codeTokenTypeCd).on(codeTokenTypeCd.codeGrp.eq("TOKEN_TYPE").and(codeTokenTypeCd.codeValue.eq(mbhMemberTokenLog.tokenTypeCd))) // 토큰유형
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mbhMemberTokenLog.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mbhMemberTokenLog.regBy)) // 등록자
                ;
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbhMemberTokenLog.logId, search.getLogId())); // 로그ID 필터
        whereList.add(QdslUtil.dateBetween(mbhMemberTokenLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MbhMemberTokenLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<MbhMemberTokenLogDto.Item> list = query.fetch();
        return list;
    }

    /* 페이지조회 */
    @Override
    public BasePage<MbhMemberTokenLogDto.Item> selectPageData(MbhMemberTokenLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbhMemberTokenLog.logId, search.getLogId())); // 로그ID 필터
        whereList.add(QdslUtil.dateBetween(mbhMemberTokenLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<MbhMemberTokenLogDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MbhMemberTokenLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbhMemberTokenLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<MbhMemberTokenLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 예: "accessToken,actionCd,authId,cmdNm,deviceInfo" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("accessToken", mbhMemberTokenLog.accessToken), // 토큰값 (SHA-256 해시 저장 권장)
            QdslUtil.FieldDef.like("actionCd", mbhMemberTokenLog.actionCd), // 토큰 액션 — ACTION_CD
            QdslUtil.FieldDef.like("authId", mbhMemberTokenLog.authId),
            QdslUtil.FieldDef.like("cmdNm", mbhMemberTokenLog.cmdNm), // 기능명 (X-Cmd-Nm 헤더)
            QdslUtil.FieldDef.like("deviceInfo", mbhMemberTokenLog.deviceInfo), // User-Agent
            QdslUtil.FieldDef.like("ip", mbhMemberTokenLog.ip), // IP주소
            QdslUtil.FieldDef.like("logId", mbhMemberTokenLog.logId), // 로그ID 필터
            QdslUtil.FieldDef.like("loginLogId", mbhMemberTokenLog.loginLogId), // 최초 로그인 로그ID (mbh_member_login_log)
            QdslUtil.FieldDef.like("memberId", mbhMemberTokenLog.memberId), // 회원ID (mb_member.member_id)
            QdslUtil.FieldDef.like("prevToken", mbhMemberTokenLog.prevToken), // 갱신 전 토큰 해시 (REFRESH 액션 시)
            QdslUtil.FieldDef.like("refreshToken", mbhMemberTokenLog.refreshToken), // 리프레시 토큰
            QdslUtil.FieldDef.like("revokeReasonCd", mbhMemberTokenLog.revokeReasonCd), // 폐기 사유 (LOGOUT/FORCE/EXPIRED 등)
            QdslUtil.FieldDef.like("tokenTypeCd", mbhMemberTokenLog.tokenTypeCd), // 토큰 유형 — TOKEN_TYPE {ACCESS:액세스, REFRESH:리프레시}
            QdslUtil.FieldDef.like("uiNm", mbhMemberTokenLog.uiNm) // 화면명 (X-UI-Nm 헤더)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("logId", mbhMemberTokenLog.logId,
                   "regDate", mbhMemberTokenLog.regDate),
        new OrderSpecifier<>(Order.DESC, mbhMemberTokenLog.regDate),
        new OrderSpecifier<>(Order.ASC, mbhMemberTokenLog.logId));
    }

    /* 수정 */
    @Override
    public int updateSelective(MbhMemberTokenLog entity) {
        if (entity.getLogId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbhMemberTokenLog);
        boolean hasAny = false;
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
        if (entity.getRevokeReasonCd()   != null) { update.set(mbhMemberTokenLog.revokeReasonCd,   entity.getRevokeReasonCd());   hasAny = true; }
        if (entity.getAccessTokenExp() != null) { update.set(mbhMemberTokenLog.accessTokenExp, entity.getAccessTokenExp()); hasAny = true; }
        if (entity.getUiNm()           != null) { update.set(mbhMemberTokenLog.uiNm,           entity.getUiNm());           hasAny = true; }
        if (entity.getCmdNm()          != null) { update.set(mbhMemberTokenLog.cmdNm,          entity.getCmdNm());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(mbhMemberTokenLog.updBy,          entity.getUpdBy());          hasAny = true; }
        update.set(mbhMemberTokenLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbhMemberTokenLog.logId.eq(entity.getLogId())).execute();
    }
}
