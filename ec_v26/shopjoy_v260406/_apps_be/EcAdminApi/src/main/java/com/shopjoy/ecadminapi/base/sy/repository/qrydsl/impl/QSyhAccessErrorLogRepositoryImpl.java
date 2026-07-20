package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhAccessErrorLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAccessErrorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhAccessErrorLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhAccessErrorLogRepositoryImpl implements QSyhAccessErrorLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhAccessErrorLogRepositoryImpl";
    private static final QSyhAccessErrorLog syhAccessErrorLog = QSyhAccessErrorLog.syhAccessErrorLog;
    private static final QSySite   sySite   = QSySite.sySite;
    private static final QSyUser   syUser   = QSyUser.syUser;
    private static final QSyRole   syRole   = QSyRole.syRole;
    private static final QSyDept   syDept   = QSyDept.syDept;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyCode   cd_at    = new QSyCode("cd_at");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syhAccessErrorLog.regDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("appTypeCd", syhAccessErrorLog.appTypeCd),
        Map.entry("cmdNm", syhAccessErrorLog.cmdNm),
        Map.entry("deptId", syhAccessErrorLog.deptId),
        Map.entry("errorMsg", syhAccessErrorLog.errorMsg),
        Map.entry("errorType", syhAccessErrorLog.errorType),
        Map.entry("fileNm", syhAccessErrorLog.fileNm),
        Map.entry("funcNm", syhAccessErrorLog.funcNm),
        Map.entry("lineNo", syhAccessErrorLog.lineNo),
        Map.entry("localeId", syhAccessErrorLog.localeId),
        Map.entry("logId", syhAccessErrorLog.logId),
        Map.entry("loggerNm", syhAccessErrorLog.loggerNm),
        Map.entry("profile", syhAccessErrorLog.profile),
        Map.entry("reqHost", syhAccessErrorLog.reqHost),
        Map.entry("reqIp", syhAccessErrorLog.reqIp),
        Map.entry("reqMethod", syhAccessErrorLog.reqMethod),
        Map.entry("reqPath", syhAccessErrorLog.reqPath),
        Map.entry("reqQuery", syhAccessErrorLog.reqQuery),
        Map.entry("reqUa", syhAccessErrorLog.reqUa),
        Map.entry("roleId", syhAccessErrorLog.roleId),
        Map.entry("serverNm", syhAccessErrorLog.serverNm),
        Map.entry("siteId", syhAccessErrorLog.siteId),
        Map.entry("stackTrace", syhAccessErrorLog.stackTrace),
        Map.entry("threadNm", syhAccessErrorLog.threadNm),
        Map.entry("traceId", syhAccessErrorLog.traceId),
        Map.entry("uiNm", syhAccessErrorLog.uiNm),
        Map.entry("userId", syhAccessErrorLog.userId),
        Map.entry("vendorId", syhAccessErrorLog.vendorId)
    );

    /*
     * baseSelColumnQuery — list/page/byId 공유 프로젝션 (코드명/연관명 조인 포함 풀필드)
     * 코드성 필드 예시 코드값
     * APP_TYPE  {ADMIN: '관리자', MEMBER: '회원', VENDOR: '업체', ANON: '비로그인'}
     */
    private JPAQuery<SyhAccessErrorLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAccessErrorLogDto.Item.class,
                        syhAccessErrorLog.logId,                    // PK: EL+yyMMddHHmmss+rand4
                        syhAccessErrorLog.siteId,                   // 사이트ID (sy_site.site_id) — 미인증 요청은 null 허용
                        syhAccessErrorLog.reqMethod,                // HTTP 메서드
                        syhAccessErrorLog.reqHost,                  // Host 헤더 값
                        syhAccessErrorLog.reqPath,                  // 요청 URI 경로
                        syhAccessErrorLog.reqQuery,                 // 쿼리 파라미터 문자열
                        syhAccessErrorLog.reqIp,                    // 클라이언트 실제 IP (X-Forwarded-For 우선)
                        syhAccessErrorLog.reqUa,                    // User-Agent
                        syhAccessErrorLog.appTypeCd,                // 호출 앱 유형 — APP_TYPE {ADMIN: '관리자', MEMBER: '회원', VENDOR: '업체', ANON: '비로그인'}
                        syhAccessErrorLog.userId,                   // 인증 사용자 ID (MDC)
                        syhAccessErrorLog.roleId,                   // 역할 ID (MDC)
                        syhAccessErrorLog.deptId,                   // 부서 ID (MDC)
                        syhAccessErrorLog.vendorId,                 // 업체 ID (MDC)
                        syhAccessErrorLog.localeId,                 // 지역 ID (MDC)
                        syhAccessErrorLog.respTimeMs,                // 요청 처리 시간 (밀리초)
                        syhAccessErrorLog.errorType,                 // 예외 클래스 FQCN
                        syhAccessErrorLog.errorMsg,                  // 예외 메시지
                        syhAccessErrorLog.stackTrace,                // 스택 트레이스 (최대 3000자)
                        syhAccessErrorLog.uiNm,                      // 화면명 (X-UI-Nm 헤더)
                        syhAccessErrorLog.cmdNm,                     // 작업명 (X-Cmd-Nm 헤더)
                        syhAccessErrorLog.fileNm,                    // 파일명 (X-헤더)
                        syhAccessErrorLog.funcNm,                    // 함수명 (X-헤더)
                        syhAccessErrorLog.lineNo,                    // 라인번호 (X-헤더)
                        syhAccessErrorLog.traceId,                   // 트레이스ID (X-헤더)
                        syhAccessErrorLog.serverNm,                  // 서버 호스트명
                        syhAccessErrorLog.profile,                   // 활성 Spring 프로파일
                        syhAccessErrorLog.threadNm,                  // 로그 발생 스레드명
                        syhAccessErrorLog.loggerNm,                  // 로거 클래스 이름
                        syhAccessErrorLog.logDt,                     // 에러 발생 시각
                        syhAccessErrorLog.regDate,                   // DB 저장 시각
                        sySite.siteNm.as("siteNm"),                  // 사이트명 (조인: sy_site)
                        cd_at.codeLabel.as("appTypeCdNm"),            // 앱유형 코드명 (조인: sy_code APP_TYPE)
                        syUser.userNm.as("userNm"),                  // 사용자명 (조인: sy_user)
                        syRole.roleNm.as("roleNm"),                  // 역할명 (조인: sy_role)
                        syDept.deptNm.as("deptNm"),                  // 부서명 (조인: sy_dept)
                        syVendor.vendorNm.as("vendorNm")             // 업체명 (조인: sy_vendor)
                ))
                .from(syhAccessErrorLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhAccessErrorLog.siteId))
                .leftJoin(syUser).on(syUser.userId.eq(syhAccessErrorLog.userId))
                .leftJoin(syRole).on(syRole.roleId.eq(syhAccessErrorLog.roleId))
                .leftJoin(syDept).on(syDept.deptId.eq(syhAccessErrorLog.deptId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(syhAccessErrorLog.vendorId))
                .leftJoin(cd_at).on(cd_at.codeGrp.eq("APP_TYPE").and(cd_at.codeValue.eq(syhAccessErrorLog.appTypeCd)));
    }

    /* 단건 상세조회 (코드명/연관명 조인 포함 풀필드 — baseSelColumnQuery 공유) */
    @Override
    public Optional<SyhAccessErrorLogDto.Item> selectById(String id) {
        SyhAccessErrorLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhAccessErrorLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 페이지조회 */
    @Override
    public SyhAccessErrorLogDto.PageResponse selectPageData(SyhAccessErrorLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syhAccessErrorLog.reqMethod, search.getMethod()),
                andPathLike(search),
                andUiNmLike(search),
                QdslUtil.strEqTrim(syhAccessErrorLog.traceId, search.getTraceId()),
                QdslUtil.strEq(syhAccessErrorLog.appTypeCd, search.getAppTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhAccessErrorLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhAccessErrorLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhAccessErrorLog.count())
                .where(wheres)
                .fetchOne();

        SyhAccessErrorLogDto.PageResponse res = new SyhAccessErrorLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* reqPath LIKE (경로 부분 검색) */
    private BooleanExpression andPathLike(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getPath())
                ? syhAccessErrorLog.reqPath.likeIgnoreCase("%" + search.getPath().trim() + "%") : null;
    }

    /* uiNm LIKE (x-ui-nm 화면명) */
    private BooleanExpression andUiNmLike(SyhAccessErrorLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUiNm())
                ? syhAccessErrorLog.uiNm.likeIgnoreCase("%" + search.getUiNm().trim() + "%") : null;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhAccessErrorLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhAccessErrorLog.logDt));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAccessErrorLog.logId));
            return orders;
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhAccessErrorLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAccessErrorLog.logId));
        }
        return orders;
    }
}
