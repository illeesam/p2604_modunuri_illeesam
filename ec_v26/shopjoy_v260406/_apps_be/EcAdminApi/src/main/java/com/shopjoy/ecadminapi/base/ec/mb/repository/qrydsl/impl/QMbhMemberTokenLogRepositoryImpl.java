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

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbhMemberTokenLogRepositoryImpl implements QMbhMemberTokenLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbhMemberTokenLogRepositoryImpl";
    private static final QMbhMemberTokenLog mbhMemberTokenLog    = QMbhMemberTokenLog.mbhMemberTokenLog;
    private static final QSySite            sySite  = QSySite.sySite;
    private static final QMbMember          mbMember  = QMbMember.mbMember;
    private static final QVwSyCode            cdTa = new QVwSyCode("cd_ta");
    private static final QVwSyCode            cdTt = new QVwSyCode("cd_tt");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", mbhMemberTokenLog.regDate
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * ACTION_CD (코드: TOKEN_ACTION)      {ISSUE: '발급', REFRESH: '갱신', REVOKE: '강제폐기', EXPIRE: '만료'}
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
                        cdTa.codeLabel.as("actionCdNm"),            // 토큰 액션 코드라벨 (sy_code TOKEN_ACTION 조인)
                        cdTt.codeLabel.as("tokenTypeCdNm")          // 토큰 유형 코드라벨 (sy_code TOKEN_TYPE 조인)
                ))
                .from(mbhMemberTokenLog)
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        JPAQuery<MbhMemberTokenLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(mbhMemberTokenLog.logId, search.getLogId()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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
    public BasePage<MbhMemberTokenLogDto.Item> selectPageData(MbhMemberTokenLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(mbhMemberTokenLog.logId, search.getLogId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

        BasePage<MbhMemberTokenLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "memberId" (Entity 필드명) */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("accessToken", mbhMemberTokenLog.accessToken),
            QdslUtil.FieldDef.like("actionCd", mbhMemberTokenLog.actionCd),
            QdslUtil.FieldDef.like("authId", mbhMemberTokenLog.authId),
            QdslUtil.FieldDef.like("cmdNm", mbhMemberTokenLog.cmdNm),
            QdslUtil.FieldDef.like("deviceInfo", mbhMemberTokenLog.deviceInfo),
            QdslUtil.FieldDef.like("ip", mbhMemberTokenLog.ip),
            QdslUtil.FieldDef.like("logId", mbhMemberTokenLog.logId),
            QdslUtil.FieldDef.like("loginLogId", mbhMemberTokenLog.loginLogId),
            QdslUtil.FieldDef.like("memberId", mbhMemberTokenLog.memberId),
            QdslUtil.FieldDef.like("prevToken", mbhMemberTokenLog.prevToken),
            QdslUtil.FieldDef.like("refreshToken", mbhMemberTokenLog.refreshToken),
            QdslUtil.FieldDef.like("revokeReasonCd", mbhMemberTokenLog.revokeReasonCd),
            QdslUtil.FieldDef.like("tokenTypeCd", mbhMemberTokenLog.tokenTypeCd),
            QdslUtil.FieldDef.like("uiNm", mbhMemberTokenLog.uiNm)
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbhMemberTokenLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbhMemberTokenLog.logId.eq(entity.getLogId())).execute();
    }
}
