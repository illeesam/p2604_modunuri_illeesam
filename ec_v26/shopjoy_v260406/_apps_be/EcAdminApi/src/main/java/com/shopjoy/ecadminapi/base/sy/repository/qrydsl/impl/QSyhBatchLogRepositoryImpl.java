package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhBatchLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyhBatchLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhBatchLogRepositoryImpl implements QSyhBatchLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhBatchLogRepositoryImpl";
    private static final QSyhBatchLog syhBatchLog   = QSyhBatchLog.syhBatchLog;
    private static final QSySite      sySite = QSySite.sySite;

    /* 배치 로그 baseSelColumnQuery */
    private JPAQuery<SyhBatchLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhBatchLogDto.Item.class,
                        syhBatchLog.batchLogId,
                        syhBatchLog.siteId,
                        syhBatchLog.batchId,
                        syhBatchLog.batchCode,
                        syhBatchLog.batchNm,
                        syhBatchLog.runAt,
                        syhBatchLog.endAt,
                        syhBatchLog.durationMs,
                        syhBatchLog.runStatus,
                        syhBatchLog.procCount,
                        syhBatchLog.errorCount,
                        syhBatchLog.message,
                        syhBatchLog.detail,
                        syhBatchLog.regBy,
                        syhBatchLog.regDate,
                        syhBatchLog.updBy,
                        syhBatchLog.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syhBatchLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhBatchLog.siteId));
    }

    /* 배치 로그 키조회 */
    @Override
    public Optional<SyhBatchLogDto.Item> selectById(String id) {
        SyhBatchLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhBatchLog.batchLogId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배치 로그 목록조회 */
    @Override
    public List<SyhBatchLogDto.Item> selectList(SyhBatchLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhBatchLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndBatchLogId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 배치 로그 페이지조회 */
    @Override
    public SyhBatchLogDto.PageResponse selectPageData(SyhBatchLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndBatchLogId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhBatchLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhBatchLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhBatchLog.count())
                .where(wheres)
                .fetchOne();

        SyhBatchLogDto.PageResponse res = new SyhBatchLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyhBatchLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syhBatchLog.siteId.eq(search.getSiteId()) : null;
    }

    /* batchLogId 정확 일치 */
    private BooleanExpression baseAndBatchLogId(SyhBatchLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getBatchLogId())
                ? syhBatchLog.batchLogId.eq(search.getBatchLogId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyhBatchLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syhBatchLog.regDate.goe(start).and(syhBatchLog.regDate.lt(endExcl));
            case "upd_date": return syhBatchLog.updDate.goe(start).and(syhBatchLog.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyhBatchLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",batchCode,", syhBatchLog.batchCode, pattern);
        or = orLike(or, all, types, ",batchId,", syhBatchLog.batchId, pattern);
        or = orLike(or, all, types, ",batchLogId,", syhBatchLog.batchLogId, pattern);
        or = orLike(or, all, types, ",batchNm,", syhBatchLog.batchNm, pattern);
        or = orLike(or, all, types, ",detail,", syhBatchLog.detail, pattern);
        or = orLike(or, all, types, ",message,", syhBatchLog.message, pattern);
        or = orLike(or, all, types, ",runStatus,", syhBatchLog.runStatus, pattern);
        or = orLike(or, all, types, ",siteId,", syhBatchLog.siteId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhBatchLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhBatchLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhBatchLog.batchLogId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("batchLogId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhBatchLog.batchLogId));
                } else if ("batchNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhBatchLog.batchNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhBatchLog.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhBatchLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhBatchLog.batchLogId));
        }
        return orders;
    }

    /* 배치 로그 수정 */
    @Override
    public int updateSelective(SyhBatchLog entity) {
        if (entity.getBatchLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhBatchLog);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(syhBatchLog.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getBatchId()    != null) { update.set(syhBatchLog.batchId,    entity.getBatchId());    hasAny = true; }
        if (entity.getBatchCode()  != null) { update.set(syhBatchLog.batchCode,  entity.getBatchCode());  hasAny = true; }
        if (entity.getBatchNm()    != null) { update.set(syhBatchLog.batchNm,    entity.getBatchNm());    hasAny = true; }
        if (entity.getRunAt()      != null) { update.set(syhBatchLog.runAt,      entity.getRunAt());      hasAny = true; }
        if (entity.getEndAt()      != null) { update.set(syhBatchLog.endAt,      entity.getEndAt());      hasAny = true; }
        if (entity.getDurationMs() != null) { update.set(syhBatchLog.durationMs, entity.getDurationMs()); hasAny = true; }
        if (entity.getRunStatus()  != null) { update.set(syhBatchLog.runStatus,  entity.getRunStatus());  hasAny = true; }
        if (entity.getProcCount()  != null) { update.set(syhBatchLog.procCount,  entity.getProcCount());  hasAny = true; }
        if (entity.getErrorCount() != null) { update.set(syhBatchLog.errorCount, entity.getErrorCount()); hasAny = true; }
        if (entity.getMessage()    != null) { update.set(syhBatchLog.message,    entity.getMessage());    hasAny = true; }
        if (entity.getDetail()     != null) { update.set(syhBatchLog.detail,     entity.getDetail());     hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(syhBatchLog.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhBatchLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhBatchLog.batchLogId.eq(entity.getBatchLogId())).execute();
        return (int) affected;
    }
}
