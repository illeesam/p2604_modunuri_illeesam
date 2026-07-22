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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhApiLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhApiLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhApiLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhApiLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhApiLogRepositoryImpl implements QSyhApiLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhApiLogRepositoryImpl";
    private static final QSyhApiLog syhApiLog   = QSyhApiLog.syhApiLog;
    private static final QSySite    sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syhApiLog.regDate,
        "upd_date", syhApiLog.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("apiNm", syhApiLog.apiNm),
        Map.entry("apiTypeCd", syhApiLog.apiTypeCd),
        Map.entry("cmdNm", syhApiLog.cmdNm),
        Map.entry("endpoint", syhApiLog.endpoint),
        Map.entry("errorMsg", syhApiLog.errorMsg),
        Map.entry("logId", syhApiLog.logId),
        Map.entry("methodCd", syhApiLog.methodCd),
        Map.entry("refId", syhApiLog.refId),
        Map.entry("refTypeCd", syhApiLog.refTypeCd),
        Map.entry("reqBody", syhApiLog.reqBody),
        Map.entry("resBody", syhApiLog.resBody),
        Map.entry("resultCd", syhApiLog.resultCd),
        Map.entry("siteId", syhApiLog.siteId),
        Map.entry("uiNm", syhApiLog.uiNm)
    );

    /*
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
                        syhApiLog.siteId,         // 사이트ID
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
                        syhApiLog.updDate,        // 수정일시
                        sySite.siteNm.as("siteNm")  // 사이트명 (조인: sy_site)
                ))
                .from(syhApiLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhApiLog.siteId));
    }

    /* API 로그 키조회 */
    @Override
    public Optional<SyhApiLogDto.Item> selectById(String id) {
        SyhApiLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhApiLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* API 로그 목록조회 */
    @Override
    public List<SyhApiLogDto.Item> selectList(SyhApiLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhApiLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syhApiLog.siteId, search.getSiteId()),
                QdslUtil.strEq(syhApiLog.logId, search.getLogId()),
                QdslUtil.strEq(syhApiLog.apiTypeCd, search.getTypeCd()),
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

    /* API 로그 페이지조회 */
    @Override
    public SyhApiLogDto.PageResponse selectPageData(SyhApiLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syhApiLog.siteId, search.getSiteId()),
                QdslUtil.strEq(syhApiLog.logId, search.getLogId()),
                QdslUtil.strEq(syhApiLog.apiTypeCd, search.getTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhApiLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhApiLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhApiLog.count())
                .where(wheres)
                .fetchOne();

        SyhApiLogDto.PageResponse res = new SyhApiLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyhApiLogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhApiLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhApiLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhApiLog.logId));
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
                    orders.add(new OrderSpecifier(order, syhApiLog.logId));
                } else if ("apiNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhApiLog.apiNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhApiLog.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhApiLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhApiLog.logId));
        }
        return orders;
    }

    /* API 로그 수정 */
    @Override
    public int updateSelective(SyhApiLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhApiLog);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(syhApiLog.siteId,     entity.getSiteId());     hasAny = true; }
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhApiLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhApiLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
