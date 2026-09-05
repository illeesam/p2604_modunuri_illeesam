package com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbhMemberLoginLog;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.QMbhMemberLoginLog;
import com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl.QMbhMemberLoginLogRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbhMemberLoginLogRepositoryImpl implements QMbhMemberLoginLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbhMemberLoginLogRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMbhMemberLoginLog mbhMemberLoginLog    = QMbhMemberLoginLog.mbhMemberLoginLog;
    private static final QSySite            sySite  = QSySite.sySite;
    private static final QMbMember          mbMember  = QMbMember.mbMember;
    private static final QVwSyCode            codeResultCd = new QVwSyCode("cd_lr");    /*
     * baseSelColumnQuery — list/page/byId 공유 (코드명 포함 풀필드)
     * 코드성 필드 예시 코드값
     * RESULT_CD (코드: LOGIN_RESULT)  {SUCCESS: '성공', FAIL_PW: '비밀번호불일치', FAIL_LOCKED: '계정잠금',
     *                                  FAIL_NOT_FOUND: '없는계정', FAIL_DORMANT: '휴면계정', FAIL_WITHDRAWN: '탈퇴계정'}
     */
    private JPAQuery<MbhMemberLoginLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbhMemberLoginLogDto.Item.class,
                        mbhMemberLoginLog.logId,             // 로그ID (PK)
                        mbhMemberLoginLog.memberId,          // 회원ID (로그인 실패 시 NULL)
                        mbhMemberLoginLog.loginId,           // 입력한 로그인ID (이메일)
                        mbhMemberLoginLog.loginDate,         // 로그인 시도일시
                        mbhMemberLoginLog.resultCd,          // 결과 — LOGIN_RESULT {SUCCESS: '성공', FAIL_PW: '비밀번호불일치', FAIL_LOCKED: '계정잠금', FAIL_DORMANT: '휴면계정', FAIL_WITHDRAWN: '탈퇴계정'}
                        mbhMemberLoginLog.failCnt,           // 해당 시점 연속 실패 횟수
                        mbhMemberLoginLog.ip,                // IP주소
                        mbhMemberLoginLog.device,            // User-Agent 전문
                        mbhMemberLoginLog.os,                // OS 정보
                        mbhMemberLoginLog.browser,           // 브라우저 정보
                        mbhMemberLoginLog.country,           // 국가코드 (GeoIP)
                        mbhMemberLoginLog.accessToken,       // 액세스 토큰 (SHA-256 해시값 저장 권장, 로그인 실패 시 NULL)
                        mbhMemberLoginLog.accessTokenExp,    // 액세스 토큰 만료일시
                        mbhMemberLoginLog.refreshToken,      // 리프레시 토큰 (SHA-256 해시값 저장 권장)
                        mbhMemberLoginLog.refreshTokenExp,   // 리프레시 토큰 만료일시
                        mbhMemberLoginLog.uiNm,              // 화면명 (X-UI-Nm 헤더)
                        mbhMemberLoginLog.cmdNm,             // 기능명 (X-Cmd-Nm 헤더)
                        mbhMemberLoginLog.regBy,             // 등록자 (sy_user.user_id, mb_member.member_id)
                        mbhMemberLoginLog.regDate,           // 등록일
                        mbhMemberLoginLog.updBy,             // 수정자 (sy_user.user_id, mb_member.member_id)
                        mbhMemberLoginLog.updDate,           // 수정일
                        mbMember.memberNm.as("memberNm"),           // 회원명 (mb_member 조인)
                        codeResultCd.codeLabel.as("resultCdNm"),             // 결과 코드라벨 (sy_code LOGIN_RESULT 조인)
                        mbhMemberLoginLog.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(mbhMemberLoginLog)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbhMemberLoginLog.memberId)) // 회원
                .leftJoin(codeResultCd).on(codeResultCd.codeGrp.eq("LOGIN_RESULT").and(codeResultCd.codeValue.eq(mbhMemberLoginLog.resultCd))) // 로그인결과
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mbhMemberLoginLog.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mbhMemberLoginLog.regBy)) // 등록자
                ;
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbhMemberLoginLog.logId, search.getLogId())); // 로그ID 필터
        whereList.add(QdslUtil.dateBetween(mbhMemberLoginLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MbhMemberLoginLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<MbhMemberLoginLogDto.Item> list = query.fetch();
        return list;
    }

    /* 회원 로그인 로그 페이지조회 */
    @Override
    public BasePage<MbhMemberLoginLogDto.Item> selectPageData(MbhMemberLoginLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbhMemberLoginLog.logId, search.getLogId())); // 로그ID 필터
        whereList.add(QdslUtil.dateBetween(mbhMemberLoginLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<MbhMemberLoginLogDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MbhMemberLoginLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbhMemberLoginLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<MbhMemberLoginLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 예: "accessToken,authId,browser,cmdNm,country" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("accessToken", mbhMemberLoginLog.accessToken), // 액세스 토큰 (SHA-256 해시값, 로그인 실패 시 NULL)
            QdslUtil.FieldDef.like("authId", mbhMemberLoginLog.authId),
            QdslUtil.FieldDef.like("browser", mbhMemberLoginLog.browser), // 브라우저 정보
            QdslUtil.FieldDef.like("cmdNm", mbhMemberLoginLog.cmdNm), // 기능명 (X-Cmd-Nm 헤더)
            QdslUtil.FieldDef.like("country", mbhMemberLoginLog.country), // 국가코드 (GeoIP)
            QdslUtil.FieldDef.like("device", mbhMemberLoginLog.device), // User-Agent 전문
            QdslUtil.FieldDef.like("ip", mbhMemberLoginLog.ip), // IP주소
            QdslUtil.FieldDef.like("logId", mbhMemberLoginLog.logId), // 로그ID 필터
            QdslUtil.FieldDef.like("loginId", mbhMemberLoginLog.loginId), // 입력한 로그인ID (이메일)
            QdslUtil.FieldDef.like("memberId", mbhMemberLoginLog.memberId), // 회원ID (로그인 실패 시 NULL)
            QdslUtil.FieldDef.like("os", mbhMemberLoginLog.os), // OS 정보
            QdslUtil.FieldDef.like("refreshToken", mbhMemberLoginLog.refreshToken), // 리프레시 토큰 (SHA-256 해시값)
            QdslUtil.FieldDef.like("resultCd", mbhMemberLoginLog.resultCd), // 결과 — LOGIN_RESULT
            QdslUtil.FieldDef.like("uiNm", mbhMemberLoginLog.uiNm) // 화면명 (X-UI-Nm 헤더)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("logId", mbhMemberLoginLog.logId,
                   "regDate", mbhMemberLoginLog.regDate),
        new OrderSpecifier<>(Order.DESC, mbhMemberLoginLog.regDate),
        new OrderSpecifier<>(Order.ASC, mbhMemberLoginLog.logId));
    }

    /* 회원 로그인 로그 수정 */
    @Override
    public int updateSelective(MbhMemberLoginLog entity) {
        if (entity.getLogId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbhMemberLoginLog);
        boolean hasAny = false;
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
        update.set(mbhMemberLoginLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbhMemberLoginLog.logId.eq(entity.getLogId())).execute();
    }
}
