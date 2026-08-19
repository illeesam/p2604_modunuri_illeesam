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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhApiLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhApiLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhApiLogRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhApiLog(외부 API 연동 로그) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhApiLogRepositoryImpl implements QSyhApiLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhApiLogRepositoryImpl";
    private static final QSyhApiLog syhApiLog   = QSyhApiLog.syhApiLog;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 미등록, Entity 주석 기준 예시값)
     * apiTypeCd  {PG: 'PG결제', LOGISTICS: '물류/택배', KAKAO: '카카오', NAVER: '네이버', SMS: 'SMS'}
     * resultCd   {SUCCESS: '성공', FAIL: '실패'}
     * refTypeCd  {ORDER: '주문', DLIV: '배송', PUSH: '푸시'}
     */
    /* API 로그 baseSelColumnQuery */
    private JPAQuery<SyhApiLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhApiLogDto.Item.class,
                        syhApiLog.logId,          // 로그ID (PK, YYMMDDhhmmss+rand4)
                        syhApiLog.apiTypeCd,      // 연동유형코드 — {PG: 'PG결제', LOGISTICS: '물류/택배', KAKAO: '카카오', NAVER: '네이버', SMS: 'SMS'}
                        syhApiLog.apiNm,          // API명 (예: 결제승인)
                        syhApiLog.uiNm,           // 화면명 (X-UI-Nm 헤더)
                        syhApiLog.cmdNm,          // 작업명 (X-Cmd-Nm 헤더)
                        syhApiLog.methodCd,       // HTTP 메서드
                        syhApiLog.endpoint,       // 호출 URL
                        syhApiLog.reqBody,        // 요청 파라미터 (민감정보 마스킹 처리)
                        syhApiLog.resBody,        // 응답 본문
                        syhApiLog.httpStatus,     // HTTP 응답코드
                        syhApiLog.resultCd,       // 처리결과 — {SUCCESS: '성공', FAIL: '실패'}
                        syhApiLog.errorMsg,       // 오류 메시지
                        syhApiLog.elapsedMs,      // 응답시간 (밀리초)
                        syhApiLog.refTypeCd,      // 연관유형코드 — {ORDER: '주문', DLIV: '배송', PUSH: '푸시'}
                        syhApiLog.refId,          // 연관ID
                        syhApiLog.callDate,       // API 호출일시
                        syhApiLog.regBy,          // 등록자
                        syhApiLog.regDate,        // 등록일시
                        syhApiLog.updBy,          // 수정자
                        syhApiLog.updDate        // 수정일시
                ))
                .from(syhApiLog);
    }

    /* API 로그 키조회 */
    @Override
    public Optional<SyhApiLogDto.Item> selectById(String id) {
        SyhApiLogDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhApiLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* API 로그 목록조회 */
    @Override
    public List<SyhApiLogDto.Item> selectList(SyhApiLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhApiLog.logId, search.getLogId()));
        whereList.add(QdslUtil.strEq(syhApiLog.apiTypeCd, search.getTypeCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhApiLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhApiLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyhApiLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyhApiLogDto.Item> list = query.fetch();
        return list;
    }

    /* API 로그 페이지조회 */
    @Override
    public BasePage<SyhApiLogDto.Item> selectPageData(SyhApiLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhApiLog.logId, search.getLogId()));
        whereList.add(QdslUtil.strEq(syhApiLog.apiTypeCd, search.getTypeCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhApiLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhApiLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyhApiLogDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhApiLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhApiLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhApiLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("apiNm", syhApiLog.apiNm),
            QdslUtil.FieldDef.like("apiTypeCd", syhApiLog.apiTypeCd),
            QdslUtil.FieldDef.like("cmdNm", syhApiLog.cmdNm),
            QdslUtil.FieldDef.like("endpoint", syhApiLog.endpoint),
            QdslUtil.FieldDef.like("errorMsg", syhApiLog.errorMsg),
            QdslUtil.FieldDef.like("logId", syhApiLog.logId),
            QdslUtil.FieldDef.like("methodCd", syhApiLog.methodCd),
            QdslUtil.FieldDef.like("refId", syhApiLog.refId),
            QdslUtil.FieldDef.like("refTypeCd", syhApiLog.refTypeCd),
            QdslUtil.FieldDef.like("reqBody", syhApiLog.reqBody),
            QdslUtil.FieldDef.like("resBody", syhApiLog.resBody),
            QdslUtil.FieldDef.like("resultCd", syhApiLog.resultCd),
            QdslUtil.FieldDef.like("uiNm", syhApiLog.uiNm)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("logId", syhApiLog.logId,
                   "apiNm", syhApiLog.apiNm,
                   "regDate", syhApiLog.regDate),
        new OrderSpecifier<>(Order.DESC, syhApiLog.regDate),
        new OrderSpecifier<>(Order.ASC, syhApiLog.logId));
    }

    /* API 로그 수정 */
    @Override
    public int updateSelective(SyhApiLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhApiLog);
        boolean hasAny = false;

        if (entity.getApiTypeCd()  != null) { update.set(syhApiLog.apiTypeCd,  entity.getApiTypeCd());  hasAny = true; }
        if (entity.getApiNm()      != null) { update.set(syhApiLog.apiNm,      entity.getApiNm());      hasAny = true; }
        if (entity.getUiNm()       != null) { update.set(syhApiLog.uiNm,       entity.getUiNm());       hasAny = true; }
        if (entity.getCmdNm()      != null) { update.set(syhApiLog.cmdNm,      entity.getCmdNm());      hasAny = true; }
        if (entity.getMethodCd()   != null) { update.set(syhApiLog.methodCd,   entity.getMethodCd());   hasAny = true; }
        if (entity.getEndpoint()   != null) { update.set(syhApiLog.endpoint,   entity.getEndpoint());   hasAny = true; }
        if (entity.getReqBody()    != null) { update.set(syhApiLog.reqBody,    entity.getReqBody());    hasAny = true; }
        if (entity.getResBody()    != null) { update.set(syhApiLog.resBody,    entity.getResBody());    hasAny = true; }
        if (entity.getHttpStatus() != null) { update.set(syhApiLog.httpStatus, entity.getHttpStatus()); hasAny = true; }
        if (entity.getResultCd()   != null) { update.set(syhApiLog.resultCd,   entity.getResultCd());   hasAny = true; }
        if (entity.getErrorMsg()   != null) { update.set(syhApiLog.errorMsg,   entity.getErrorMsg());   hasAny = true; }
        if (entity.getElapsedMs()  != null) { update.set(syhApiLog.elapsedMs,  entity.getElapsedMs());  hasAny = true; }
        if (entity.getRefTypeCd()  != null) { update.set(syhApiLog.refTypeCd,  entity.getRefTypeCd());  hasAny = true; }
        if (entity.getRefId()      != null) { update.set(syhApiLog.refId,      entity.getRefId());      hasAny = true; }
        if (entity.getCallDate()   != null) { update.set(syhApiLog.callDate,   entity.getCallDate());   hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(syhApiLog.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(syhApiLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhApiLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
