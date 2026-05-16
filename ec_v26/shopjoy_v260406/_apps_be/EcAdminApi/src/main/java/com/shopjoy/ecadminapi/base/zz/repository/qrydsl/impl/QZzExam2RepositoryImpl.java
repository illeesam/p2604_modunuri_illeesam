package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzExam2;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam2;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzExam2Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** ZzExam2 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzExam2RepositoryImpl implements QZzExam2Repository {

    private final JPAQueryFactory queryFactory;
    private static final QZzExam2 e = QZzExam2.zzExam2;

    /* zz_exam2 buildBaseQuery */
    private JPAQuery<ZzExam2Dto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(ZzExam2Dto.Item.class,
                        e.exam1Id,
                        e.exam2Id,
                        e.col21,
                        e.col22,
                        e.col23,
                        e.col24,
                        e.col25,
                        e.regBy,
                        e.regDate,
                        e.updBy,
                        e.updDate
                ))
                .from(e);
    }

    /* zz_exam2 키조회 */
    @Override
    public Optional<ZzExam2Dto.Item> selectById(String exam1Id, String exam2Id) {
        ZzExam2Dto.Item dto = buildBaseQuery()
                .where(e.exam1Id.eq(exam1Id).and(e.exam2Id.eq(exam2Id)))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* zz_exam2 목록조회 */
    @Override
    public List<ZzExam2Dto.Item> selectList(ZzExam2Dto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam2Dto.Item> query = buildBaseQuery().where(where);
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

    /* zz_exam2 페이지조회 */
    @Override
    public ZzExam2Dto.PageResponse selectPageList(ZzExam2Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam2Dto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzExam2Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(e.count())
                .from(e)
                .where(where)
                .fetchOne();

        ZzExam2Dto.PageResponse res = new ZzExam2Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "def_col21,def_col22" */
    private BooleanBuilder buildCondition(ZzExam2Dto.Request search) {
        BooleanBuilder w = new BooleanBuilder();
        if (search == null) return w;

        // ── PK : 다건 IN ──
        if (!CollectionUtils.isEmpty(search.getExam1Ids())) w.and(e.exam1Id.in(search.getExam1Ids()));
        // ── PK : 정확일치 ──
        if (StringUtils.hasText(search.getExam1Id()))     w.and(e.exam1Id.eq(search.getExam1Id()));
        if (StringUtils.hasText(search.getExam2Id()))     w.and(e.exam2Id.eq(search.getExam2Id()));
        // ── PK : 부분검색 ──
        if (StringUtils.hasText(search.getExam1IdLike())) w.and(e.exam1Id.containsIgnoreCase(search.getExam1IdLike()));
        if (StringUtils.hasText(search.getExam2IdLike())) w.and(e.exam2Id.containsIgnoreCase(search.getExam2IdLike()));

        // ── 일반 컬럼 : 부분검색 ──
        if (StringUtils.hasText(search.getCol21())) w.and(e.col21.containsIgnoreCase(search.getCol21()));
        if (StringUtils.hasText(search.getCol22())) w.and(e.col22.containsIgnoreCase(search.getCol22()));
        if (StringUtils.hasText(search.getCol23())) w.and(e.col23.containsIgnoreCase(search.getCol23()));
        if (StringUtils.hasText(search.getCol24())) w.and(e.col24.containsIgnoreCase(search.getCol24()));
        if (StringUtils.hasText(search.getCol25())) w.and(e.col25.containsIgnoreCase(search.getCol25()));

        // ── 통합검색(searchValue + searchType) : 지정 컬럼 OR ──
        if (StringUtils.hasText(search.getSearchValue())) {
            String types = "," + (search.getSearchType() == null ? "" : search.getSearchType().trim()) + ",";
            boolean all  = !StringUtils.hasText(search.getSearchType());
            String v = search.getSearchValue();
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_exam1_id,")) or.or(e.exam1Id.containsIgnoreCase(v));
            if (all || types.contains(",def_exam2_id,")) or.or(e.exam2Id.containsIgnoreCase(v));
            if (all || types.contains(",def_col21,"))     or.or(e.col21.containsIgnoreCase(v));
            if (all || types.contains(",def_col22,"))     or.or(e.col22.containsIgnoreCase(v));
            if (all || types.contains(",def_col23,"))     or.or(e.col23.containsIgnoreCase(v));
            if (all || types.contains(",def_col24,"))     or.or(e.col24.containsIgnoreCase(v));
            if (all || types.contains(",def_col25,"))     or.or(e.col25.containsIgnoreCase(v));
            if (or.getValue() != null) w.and(or);
        }
        return w;
    }

    /* zz_exam2 buildOrder */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzExam2Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, e.exam1Id));
            orders.add(new OrderSpecifier(Order.ASC, e.exam2Id));
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
                }
            }
        }
        return orders;
    }

    /* zz_exam2 수정 */
    @Override
    public int updateSelective(ZzExam2 entity) {
        if (entity.getExam1Id() == null || entity.getExam2Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(e);
        boolean hasAny = false;

        if (entity.getCol21() != null) { update.set(e.col21, entity.getCol21()); hasAny = true; }
        if (entity.getCol22() != null) { update.set(e.col22, entity.getCol22()); hasAny = true; }
        if (entity.getCol23() != null) { update.set(e.col23, entity.getCol23()); hasAny = true; }
        if (entity.getCol24() != null) { update.set(e.col24, entity.getCol24()); hasAny = true; }
        if (entity.getCol25() != null) { update.set(e.col25, entity.getCol25()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update
                .where(e.exam1Id.eq(entity.getExam1Id()).and(e.exam2Id.eq(entity.getExam2Id())))
                .execute();
        return (int) affected;
    }
}
