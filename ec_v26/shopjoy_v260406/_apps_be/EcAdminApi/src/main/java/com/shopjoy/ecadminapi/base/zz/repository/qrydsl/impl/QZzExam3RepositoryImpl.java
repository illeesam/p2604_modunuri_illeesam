package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzExam3;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam3;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzExam3Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** ZzExam3 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzExam3RepositoryImpl implements QZzExam3Repository {

    private final JPAQueryFactory queryFactory;
    private static final QZzExam3 e = QZzExam3.zzExam3;

    /* zz_exam3 buildBaseQuery */
    private JPAQuery<ZzExam3Dto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(ZzExam3Dto.Item.class,
                        e.exam1Id,
                        e.exam2Id,
                        e.exam3Id,
                        e.col31,
                        e.col32,
                        e.col33,
                        e.col34,
                        e.col35,
                        e.regBy,
                        e.regDate,
                        e.updBy,
                        e.updDate
                ))
                .from(e);
    }

    /* zz_exam3 키조회 */
    @Override
    public Optional<ZzExam3Dto.Item> selectById(String exam1Id, String exam2Id, String exam3Id) {
        ZzExam3Dto.Item dto = buildBaseQuery()
                .where(e.exam1Id.eq(exam1Id)
                        .and(e.exam2Id.eq(exam2Id))
                        .and(e.exam3Id.eq(exam3Id)))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* zz_exam3 목록조회 */
    @Override
    public List<ZzExam3Dto.Item> selectList(ZzExam3Dto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam3Dto.Item> query = buildBaseQuery().where(where);
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

    /* zz_exam3 페이지조회 */
    @Override
    public ZzExam3Dto.PageResponse selectPageList(ZzExam3Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam3Dto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzExam3Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(e.count())
                .from(e)
                .where(where)
                .fetchOne();

        ZzExam3Dto.PageResponse res = new ZzExam3Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "col31,col32" */
    private BooleanBuilder buildCondition(ZzExam3Dto.Request search) {
        BooleanBuilder w = new BooleanBuilder();
        if (search == null) return w;

        // ── PK : 다건 IN ──
        if (!CollectionUtils.isEmpty(search.getExam1Ids())) w.and(e.exam1Id.in(search.getExam1Ids()));
        // ── PK : 정확일치 ──
        if (StringUtils.hasText(search.getExam1Id()))     w.and(e.exam1Id.eq(search.getExam1Id()));
        if (StringUtils.hasText(search.getExam2Id()))     w.and(e.exam2Id.eq(search.getExam2Id()));
        if (StringUtils.hasText(search.getExam3Id()))     w.and(e.exam3Id.eq(search.getExam3Id()));
        // ── PK : 부분검색 ──
        if (StringUtils.hasText(search.getExam1IdLike())) w.and(e.exam1Id.containsIgnoreCase(search.getExam1IdLike()));
        if (StringUtils.hasText(search.getExam2IdLike())) w.and(e.exam2Id.containsIgnoreCase(search.getExam2IdLike()));
        if (StringUtils.hasText(search.getExam3IdLike())) w.and(e.exam3Id.containsIgnoreCase(search.getExam3IdLike()));

        // ── 일반 컬럼 : 부분검색 ──
        if (StringUtils.hasText(search.getCol31())) w.and(e.col31.containsIgnoreCase(search.getCol31()));
        if (StringUtils.hasText(search.getCol32())) w.and(e.col32.containsIgnoreCase(search.getCol32()));
        if (StringUtils.hasText(search.getCol33())) w.and(e.col33.containsIgnoreCase(search.getCol33()));
        if (StringUtils.hasText(search.getCol34())) w.and(e.col34.containsIgnoreCase(search.getCol34()));
        if (StringUtils.hasText(search.getCol35())) w.and(e.col35.containsIgnoreCase(search.getCol35()));

        // ── 통합검색(searchValue + searchType) : 지정 컬럼 OR ──
        if (StringUtils.hasText(search.getSearchValue())) {
            String types = "," + (search.getSearchType() == null ? "" : search.getSearchType().trim()) + ",";
            boolean all  = !StringUtils.hasText(search.getSearchType());
            String v = search.getSearchValue();
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",exam1Id,")) or.or(e.exam1Id.containsIgnoreCase(v));
            if (all || types.contains(",exam2Id,")) or.or(e.exam2Id.containsIgnoreCase(v));
            if (all || types.contains(",exam3Id,")) or.or(e.exam3Id.containsIgnoreCase(v));
            if (all || types.contains(",col31,"))     or.or(e.col31.containsIgnoreCase(v));
            if (all || types.contains(",col32,"))     or.or(e.col32.containsIgnoreCase(v));
            if (all || types.contains(",col33,"))     or.or(e.col33.containsIgnoreCase(v));
            if (all || types.contains(",col34,"))     or.or(e.col34.containsIgnoreCase(v));
            if (all || types.contains(",col35,"))     or.or(e.col35.containsIgnoreCase(v));
            if (or.getValue() != null) w.and(or);
        }
        return w;
    }

    /* zz_exam3 buildOrder */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzExam3Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, e.exam1Id));
            orders.add(new OrderSpecifier(Order.ASC, e.exam2Id));
            orders.add(new OrderSpecifier(Order.ASC, e.exam3Id));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("exam1Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, e.exam1Id));
                } else if ("exam2Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, e.exam2Id));
                } else if ("exam3Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, e.exam3Id));
                }
            }
        }
        return orders;
    }

    /* zz_exam3 수정 */
    @Override
    public int updateSelective(ZzExam3 entity) {
        if (entity.getExam1Id() == null || entity.getExam2Id() == null || entity.getExam3Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(e);
        boolean hasAny = false;

        if (entity.getCol31() != null) { update.set(e.col31, entity.getCol31()); hasAny = true; }
        if (entity.getCol32() != null) { update.set(e.col32, entity.getCol32()); hasAny = true; }
        if (entity.getCol33() != null) { update.set(e.col33, entity.getCol33()); hasAny = true; }
        if (entity.getCol34() != null) { update.set(e.col34, entity.getCol34()); hasAny = true; }
        if (entity.getCol35() != null) { update.set(e.col35, entity.getCol35()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update
                .where(e.exam1Id.eq(entity.getExam1Id())
                        .and(e.exam2Id.eq(entity.getExam2Id()))
                        .and(e.exam3Id.eq(entity.getExam3Id())))
                .execute();
        return (int) affected;
    }
}
