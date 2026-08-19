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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
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
    private static final QVwSyCode   cd_at    = new QVwSyCode("cd_at");
    /*
     * baseSelColumnQuery — list/page/byId 공유 프로젝션 (코드명/연관명 조인 포함 풀필드)
     * 코드성 필드 예시 코드값
     * APP_TYPE  {ADMIN: '관리자', MEMBER: '회원', VENDOR: '업체', ANON: '비로그인'}
     */
    private JPAQuery<SyhAccessErrorLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAccessErrorLogDto.Item.class,
                        syhAccessErrorLog.logId,                    // PK: EL+yyMMddHHmmss+rand4
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
                        cd_at.codeLabel.as("appTypeCdNm"),            // 앱유형 코드명 (조인: sy_code APP_TYPE)
                        syUser.userNm.as("userNm"),                  // 사용자명 (조인: sy_user)
                        syRole.roleNm.as("roleNm"),                  // 역할명 (조인: sy_role)
                        syDept.deptNm.as("deptNm"),                  // 부서명 (조인: sy_dept)
                        syVendor.vendorNm.as("vendorNm")             // 업체명 (조인: sy_vendor)
                ))
                .from(syhAccessErrorLog)
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

    /* buildWheres — selectList/selectPageData 가 동일 조건을 공유하도록 추출 */
    private BooleanExpression[] buildWheres(SyhAccessErrorLogDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhAccessErrorLog.reqMethod, search.getMethod()));
        whereList.add(andPathLike(search));
        whereList.add(andUiNmLike(search));
        whereList.add(QdslUtil.strEqTrim(syhAccessErrorLog.traceId, search.getTraceId()));
        whereList.add(QdslUtil.strEq(syhAccessErrorLog.appTypeCd, search.getAppTypeCd()));
        whereList.add(QdslUtil.dateBetween(syhAccessErrorLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        return whereList.toArray(BooleanExpression[]::new);
    }

    /* 목록조회 — 대량 export 청크용. COUNT 를 돌지 않아 selectPageData 보다 가볍다 */
    @Override
    public List<SyhAccessErrorLogDto.Item> selectList(SyhAccessErrorLogDto.Request search) {
        JPAQuery<SyhAccessErrorLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(buildWheres(search))
                .orderBy(buildOrder(QdslUtil.sortOf(search)).toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long) (pageNo - 1) * pageSize).limit(pageSize);
        }
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public BasePage<SyhAccessErrorLogDto.Item> selectPageData(SyhAccessErrorLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = buildWheres(search);

        JPAQuery<SyhAccessErrorLogDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhAccessErrorLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhAccessErrorLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhAccessErrorLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */

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

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("appTypeCd", syhAccessErrorLog.appTypeCd),
            QdslUtil.FieldDef.like("cmdNm", syhAccessErrorLog.cmdNm),
            QdslUtil.FieldDef.like("deptId", syhAccessErrorLog.deptId),
            QdslUtil.FieldDef.like("errorMsg", syhAccessErrorLog.errorMsg),
            QdslUtil.FieldDef.like("errorType", syhAccessErrorLog.errorType),
            QdslUtil.FieldDef.like("fileNm", syhAccessErrorLog.fileNm),
            QdslUtil.FieldDef.like("funcNm", syhAccessErrorLog.funcNm),
            QdslUtil.FieldDef.like("lineNo", syhAccessErrorLog.lineNo),
            QdslUtil.FieldDef.like("localeId", syhAccessErrorLog.localeId),
            QdslUtil.FieldDef.like("logId", syhAccessErrorLog.logId),
            QdslUtil.FieldDef.like("loggerNm", syhAccessErrorLog.loggerNm),
            QdslUtil.FieldDef.like("profile", syhAccessErrorLog.profile),
            QdslUtil.FieldDef.like("reqHost", syhAccessErrorLog.reqHost),
            QdslUtil.FieldDef.like("reqIp", syhAccessErrorLog.reqIp),
            QdslUtil.FieldDef.like("reqMethod", syhAccessErrorLog.reqMethod),
            QdslUtil.FieldDef.like("reqPath", syhAccessErrorLog.reqPath),
            QdslUtil.FieldDef.like("reqQuery", syhAccessErrorLog.reqQuery),
            QdslUtil.FieldDef.like("reqUa", syhAccessErrorLog.reqUa),
            QdslUtil.FieldDef.like("roleId", syhAccessErrorLog.roleId),
            QdslUtil.FieldDef.like("serverNm", syhAccessErrorLog.serverNm),
            QdslUtil.FieldDef.like("stackTrace", syhAccessErrorLog.stackTrace),
            QdslUtil.FieldDef.like("threadNm", syhAccessErrorLog.threadNm),
            QdslUtil.FieldDef.like("traceId", syhAccessErrorLog.traceId),
            QdslUtil.FieldDef.like("uiNm", syhAccessErrorLog.uiNm),
            QdslUtil.FieldDef.like("userId", syhAccessErrorLog.userId),
            QdslUtil.FieldDef.like("vendorId", syhAccessErrorLog.vendorId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of(),
        new OrderSpecifier<>(Order.DESC, syhAccessErrorLog.regDate),
        new OrderSpecifier<>(Order.ASC, syhAccessErrorLog.logId));
    }
}
