package com.shopjoy.ecBeBo.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhAccessLogDto;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyDept;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyRole;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyhAccessLog;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyhAccessLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** SyhAccessLog(API 요청/응답 액세스 로그 (비동기 선택 수집)) QueryDSL Custom 구현체 */
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
    private static final QVwSyCode   codeAppTypeCd    = new QVwSyCode("codeAppTypeCd");
    /*
     * baseSelColumnQuery — list/page/byId 공유 프로젝션 (코드명/연관명 조인 포함 풀필드)
     * 코드성 필드 예시 코드값
     * APP_TYPE  {ADMIN: '관리자', MEMBER: '회원', VENDOR: '업체', ANON: '비로그인'}
     */
    private JPAQuery<SyhAccessLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAccessLogDto.Item.class,
                        syhAccessLog.logId,                     // PK: AL+yyMMddHHmmss+rand4
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
                        codeAppTypeCd.codeLabel.as("appTypeCdNm"),        // 앱유형 코드명 (조인: sy_code APP_TYPE)
                        syUser.userNm.as("userNm"),              // 사용자명 (조인: sy_user)
                        syRole.roleNm.as("roleNm"),              // 역할명 (조인: sy_role)
                        syDept.deptNm.as("deptNm"),              // 부서명 (조인: sy_dept)
                        syVendor.vendorNm.as("vendorNm")         // 업체명 (조인: sy_vendor)
                ))
                .from(syhAccessLog)
                .leftJoin(syUser).on(syUser.userId.eq(syhAccessLog.userId)) // 사용자
                .leftJoin(syRole).on(syRole.roleId.eq(syhAccessLog.roleId)) // 역할
                .leftJoin(syDept).on(syDept.deptId.eq(syhAccessLog.deptId)) // 부서
                .leftJoin(syVendor).on(syVendor.vendorId.eq(syhAccessLog.vendorId)) // 업체
                .leftJoin(codeAppTypeCd).on(codeAppTypeCd.codeGrp.eq("APP_TYPE").and(codeAppTypeCd.codeValue.eq(syhAccessLog.appTypeCd))) // 앱유형
                ;
    }

    /* 단건 상세조회 (코드명/연관명 조인 포함 풀필드 — baseSelColumnQuery 공유) */
    @Override
    public Optional<SyhAccessLogDto.Item> selectById(String id) {
        SyhAccessLogDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhAccessLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* buildWheres — selectList/selectPageData 가 동일 조건을 공유하도록 추출 */
    private BooleanExpression[] buildWheres(SyhAccessLogDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhAccessLog.reqMethod, search.getMethod())); // HTTP 메서드 검색값
        whereList.add(andStatusEq(search));
        whereList.add(andPathLike(search));
        whereList.add(andUiNmLike(search));
        whereList.add(QdslUtil.strEqTrim(syhAccessLog.traceId, search.getTraceId())); // 요청 추적ID 검색값
        whereList.add(QdslUtil.strEq(syhAccessLog.appTypeCd, search.getAppTypeCd())); // 호출 앱 유형 검색값
        whereList.add(QdslUtil.dateBetween(syhAccessLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        return whereList.toArray(BooleanExpression[]::new);
    }

    /* 목록조회 — 대량 export 청크용. COUNT 를 돌지 않아 selectPageData 보다 가볍다 */
    @Override
    public List<SyhAccessLogDto.Item> selectList(SyhAccessLogDto.Request search) {
        JPAQuery<SyhAccessLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(buildWheres(search))
                .orderBy(buildOrder(QdslUtil.sortOf(search)).toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long) (pageNo - 1) * pageSize).limit(pageSize);
        }
        List<SyhAccessLogDto.Item> list = query.fetch();
        return list;
    }

    /* 페이지조회 */
    @Override
    public BasePage<SyhAccessLogDto.Item> selectPageData(SyhAccessLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = buildWheres(search);

        JPAQuery<SyhAccessLogDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhAccessLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhAccessLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhAccessLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

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

    /* searchType 예: "appTypeCd,cmdNm,deptId,fileNm,funcNm" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("appTypeCd", syhAccessLog.appTypeCd), // 호출 앱 유형 검색값
            QdslUtil.FieldDef.like("cmdNm", syhAccessLog.cmdNm), // 호출 명령명 (X-Cmd-Nm)
            QdslUtil.FieldDef.like("deptId", syhAccessLog.deptId), // 부서 ID (MDC)
            QdslUtil.FieldDef.like("fileNm", syhAccessLog.fileNm), // 호출 파일명 (X-헤더)
            QdslUtil.FieldDef.like("funcNm", syhAccessLog.funcNm), // 호출 함수명 (X-헤더)
            QdslUtil.FieldDef.like("lineNo", syhAccessLog.lineNo), // 호출 라인번호 (X-헤더)
            QdslUtil.FieldDef.like("localeId", syhAccessLog.localeId), // 지역 ID (MDC)
            QdslUtil.FieldDef.like("logId", syhAccessLog.logId), // PK: AL+yyMMddHHmmss+rand4
            QdslUtil.FieldDef.like("profile", syhAccessLog.profile), // 활성 Spring 프로파일
            QdslUtil.FieldDef.like("reqBody", syhAccessLog.reqBody), // 요청 바디 (설정된 최대 크기까지)
            QdslUtil.FieldDef.like("reqHost", syhAccessLog.reqHost), // Host 헤더 값
            QdslUtil.FieldDef.like("reqIp", syhAccessLog.reqIp), // 클라이언트 실제 IP
            QdslUtil.FieldDef.like("reqMethod", syhAccessLog.reqMethod), // HTTP 메서드
            QdslUtil.FieldDef.like("reqPath", syhAccessLog.reqPath), // 요청 URI 경로
            QdslUtil.FieldDef.like("reqQuery", syhAccessLog.reqQuery), // 쿼리 파라미터 문자열
            QdslUtil.FieldDef.like("reqUa", syhAccessLog.reqUa), // User-Agent
            QdslUtil.FieldDef.like("respBody", syhAccessLog.respBody), // 응답 바디 (설정된 최대 크기까지)
            QdslUtil.FieldDef.like("roleId", syhAccessLog.roleId), // 역할 ID
            QdslUtil.FieldDef.like("serverNm", syhAccessLog.serverNm), // 서버 호스트명
            QdslUtil.FieldDef.like("threadNm", syhAccessLog.threadNm), // 처리 스레드명
            QdslUtil.FieldDef.like("traceId", syhAccessLog.traceId), // 요청 추적ID 검색값
            QdslUtil.FieldDef.like("uiNm", syhAccessLog.uiNm), // 호출 화면명(X-UI-Nm) 검색값
            QdslUtil.FieldDef.like("userId", syhAccessLog.userId), // 인증 사용자 ID
            QdslUtil.FieldDef.like("vendorId", syhAccessLog.vendorId) // 업체 ID (MDC)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of(),
        new OrderSpecifier<>(Order.ASC, syhAccessLog.logId));
    }
}
