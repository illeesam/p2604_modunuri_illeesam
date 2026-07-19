package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample0;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample0;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample0Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** ZzSample0 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample0RepositoryImpl implements QZzSample0Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample0RepositoryImpl";
    private static final QZzSample0 zzSample0 = QZzSample0.zzSample0;

    /* baseSelColumnQuery */
    private JPAQuery<ZzSample0Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample0Dto.Item.class,
                        zzSample0.sample0Id,
                        zzSample0.sampleName,
                        zzSample0.sampleDesc,
                        zzSample0.sampleValue,
                        zzSample0.sortOrd,
                        zzSample0.useYn,
                        zzSample0.regBy,
                        zzSample0.regDate,
                        zzSample0.updBy,
                        zzSample0.updDate,
                        zzSample0.col01,
                        zzSample0.col02,
                        zzSample0.col03,
                        zzSample0.col04,
                        zzSample0.col05,
                        zzSample0.col06,
                        zzSample0.col07,
                        zzSample0.col08,
                        zzSample0.col09
                ))
                .from(zzSample0);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample0Dto.Item> selectById(String id) {
        ZzSample0Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzSample0.sample0Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample0Dto.Item> selectList(ZzSample0Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample0Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSample0IdEq(search),
                andUseYnEq(search),
                andSearchValueLike(search)
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

    /* 페이지조회 */
    @Override
    public ZzSample0Dto.PageResponse selectPageData(ZzSample0Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSample0IdEq(search),
                andUseYnEq(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<ZzSample0Dto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<ZzSample0Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzSample0.count())
                .where(wheres)
                .fetchOne();

        ZzSample0Dto.PageResponse res = new ZzSample0Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(a), andDeptId(a), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* sample0Id 정확 일치 */
    private BooleanExpression andSample0IdEq(ZzSample0Dto.Request search) {
        return search != null && StringUtils.hasText(search.getSample0Id())
                ? zzSample0.sample0Id.eq(search.getSample0Id()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYnEq(ZzSample0Dto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? zzSample0.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(ZzSample0Dto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",col01,", zzSample0.col01, pattern);
        or = orLike(or, all, types, ",col02,", zzSample0.col02, pattern);
        or = orLike(or, all, types, ",col03,", zzSample0.col03, pattern);
        or = orLike(or, all, types, ",col04,", zzSample0.col04, pattern);
        or = orLike(or, all, types, ",col05,", zzSample0.col05, pattern);
        or = orLike(or, all, types, ",col06,", zzSample0.col06, pattern);
        or = orLike(or, all, types, ",col07,", zzSample0.col07, pattern);
        or = orLike(or, all, types, ",col08,", zzSample0.col08, pattern);
        or = orLike(or, all, types, ",col09,", zzSample0.col09, pattern);
        or = orLike(or, all, types, ",sample0Id,", zzSample0.sample0Id, pattern);
        or = orLike(or, all, types, ",sampleDesc,", zzSample0.sampleDesc, pattern);
        or = orLike(or, all, types, ",sampleName,", zzSample0.sampleName, pattern);
        or = orLike(or, all, types, ",sampleValue,", zzSample0.sampleValue, pattern);
        or = orLike(or, all, types, ",useYn,", zzSample0.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(ZzSample0Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, zzSample0.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample0.sample0Id));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sample0Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample0.sample0Id));
                } else if ("sampleName".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample0.sampleName));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample0.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, zzSample0.sortOrd)); }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, zzSample0.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample0.sample0Id));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample0 entity) {
        if (entity.getSample0Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzSample0);
        boolean hasAny = false;

        if (entity.getSampleName()  != null) { update.set(zzSample0.sampleName,  entity.getSampleName());  hasAny = true; }
        if (entity.getSampleDesc()  != null) { update.set(zzSample0.sampleDesc,  entity.getSampleDesc());  hasAny = true; }
        if (entity.getSampleValue() != null) { update.set(zzSample0.sampleValue, entity.getSampleValue()); hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(zzSample0.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(zzSample0.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(zzSample0.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(zzSample0.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(zzSample0.sample0Id.eq(entity.getSample0Id())).execute();
        return (int) affected;
    }
}
