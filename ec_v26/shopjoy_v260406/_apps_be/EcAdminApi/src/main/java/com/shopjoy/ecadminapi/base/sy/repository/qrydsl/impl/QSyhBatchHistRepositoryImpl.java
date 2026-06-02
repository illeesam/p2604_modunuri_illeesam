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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhBatchHist;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhBatchHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyhBatchHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhBatchHistRepositoryImpl implements QSyhBatchHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhBatchHistRepositoryImpl";
    private static final QSyhBatchHist syhBatchHist   = QSyhBatchHist.syhBatchHist;
    private static final QSySite       sySite = QSySite.sySite;

    /* 배치 실행 이력 baseSelColumnQuery */
    private JPAQuery<SyhBatchHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhBatchHistDto.Item.class,
                        syhBatchHist.batchHistId,
                        syhBatchHist.siteId,
                        syhBatchHist.batchId,
                        syhBatchHist.batchCode,
                        syhBatchHist.batchNm,
                        syhBatchHist.runAt,
                        syhBatchHist.endAt,
                        syhBatchHist.durationMs,
                        syhBatchHist.runStatus,
                        syhBatchHist.procCount,
                        syhBatchHist.errorCount,
                        syhBatchHist.message,
                        syhBatchHist.detail,
                        syhBatchHist.regBy,
                        syhBatchHist.regDate,
                        syhBatchHist.updBy,
                        syhBatchHist.updDate,
                        sySite.siteNm.as("siteNm")
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
                baseAndSiteId(search),
                baseAndBatchHistId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 배치 실행 이력 페이지조회 */
    @Override
    public SyhBatchHistDto.PageResponse selectPageData(SyhBatchHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndBatchHistId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<SyhBatchHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhBatchHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(syhBatchHist.count())
                .from(syhBatchHist)
                .where(wheres)
                .fetchOne();

        SyhBatchHistDto.PageResponse res = new SyhBatchHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyhBatchHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syhBatchHist.siteId.eq(search.getSiteId()) : null;
    }

    /* batchHistId 정확 일치 */
    private BooleanExpression baseAndBatchHistId(SyhBatchHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getBatchHistId())
                ? syhBatchHist.batchHistId.eq(search.getBatchHistId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyhBatchHistDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syhBatchHist.regDate.goe(start).and(syhBatchHist.regDate.lt(endExcl));
            case "upd_date": return syhBatchHist.updDate.goe(start).and(syhBatchHist.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyhBatchHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",batchCode,", syhBatchHist.batchCode, pattern);
        or = orLike(or, all, types, ",batchHistId,", syhBatchHist.batchHistId, pattern);
        or = orLike(or, all, types, ",batchId,", syhBatchHist.batchId, pattern);
        or = orLike(or, all, types, ",batchNm,", syhBatchHist.batchNm, pattern);
        or = orLike(or, all, types, ",detail,", syhBatchHist.detail, pattern);
        or = orLike(or, all, types, ",message,", syhBatchHist.message, pattern);
        or = orLike(or, all, types, ",runStatus,", syhBatchHist.runStatus, pattern);
        or = orLike(or, all, types, ",siteId,", syhBatchHist.siteId, pattern);
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
