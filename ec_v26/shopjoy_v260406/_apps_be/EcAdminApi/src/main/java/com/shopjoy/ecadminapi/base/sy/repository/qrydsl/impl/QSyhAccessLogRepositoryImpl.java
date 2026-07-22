package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhAccessLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAccessLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhAccessLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhAccessLogRepositoryImpl implements QSyhAccessLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhAccessLogRepositoryImpl";
    private static final QSyhAccessLog syhAccessLog = QSyhAccessLog.syhAccessLog;
    private static final QSySite   sySite   = QSySite.sySite;
    private static final QSyUser   syUser   = QSyUser.syUser;
    private static final QSyRole   syRole   = QSyRole.syRole;
    private static final QSyDept   syDept   = QSyDept.syDept;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyCode   cd_at    = new QSyCode("cd_at");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syhAccessLog.regDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("appTypeCd", syhAccessLog.appTypeCd),
        Map.entry("cmdNm", syhAccessLog.cmdNm),
        Map.entry("deptId", syhAccessLog.deptId),
        Map.entry("fileNm", syhAccessLog.fileNm),
        Map.entry("funcNm", syhAccessLog.funcNm),
        Map.entry("lineNo", syhAccessLog.lineNo),
        Map.entry("localeId", syhAccessLog.localeId),
        Map.entry("logId", syhAccessLog.logId),
        Map.entry("profile", syhAccessLog.profile),
        Map.entry("reqBody", syhAccessLog.reqBody),
        Map.entry("reqHost", syhAccessLog.reqHost),
        Map.entry("reqIp", syhAccessLog.reqIp),
        Map.entry("reqMethod", syhAccessLog.reqMethod),
        Map.entry("reqPath", syhAccessLog.reqPath),
        Map.entry("reqQuery", syhAccessLog.reqQuery),
        Map.entry("reqUa", syhAccessLog.reqUa),
        Map.entry("respBody", syhAccessLog.respBody),
        Map.entry("roleId", syhAccessLog.roleId),
        Map.entry("serverNm", syhAccessLog.serverNm),
        Map.entry("siteId", syhAccessLog.siteId),
        Map.entry("threadNm", syhAccessLog.threadNm),
        Map.entry("traceId", syhAccessLog.traceId),
        Map.entry("uiNm", syhAccessLog.uiNm),
        Map.entry("userId", syhAccessLog.userId),
        Map.entry("vendorId", syhAccessLog.vendorId)
    );

    /*
     * baseSelColumnQuery — list/page/byId 공유 프로젝션 (코드명/연관명 조인 포함 풀필드)
     * 코드성 필드 예시 코드값
     * APP_TYPE  {ADMIN: '관리자', MEMBER: '회원', VENDOR: '업체', ANON: '비로그인'}
     */
    private JPAQuery<SyhAccessLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAccessLogDto.Item.class,
                        syhAccessLog.logId,                     // PK: AL+yyMMddHHmmss+rand4
                        syhAccessLog.siteId,                    // 사이트ID (sy_site.site_id)
                        syhAccessLog.reqMethod,                 // HTTP 메서드
                        syhAccessLog.reqHost,                   // Host 헤더 값
                        syhAccessLog.reqPath,                   // 요청 URI 경로
                        syhAccessLog.reqQuery,                  // 쿼리 파라미터 문자열
                        syhAccessLog.reqIp,                     // 클라이언트 실제 IP
                        syhAccessLog.reqUa,                     // User-Agent
                        syhAccessLog.reqBody,                   // 요청 바디 (설정된 최대 크기까지)
                        syhAccessLog.appTypeCd,                 // 호출 앱 유형 — APP_TYPE {ADMIN: '관리자', MEMBER: '회원', VENDOR: '업체', ANON: '비로그인'}
                        syhAccessLog.userId,                    // 인증 사용자 ID
                        syhAccessLog.roleId,                    // 역할 ID
                        syhAccessLog.deptId,                    // 부서 ID (MDC)
                        syhAccessLog.vendorId,                  // 업체 ID (MDC)
                        syhAccessLog.localeId,                  // 지역 ID (MDC)
                        syhAccessLog.respStatus,                 // HTTP 응답 상태 코드
                        syhAccessLog.respTimeMs,                 // 요청 처리 시간 (밀리초)
                        syhAccessLog.respBody,                   // 응답 바디 (설정된 최대 크기까지)
                        syhAccessLog.serverNm,                   // 서버 호스트명
                        syhAccessLog.profile,                    // 활성 Spring 프로파일
                        syhAccessLog.threadNm,                   // 처리 스레드명
                        syhAccessLog.uiNm,                       // 화면명 (X-UI-Nm 헤더)
                        syhAccessLog.cmdNm,                       // 작업명 (X-Cmd-Nm 헤더)
                        syhAccessLog.fileNm,                     // 파일명 (X-헤더)
                        syhAccessLog.funcNm,                     // 함수명 (X-헤더)
                        syhAccessLog.lineNo,                     // 라인번호 (X-헤더)
                        syhAccessLog.traceId,                    // 트레이스ID (X-헤더)
                        syhAccessLog.reqDt,                      // 요청 수신 시각
                        syhAccessLog.regDate,                    // DB 저장 시각
                        sySite.siteNm.as("siteNm"),              // 사이트명 (조인: sy_site)
                        cd_at.codeLabel.as("appTypeCdNm"),        // 앱유형 코드명 (조인: sy_code APP_TYPE)
                        syUser.userNm.as("userNm"),              // 사용자명 (조인: sy_user)
                        syRole.roleNm.as("roleNm"),              // 역할명 (조인: sy_role)
                        syDept.deptNm.as("deptNm"),              // 부서명 (조인: sy_dept)
                        syVendor.vendorNm.as("vendorNm")         // 업체명 (조인: sy_vendor)
                ))
                .from(syhAccessLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhAccessLog.siteId))
                .leftJoin(syUser).on(syUser.userId.eq(syhAccessLog.userId))
                .leftJoin(syRole).on(syRole.roleId.eq(syhAccessLog.roleId))
                .leftJoin(syDept).on(syDept.deptId.eq(syhAccessLog.deptId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(syhAccessLog.vendorId))
                .leftJoin(cd_at).on(cd_at.codeGrp.eq("APP_TYPE").and(cd_at.codeValue.eq(syhAccessLog.appTypeCd)));
    }

    /* 단건 상세조회 (코드명/연관명 조인 포함 풀필드 — baseSelColumnQuery 공유) */
    @Override
    public Optional<SyhAccessLogDto.Item> selectById(String id) {
        SyhAccessLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhAccessLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 페이지조회 */
    @Override
    public SyhAccessLogDto.PageResponse selectPageData(SyhAccessLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syhAccessLog.reqMethod, search.getMethod()),
                andStatusEq(search),
                andPathLike(search),
                andUiNmLike(search),
                QdslUtil.strEqTrim(syhAccessLog.traceId, search.getTraceId()),
                QdslUtil.strEq(syhAccessLog.appTypeCd, search.getAppTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhAccessLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhAccessLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhAccessLog.count())
                .where(wheres)
                .fetchOne();

        SyhAccessLogDto.PageResponse res = new SyhAccessLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* respStatus 정확 일치 (숫자만 파싱, 비숫자면 무시) */
    private BooleanExpression andStatusEq(SyhAccessLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getStatus())) return null;
        try {
            return syhAccessLog.respStatus.eq(Integer.valueOf(search.getStatus().trim()));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /* reqPath LIKE (앞 일치 시작 부분 검색) */
    private BooleanExpression andPathLike(SyhAccessLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getPath())
                ? syhAccessLog.reqPath.likeIgnoreCase("%" + search.getPath().trim() + "%") : null;
    }

    /* uiNm LIKE (x-ui-nm 화면명) */
    private BooleanExpression andUiNmLike(SyhAccessLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUiNm())
                ? syhAccessLog.uiNm.likeIgnoreCase("%" + search.getUiNm().trim() + "%") : null;
    }

    private BooleanExpression andSearchValueLike(SyhAccessLogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhAccessLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        orders.add(new OrderSpecifier(Order.DESC, syhAccessLog.reqDt));
        orders.add(new OrderSpecifier<>(Order.ASC, syhAccessLog.logId));
        return orders;
    }
}
