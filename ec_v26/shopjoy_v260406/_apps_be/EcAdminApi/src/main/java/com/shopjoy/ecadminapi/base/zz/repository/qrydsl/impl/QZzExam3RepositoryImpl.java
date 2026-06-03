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
    private static final QZzExam3 zzExam3 = QZzExam3.zzExam3;

    /* zz_exam3 baseSelColumnQuery */
    private JPAQuery<ZzExam3Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzExam3Dto.Item.class,
                        zzExam3.exam1Id,
                        zzExam3.exam2Id,
                        zzExam3.exam3Id,
                        zzExam3.col31,
                        zzExam3.col32,
                        zzExam3.col33,
                        zzExam3.col34,
                        zzExam3.col35,
                        zzExam3.regBy,
                        zzExam3.regDate,
                        zzExam3.updBy,
                        zzExam3.updDate
                ))
                .from(zzExam3);
    }

    /* zz_exam3 키조회 */
    @Override
    public Optional<ZzExam3Dto.Item> selectById(String exam1Id, String exam2Id, String exam3Id) {
        ZzExam3Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzExam3.exam1Id.eq(exam1Id)
                        .and(zzExam3.exam2Id.eq(exam2Id))
                        .and(zzExam3.exam3Id.eq(exam3Id)))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* zz_exam3 목록조회 */
    @Override
    public List<ZzExam3Dto.Item> selectList(ZzExam3Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam3Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndExam1Ids(search),
                baseAndExam1Id(search),
                baseAndExam2Id(search),
                baseAndExam3Id(search),
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

    /* zz_exam3 페이지조회 */
    @Override
    public ZzExam3Dto.PageResponse selectPageData(ZzExam3Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndExam1Ids(search),
                baseAndExam1Id(search),
                baseAndExam2Id(search),
                baseAndExam3Id(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<ZzExam3Dto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<ZzExam3Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzExam3.count())
                .where(wheres)
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
    private BooleanExpression baseAndExam1Ids(ZzExam3Dto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getExam1Ids())
                ? zzExam3.exam1Id.in(search.getExam1Ids()) : null;
    }

    /* exam1Id 정확 일치 */
    private BooleanExpression baseAndExam1Id(ZzExam3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getExam1Id())
                ? zzExam3.exam1Id.eq(search.getExam1Id()) : null;
    }

    /* exam2Id 정확 일치 */
    private BooleanExpression baseAndExam2Id(ZzExam3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getExam2Id())
                ? zzExam3.exam2Id.eq(search.getExam2Id()) : null;
    }

    /* exam3Id 정확 일치 */
    private BooleanExpression baseAndExam3Id(ZzExam3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getExam3Id())
                ? zzExam3.exam3Id.eq(search.getExam3Id()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(ZzExam3Dto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",col31,", zzExam3.col31, pattern);
        or = orLike(or, all, types, ",col32,", zzExam3.col32, pattern);
        or = orLike(or, all, types, ",col33,", zzExam3.col33, pattern);
        or = orLike(or, all, types, ",col34,", zzExam3.col34, pattern);
        or = orLike(or, all, types, ",col35,", zzExam3.col35, pattern);
        or = orLike(or, all, types, ",exam1Id,", zzExam3.exam1Id, pattern);
        or = orLike(or, all, types, ",exam2Id,", zzExam3.exam2Id, pattern);
        or = orLike(or, all, types, ",exam3Id,", zzExam3.exam3Id, pattern);
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
            orders.add(new OrderSpecifier(Order.ASC, zzExam3.exam1Id));
            orders.add(new OrderSpecifier(Order.ASC, zzExam3.exam2Id));
            orders.add(new OrderSpecifier(Order.ASC, zzExam3.exam3Id));
            orders.add(new OrderSpecifier<>(Order.ASC, zzExam3.exam1Id));
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
                    orders.add(new OrderSpecifier(order, zzExam3.exam1Id));
                } else if ("exam2Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzExam3.exam2Id));
                } else if ("exam3Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzExam3.exam3Id));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, zzExam3.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzExam3.exam1Id));
        }
        return orders;
    }

    /* zz_exam3 수정 */
    @Override
    public int updateSelective(ZzExam3 entity) {
        if (entity.getExam1Id() == null || entity.getExam2Id() == null || entity.getExam3Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzExam3);
        boolean hasAny = false;

        if (entity.getCol31() != null) { update.set(zzExam3.col31, entity.getCol31()); hasAny = true; }
        if (entity.getCol32() != null) { update.set(zzExam3.col32, entity.getCol32()); hasAny = true; }
        if (entity.getCol33() != null) { update.set(zzExam3.col33, entity.getCol33()); hasAny = true; }
        if (entity.getCol34() != null) { update.set(zzExam3.col34, entity.getCol34()); hasAny = true; }
        if (entity.getCol35() != null) { update.set(zzExam3.col35, entity.getCol35()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update
                .where(zzExam3.exam1Id.eq(entity.getExam1Id())
                        .and(zzExam3.exam2Id.eq(entity.getExam2Id()))
                        .and(zzExam3.exam3Id.eq(entity.getExam3Id())))
                .execute();
        return (int) affected;
    }
}
