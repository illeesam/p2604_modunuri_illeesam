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
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyBatch QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBatchRepositoryImpl implements QSyBatchRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final QSyBatch b = QSyBatch.syBatch;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 배치 키조회 */
    @Override
    public Optional<SyBatchDto.Item> selectById(String batchId) {
        SyBatchDto.Item dto = baseQuery().where(b.batchId.eq(batchId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배치 목록조회 */
    @Override
    public List<SyBatchDto.Item> selectList(SyBatchDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBatchDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andBatchId(search),
                andStatus(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 배치 페이지조회 */
    @Override
    public SyBatchDto.PageResponse selectPageList(SyBatchDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyBatchDto.Item> query = baseQuery().where(
                andSiteId(search),
                andPathId(search),
                andBatchId(search),
                andStatus(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyBatchDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(
                andSiteId(search),
                andPathId(search),
                andBatchId(search),
                andStatus(search),
                andSearchValue(search)
        ).fetchOne();

        SyBatchDto.PageResponse res = new SyBatchDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배치 baseQuery */
    private JPAQuery<SyBatchDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyBatchDto.Item.class,
                        b.batchId, b.siteId, b.batchCode, b.batchNm, b.batchDesc, b.cronExpr,
                        b.batchCycleCd, b.batchLastRun, b.batchNextRun, b.batchRunCount,
                        b.batchStatusCd, b.batchRunStatus, b.batchTimeoutSec, b.batchMemo,
                        b.regBy, b.regDate, b.updBy, b.updDate, b.pathId,
                        ste.siteNm.as("siteNm")
                ))
                .from(b)
                .leftJoin(ste).on(ste.siteId.eq(b.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? b.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? b.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_batch"))
                : null;
    }

    /* batchId 정확 일치 */
    private BooleanExpression andBatchId(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getBatchId())
                ? b.batchId.eq(search.getBatchId()) : null;
    }

    /* batchStatusCd 정확 일치 */
    private BooleanExpression andStatus(SyBatchDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? b.batchStatusCd.eq(search.getStatus()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyBatchDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",batchCode,", b.batchCode, pattern);
        or = orLike(or, all, types, ",batchCycleCd,", b.batchCycleCd, pattern);
        or = orLike(or, all, types, ",batchDesc,", b.batchDesc, pattern);
        or = orLike(or, all, types, ",batchId,", b.batchId, pattern);
        or = orLike(or, all, types, ",batchMemo,", b.batchMemo, pattern);
        or = orLike(or, all, types, ",batchNm,", b.batchNm, pattern);
        or = orLike(or, all, types, ",batchRunStatus,", b.batchRunStatus, pattern);
        or = orLike(or, all, types, ",batchStatusCd,", b.batchStatusCd, pattern);
        or = orLike(or, all, types, ",cronExpr,", b.cronExpr, pattern);
        or = orLike(or, all, types, ",pathId,", b.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", b.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyBatchDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, b.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, b.batchId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("batchId".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.batchId));
                } else if ("batchNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.batchNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, b.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, b.batchId));
        }
        return orders;
    }

    /* 배치 수정 */
    @Override
    public int updateSelective(SyBatch entity) {
        if (entity.getBatchId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(b.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getBatchCode()       != null) { update.set(b.batchCode,       entity.getBatchCode());       hasAny = true; }
        if (entity.getBatchNm()         != null) { update.set(b.batchNm,         entity.getBatchNm());         hasAny = true; }
        if (entity.getBatchDesc()       != null) { update.set(b.batchDesc,       entity.getBatchDesc());       hasAny = true; }
        if (entity.getCronExpr()        != null) { update.set(b.cronExpr,        entity.getCronExpr());        hasAny = true; }
        if (entity.getBatchCycleCd()    != null) { update.set(b.batchCycleCd,    entity.getBatchCycleCd());    hasAny = true; }
        if (entity.getBatchLastRun()    != null) { update.set(b.batchLastRun,    entity.getBatchLastRun());    hasAny = true; }
        if (entity.getBatchNextRun()    != null) { update.set(b.batchNextRun,    entity.getBatchNextRun());    hasAny = true; }
        if (entity.getBatchRunCount()   != null) { update.set(b.batchRunCount,   entity.getBatchRunCount());   hasAny = true; }
        if (entity.getBatchStatusCd()   != null) { update.set(b.batchStatusCd,   entity.getBatchStatusCd());   hasAny = true; }
        if (entity.getBatchRunStatus()  != null) { update.set(b.batchRunStatus,  entity.getBatchRunStatus());  hasAny = true; }
        if (entity.getBatchTimeoutSec() != null) { update.set(b.batchTimeoutSec, entity.getBatchTimeoutSec()); hasAny = true; }
        if (entity.getBatchMemo()       != null) { update.set(b.batchMemo,       entity.getBatchMemo());       hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(b.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(b.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()          != null) { update.set(b.pathId,          entity.getPathId());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.batchId.eq(entity.getBatchId())).execute();
        return (int) affected;
    }
}
