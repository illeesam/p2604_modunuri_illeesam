package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
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
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzExam2RepositoryImpl";
    private static final QZzExam2 zzExam2 = QZzExam2.zzExam2;

    /* zz_exam2 baseSelColumnQuery */
    private JPAQuery<ZzExam2Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzExam2Dto.Item.class,
                        zzExam2.exam1Id,
                        zzExam2.exam2Id,
                        zzExam2.col21,
                        zzExam2.col22,
                        zzExam2.col23,
                        zzExam2.col24,
                        zzExam2.col25,
                        zzExam2.regBy,
                        zzExam2.regDate,
                        zzExam2.updBy,
                        zzExam2.updDate
                ))
                .from(zzExam2);
    }

    /* zz_exam2 키조회 */
    @Override
    public Optional<ZzExam2Dto.Item> selectById(String exam1Id, String exam2Id) {
        ZzExam2Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzExam2.exam1Id.eq(exam1Id).and(zzExam2.exam2Id.eq(exam2Id)))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* zz_exam2 목록조회 */
    @Override
    public List<ZzExam2Dto.Item> selectList(ZzExam2Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzExam2Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndExam1Ids(search),
                baseAndExam1Id(search),
                baseAndExam2Id(search),
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

    /* zz_exam2 페이지조회 */
    @Override
    public ZzExam2Dto.PageResponse selectPageData(ZzExam2Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndExam1Ids(search),
                baseAndExam1Id(search),
                baseAndExam2Id(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<ZzExam2Dto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<ZzExam2Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzExam2.count())
                .where(wheres)
                .fetchOne();

        ZzExam2Dto.PageResponse res = new ZzExam2Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "col21,col22" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* exam1Id IN */
    private BooleanExpression baseAndExam1Ids(ZzExam2Dto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getExam1Ids())
                ? zzExam2.exam1Id.in(search.getExam1Ids()) : null;
    }

    /* exam1Id 정확 일치 */
    private BooleanExpression baseAndExam1Id(ZzExam2Dto.Request search) {
        return search != null && StringUtils.hasText(search.getExam1Id())
                ? zzExam2.exam1Id.eq(search.getExam1Id()) : null;
    }

    /* exam2Id 정확 일치 */
    private BooleanExpression baseAndExam2Id(ZzExam2Dto.Request search) {
        return search != null && StringUtils.hasText(search.getExam2Id())
                ? zzExam2.exam2Id.eq(search.getExam2Id()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(ZzExam2Dto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",col21,", zzExam2.col21, pattern);
        or = orLike(or, all, types, ",col22,", zzExam2.col22, pattern);
        or = orLike(or, all, types, ",col23,", zzExam2.col23, pattern);
        or = orLike(or, all, types, ",col24,", zzExam2.col24, pattern);
        or = orLike(or, all, types, ",col25,", zzExam2.col25, pattern);
        or = orLike(or, all, types, ",exam1Id,", zzExam2.exam1Id, pattern);
        or = orLike(or, all, types, ",exam2Id,", zzExam2.exam2Id, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    /* zz_exam2 buildOrder */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzExam2Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, zzExam2.exam1Id));
            orders.add(new OrderSpecifier(Order.ASC, zzExam2.exam2Id));
            orders.add(new OrderSpecifier<>(Order.ASC, zzExam2.exam1Id));
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
                    orders.add(new OrderSpecifier(order, zzExam2.exam1Id));
                } else if ("exam2Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzExam2.exam2Id));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, zzExam2.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzExam2.exam1Id));
        }
        return orders;
    }

    /* zz_exam2 수정 */
    @Override
    public int updateSelective(ZzExam2 entity) {
        if (entity.getExam1Id() == null || entity.getExam2Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzExam2);
        boolean hasAny = false;

        if (entity.getCol21() != null) { update.set(zzExam2.col21, entity.getCol21()); hasAny = true; }
        if (entity.getCol22() != null) { update.set(zzExam2.col22, entity.getCol22()); hasAny = true; }
        if (entity.getCol23() != null) { update.set(zzExam2.col23, entity.getCol23()); hasAny = true; }
        if (entity.getCol24() != null) { update.set(zzExam2.col24, entity.getCol24()); hasAny = true; }
        if (entity.getCol25() != null) { update.set(zzExam2.col25, entity.getCol25()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update
                .where(zzExam2.exam1Id.eq(entity.getExam1Id()).and(zzExam2.exam2Id.eq(entity.getExam2Id())))
                .execute();
        return (int) affected;
    }
}
