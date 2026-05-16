package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzExam1;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam1;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzExam1Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** ZzExam1 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzExam1RepositoryImpl implements QZzExam1Repository {

    private final JPAQueryFactory queryFactory;
    private static final QZzExam1 e = QZzExam1.zzExam1;

    /* zz_exam1 buildBaseQuery */
    private JPAQuery<ZzExam1Dto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(ZzExam1Dto.Item.class,
                        e.exam1Id,
                        e.col11,
                        e.col12,
                        e.col13,
                        e.col14,
                        e.col15,
                        e.regBy,
                        e.regDate,
                        e.updBy,
                        e.updDate
                ))
                .from(e);
    }

    /* zz_exam1 키조회 */
    @Override
    public Optional<ZzExam1Dto.Item> selectById(String exam1Id) {
        ZzExam1Dto.Item dto = buildBaseQuery()
                .where(e.exam1Id.eq(exam1Id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* zz_exam1 목록조회 */
    @Override
    public List<ZzExam1Dto.Item> selectList(ZzExam1Dto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam1Dto.Item> query = buildBaseQuery().where(where);
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

    /* zz_exam1 페이지조회 */
    @Override
    public ZzExam1Dto.PageResponse selectPageList(ZzExam1Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam1Dto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzExam1Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(e.count())
                .from(e)
                .where(where)
                .fetchOne();

        ZzExam1Dto.PageResponse res = new ZzExam1Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "col11,col12" */
    private BooleanBuilder buildCondition(ZzExam1Dto.Request search) {
        BooleanBuilder w = new BooleanBuilder();
        if (search == null) return w;

        // ── PK : 정확일치 ──
        if (StringUtils.hasText(search.getExam1Id()))     w.and(e.exam1Id.eq(search.getExam1Id()));
        // ── PK : 부분검색 ──
        if (StringUtils.hasText(search.getExam1IdLike())) w.and(e.exam1Id.containsIgnoreCase(search.getExam1IdLike()));

        // ── 일반 컬럼 : 부분검색 ──
        if (StringUtils.hasText(search.getCol11())) w.and(e.col11.containsIgnoreCase(search.getCol11()));
        if (StringUtils.hasText(search.getCol12())) w.and(e.col12.containsIgnoreCase(search.getCol12()));
        if (StringUtils.hasText(search.getCol13())) w.and(e.col13.containsIgnoreCase(search.getCol13()));
        if (StringUtils.hasText(search.getCol14())) w.and(e.col14.containsIgnoreCase(search.getCol14()));
        if (StringUtils.hasText(search.getCol15())) w.and(e.col15.containsIgnoreCase(search.getCol15()));

        // ── 통합검색(searchValue + searchType) : 지정 컬럼 OR ──
        if (StringUtils.hasText(search.getSearchValue())) {
            String types = "," + (search.getSearchType() == null ? "" : search.getSearchType().trim()) + ",";
            boolean all  = !StringUtils.hasText(search.getSearchType());
            String v = search.getSearchValue();
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",exam1Id,")) or.or(e.exam1Id.containsIgnoreCase(v));
            if (all || types.contains(",col11,"))     or.or(e.col11.containsIgnoreCase(v));
            if (all || types.contains(",col12,"))     or.or(e.col12.containsIgnoreCase(v));
            if (all || types.contains(",col13,"))     or.or(e.col13.containsIgnoreCase(v));
            if (all || types.contains(",col14,"))     or.or(e.col14.containsIgnoreCase(v));
            if (all || types.contains(",col15,"))     or.or(e.col15.containsIgnoreCase(v));
            if (or.getValue() != null) w.and(or);
        }
        return w;
    }

    /* zz_exam1 buildOrder */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzExam1Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, e.exam1Id));
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
                }
            }
        }
        return orders;
    }

    /* zz_exam1 수정 */
    @Override
    public int updateSelective(ZzExam1 entity) {
        if (entity.getExam1Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(e);
        boolean hasAny = false;

        if (entity.getCol11() != null) { update.set(e.col11, entity.getCol11()); hasAny = true; }
        if (entity.getCol12() != null) { update.set(e.col12, entity.getCol12()); hasAny = true; }
        if (entity.getCol13() != null) { update.set(e.col13, entity.getCol13()); hasAny = true; }
        if (entity.getCol14() != null) { update.set(e.col14, entity.getCol14()); hasAny = true; }
        if (entity.getCol15() != null) { update.set(e.col15, entity.getCol15()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(e.exam1Id.eq(entity.getExam1Id())).execute();
        return (int) affected;
    }
}
