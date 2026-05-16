package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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
    private static final QSyhBatchHist h   = QSyhBatchHist.syhBatchHist;
    private static final QSySite       ste = QSySite.sySite;

    private JPAQuery<SyhBatchHistDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhBatchHistDto.Item.class,
                        h.batchHistId,
                        h.siteId,
                        h.batchId,
                        h.batchCode,
                        h.batchNm,
                        h.runAt,
                        h.endAt,
                        h.durationMs,
                        h.runStatus,
                        h.procCount,
                        h.errorCount,
                        h.message,
                        h.detail,
                        h.regBy,
                        h.regDate,
                        h.updBy,
                        h.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(h)
                .leftJoin(ste).on(ste.siteId.eq(h.siteId));
    }

    @Override
    public Optional<SyhBatchHistDto.Item> selectById(String id) {
        SyhBatchHistDto.Item dto = buildBaseQuery()
                .where(h.batchHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyhBatchHistDto.Item> selectList(SyhBatchHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhBatchHistDto.Item> query = buildBaseQuery().where(where);
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

    @Override
    public SyhBatchHistDto.PageResponse selectPageList(SyhBatchHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhBatchHistDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhBatchHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(h.count())
                .from(h)
                .where(where)
                .fetchOne();

        SyhBatchHistDto.PageResponse res = new SyhBatchHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
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
    private BooleanBuilder buildCondition(SyhBatchHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBatchHistId())) w.and(h.batchHistId.eq(s.getBatchHistId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_batchNm,")) or.or(h.batchNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(h.regDate.goe(start)).and(h.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(h.updDate.goe(start)).and(h.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
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
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
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
                    orders.add(new OrderSpecifier(order, h.batchHistId));
                } else if ("batchNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.batchNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(SyhBatchHist entity) {
        if (entity.getBatchHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(h.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getBatchId()    != null) { update.set(h.batchId,    entity.getBatchId());    hasAny = true; }
        if (entity.getBatchCode()  != null) { update.set(h.batchCode,  entity.getBatchCode());  hasAny = true; }
        if (entity.getBatchNm()    != null) { update.set(h.batchNm,    entity.getBatchNm());    hasAny = true; }
        if (entity.getRunAt()      != null) { update.set(h.runAt,      entity.getRunAt());      hasAny = true; }
        if (entity.getEndAt()      != null) { update.set(h.endAt,      entity.getEndAt());      hasAny = true; }
        if (entity.getDurationMs() != null) { update.set(h.durationMs, entity.getDurationMs()); hasAny = true; }
        if (entity.getRunStatus()  != null) { update.set(h.runStatus,  entity.getRunStatus());  hasAny = true; }
        if (entity.getProcCount()  != null) { update.set(h.procCount,  entity.getProcCount());  hasAny = true; }
        if (entity.getErrorCount() != null) { update.set(h.errorCount, entity.getErrorCount()); hasAny = true; }
        if (entity.getMessage()    != null) { update.set(h.message,    entity.getMessage());    hasAny = true; }
        if (entity.getDetail()     != null) { update.set(h.detail,     entity.getDetail());     hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(h.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(h.updDate,    entity.getUpdDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.batchHistId.eq(entity.getBatchHistId())).execute();
        return (int) affected;
    }
}
