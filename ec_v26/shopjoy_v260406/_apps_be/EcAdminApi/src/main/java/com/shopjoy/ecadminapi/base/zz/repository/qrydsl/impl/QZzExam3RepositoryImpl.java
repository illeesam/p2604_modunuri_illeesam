package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
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
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzExam3RepositoryImpl";
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
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(e.exam1Id.eq(exam1Id)
                        .and(e.exam2Id.eq(exam2Id))
                        .and(e.exam3Id.eq(exam3Id)))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* zz_exam3 목록조회 */
    @Override
    public List<ZzExam3Dto.Item> selectList(ZzExam3Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam3Dto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andExam1Ids(search),
                andExam1Id(search),
                andExam2Id(search),
                andExam3Id(search),
                andSearchValue(search)
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

    /* zz_exam3 페이지조회 */
    @Override
    public ZzExam3Dto.PageResponse selectPageList(ZzExam3Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam3Dto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andExam1Ids(search),
                andExam1Id(search),
                andExam2Id(search),
                andExam3Id(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzExam3Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(e.count())
                .from(e)
                .where(
                andExam1Ids(search),
                andExam1Id(search),
                andExam2Id(search),
                andExam3Id(search),
                andSearchValue(search)
        )
                .fetchOne();

        ZzExam3Dto.PageResponse res = new ZzExam3Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "col31,col32" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* exam1Id IN */
    private BooleanExpression andExam1Ids(ZzExam3Dto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getExam1Ids())
                ? e.exam1Id.in(search.getExam1Ids()) : null;
    }

    /* exam1Id 정확 일치 */
    private BooleanExpression andExam1Id(ZzExam3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getExam1Id())
                ? e.exam1Id.eq(search.getExam1Id()) : null;
    }

    /* exam2Id 정확 일치 */
    private BooleanExpression andExam2Id(ZzExam3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getExam2Id())
                ? e.exam2Id.eq(search.getExam2Id()) : null;
    }

    /* exam3Id 정확 일치 */
    private BooleanExpression andExam3Id(ZzExam3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getExam3Id())
                ? e.exam3Id.eq(search.getExam3Id()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(ZzExam3Dto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",col31,", e.col31, pattern);
        or = orLike(or, all, types, ",col32,", e.col32, pattern);
        or = orLike(or, all, types, ",col33,", e.col33, pattern);
        or = orLike(or, all, types, ",col34,", e.col34, pattern);
        or = orLike(or, all, types, ",col35,", e.col35, pattern);
        or = orLike(or, all, types, ",exam1Id,", e.exam1Id, pattern);
        or = orLike(or, all, types, ",exam2Id,", e.exam2Id, pattern);
        or = orLike(or, all, types, ",exam3Id,", e.exam3Id, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
            orders.add(new OrderSpecifier<>(Order.ASC, e.exam1Id));
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
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, e.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, e.exam1Id));
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
