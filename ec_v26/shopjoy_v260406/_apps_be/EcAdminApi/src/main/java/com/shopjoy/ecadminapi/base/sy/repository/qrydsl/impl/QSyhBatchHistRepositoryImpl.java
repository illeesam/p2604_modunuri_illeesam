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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhBatchHist;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhBatchHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhBatchHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhBatchHistRepositoryImpl implements QSyhBatchHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhBatchHistRepositoryImpl";
    private static final QSyhBatchHist syhBatchHist   = QSyhBatchHist.syhBatchHist;
    private static final QSySite       sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syhBatchHist.regDate,
        "upd_date", syhBatchHist.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("batchCode", syhBatchHist.batchCode),
        Map.entry("batchHistId", syhBatchHist.batchHistId),
        Map.entry("batchId", syhBatchHist.batchId),
        Map.entry("batchNm", syhBatchHist.batchNm),
        Map.entry("detail", syhBatchHist.detail),
        Map.entry("message", syhBatchHist.message),
        Map.entry("runStatus", syhBatchHist.runStatus),
        Map.entry("siteId", syhBatchHist.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 미등록, Entity 주석 기준 예시값)
     * runStatus  {SUCCESS: '성공', FAILED: '실패', TIMEOUT: '시간초과'}
     */
    /* 배치 실행 이력 baseSelColumnQuery */
    private JPAQuery<SyhBatchHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhBatchHistDto.Item.class,
                        syhBatchHist.batchHistId,   // 이력ID (PK)
                        syhBatchHist.siteId,        // 사이트ID (sy_site.site_id)
                        syhBatchHist.batchId,       // 배치ID
                        syhBatchHist.batchCode,     // 배치코드
                        syhBatchHist.batchNm,       // 배치명
                        syhBatchHist.runAt,         // 실행시작일시
                        syhBatchHist.endAt,         // 실행종료일시
                        syhBatchHist.durationMs,    // 실행시간(ms)
                        syhBatchHist.runStatus,     // 실행결과 — {SUCCESS: '성공', FAILED: '실패', TIMEOUT: '시간초과'}
                        syhBatchHist.procCount,     // 처리건수
                        syhBatchHist.errorCount,    // 오류건수
                        syhBatchHist.message,       // 결과메시지
                        syhBatchHist.detail,        // 상세로그 (JSON)
                        syhBatchHist.regBy,         // 등록자
                        syhBatchHist.regDate,       // 등록일시
                        syhBatchHist.updBy,         // 수정자
                        syhBatchHist.updDate,       // 수정일시
                        sySite.siteNm.as("siteNm")  // 사이트명 (조인: sy_site)
                ))
                .from(syhBatchHist)
                .leftJoin(sySite).on(sySite.siteId.eq(syhBatchHist.siteId));
    }

    /* 배치 실행 이력 키조회 */
    @Override
    public Optional<SyhBatchHistDto.Item> selectById(String id) {
        SyhBatchHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhBatchHist.batchHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배치 실행 이력 목록조회 */
    @Override
    public List<SyhBatchHistDto.Item> selectList(SyhBatchHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhBatchHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syhBatchHist.siteId, search.getSiteId()),
                QdslUtil.strEq(syhBatchHist.batchHistId, search.getBatchHistId()),
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

    /* 배치 실행 이력 페이지조회 */
    @Override
    public SyhBatchHistDto.PageResponse selectPageData(SyhBatchHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syhBatchHist.siteId, search.getSiteId()),
                QdslUtil.strEq(syhBatchHist.batchHistId, search.getBatchHistId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhBatchHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhBatchHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhBatchHist.count())
                .where(wheres)
                .fetchOne();

        SyhBatchHistDto.PageResponse res = new SyhBatchHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyhBatchHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhBatchHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhBatchHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhBatchHist.batchHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("batchHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhBatchHist.batchHistId));
                } else if ("batchNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhBatchHist.batchNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhBatchHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhBatchHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhBatchHist.batchHistId));
        }
        return orders;
    }

    /* 배치 실행 이력 수정 */
    @Override
    public int updateSelective(SyhBatchHist entity) {
        if (entity.getBatchHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhBatchHist);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(syhBatchHist.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getBatchId()    != null) { update.set(syhBatchHist.batchId,    entity.getBatchId());    hasAny = true; }
        if (entity.getBatchCode()  != null) { update.set(syhBatchHist.batchCode,  entity.getBatchCode());  hasAny = true; }
        if (entity.getBatchNm()    != null) { update.set(syhBatchHist.batchNm,    entity.getBatchNm());    hasAny = true; }
        if (entity.getRunAt()      != null) { update.set(syhBatchHist.runAt,      entity.getRunAt());      hasAny = true; }
        if (entity.getEndAt()      != null) { update.set(syhBatchHist.endAt,      entity.getEndAt());      hasAny = true; }
        if (entity.getDurationMs() != null) { update.set(syhBatchHist.durationMs, entity.getDurationMs()); hasAny = true; }
        if (entity.getRunStatus()  != null) { update.set(syhBatchHist.runStatus,  entity.getRunStatus());  hasAny = true; }
        if (entity.getProcCount()  != null) { update.set(syhBatchHist.procCount,  entity.getProcCount());  hasAny = true; }
        if (entity.getErrorCount() != null) { update.set(syhBatchHist.errorCount, entity.getErrorCount()); hasAny = true; }
        if (entity.getMessage()    != null) { update.set(syhBatchHist.message,    entity.getMessage());    hasAny = true; }
        if (entity.getDetail()     != null) { update.set(syhBatchHist.detail,     entity.getDetail());     hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(syhBatchHist.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhBatchHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhBatchHist.batchHistId.eq(entity.getBatchHistId())).execute();
        return (int) affected;
    }
}
