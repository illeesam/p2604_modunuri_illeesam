package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyBatch QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBatchRepositoryImpl implements QSyBatchRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyBatch b = QSyBatch.syBatch;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyBatchDto.Item> selectById(String batchId) {
        SyBatchDto.Item dto = baseQuery().where(b.batchId.eq(batchId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyBatchDto.Item> selectList(SyBatchDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBatchDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyBatchDto.PageResponse selectPageList(SyBatchDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyBatchDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyBatchDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(where).fetchOne();

        SyBatchDto.PageResponse res = new SyBatchDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

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

    // searchTypes 사용 예 (콤마 경계 매칭):
    //   - 단일 조건  : searchTypes = "def_blog_title"
    //   - 복합 조건  : searchTypes = "def_blog_title,def_blog_author"   (UI 에서 aaa,bbb 형태로 전달)
    //   - 미지정     : searchTypes = null/"" 이면 all=true 로 전체 컬럼 OR 검색
    //
    //   buildCondition 내부에서는
    //     String types = "," + searchTypes + ",";   // 예: ",def_blog_title,def_blog_author,"
    //     types.contains(",def_blog_title,")         // 토큰 경계 정확 매칭 (부분문자열 오매칭 방지)
    //   형태로 비교한다.
    private BooleanBuilder buildCondition(SyBatchDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))  w.and(b.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBatchId())) w.and(b.batchId.eq(s.getBatchId()));
        if (StringUtils.hasText(s.getPathId()))  w.and(b.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getStatus()))  w.and(b.batchStatusCd.eq(s.getStatus()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_name,")) or.or(b.batchNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_code,")) or.or(b.batchCode.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(b.regDate.goe(ds.atStartOfDay())).and(b.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(b.updDate.goe(ds.atStartOfDay())).and(b.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
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
        return orders;
    }

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
        if (entity.getUpdDate()         != null) { update.set(b.updDate,         entity.getUpdDate());         hasAny = true; }
        if (entity.getPathId()          != null) { update.set(b.pathId,          entity.getPathId());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.batchId.eq(entity.getBatchId())).execute();
        return (int) affected;
    }
}
