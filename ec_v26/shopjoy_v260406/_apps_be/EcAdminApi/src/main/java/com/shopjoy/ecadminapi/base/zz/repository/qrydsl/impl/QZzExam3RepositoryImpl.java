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
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** ZzExam3 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzExam3RepositoryImpl implements QZzExam3Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzExam3RepositoryImpl";
    private static final QZzExam3 zzExam3 = QZzExam3.zzExam3;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("col31", zzExam3.col31),
        Map.entry("col32", zzExam3.col32),
        Map.entry("col33", zzExam3.col33),
        Map.entry("col34", zzExam3.col34),
        Map.entry("col35", zzExam3.col35),
        Map.entry("exam1Id", zzExam3.exam1Id),
        Map.entry("exam2Id", zzExam3.exam2Id),
        Map.entry("exam3Id", zzExam3.exam3Id)
    );

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
                QdslUtil.strIn(zzExam3.exam1Id, search.getExam1Ids()),
                QdslUtil.strEq(zzExam3.exam1Id, search.getExam1Id()),
                QdslUtil.strEq(zzExam3.exam2Id, search.getExam2Id()),
                QdslUtil.strEq(zzExam3.exam3Id, search.getExam3Id()),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
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
                QdslUtil.strIn(zzExam3.exam1Id, search.getExam1Ids()),
                QdslUtil.strEq(zzExam3.exam1Id, search.getExam1Id()),
                QdslUtil.strEq(zzExam3.exam2Id, search.getExam2Id()),
                QdslUtil.strEq(zzExam3.exam3Id, search.getExam3Id()),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
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
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */


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
