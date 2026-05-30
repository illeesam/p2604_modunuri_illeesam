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
    private static final QZzSample0 s = QZzSample0.zzSample0;

    /* buildBaseQuery */
    private JPAQuery<ZzSample0Dto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample0Dto.Item.class,
                        s.sample0Id,
                        s.sampleName,
                        s.sampleDesc,
                        s.sampleValue,
                        s.sortOrd,
                        s.useYn,
                        s.regBy,
                        s.regDate,
                        s.updBy,
                        s.updDate,
                        s.col01,
                        s.col02,
                        s.col03,
                        s.col04,
                        s.col05,
                        s.col06,
                        s.col07,
                        s.col08,
                        s.col09
                ))
                .from(s);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample0Dto.Item> selectById(String id) {
        ZzSample0Dto.Item dto = buildBaseQuery()
                .where(s.sample0Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample0Dto.Item> selectList(ZzSample0Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample0Dto.Item> query = buildBaseQuery().where(
                andSample0Id(search),
                andUseYn(search),
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

    /* 페이지조회 */
    @Override
    public ZzSample0Dto.PageResponse selectPageList(ZzSample0Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample0Dto.Item> query = buildBaseQuery().where(
                andSample0Id(search),
                andUseYn(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzSample0Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(s.count())
                .from(s)
                .where(
                andSample0Id(search),
                andUseYn(search),
                andSearchValue(search)
        )
                .fetchOne();

        ZzSample0Dto.PageResponse res = new ZzSample0Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* sample0Id 정확 일치 */
    private BooleanExpression andSample0Id(ZzSample0Dto.Request search) {
        return search != null && StringUtils.hasText(search.getSample0Id())
                ? s.sample0Id.eq(search.getSample0Id()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(ZzSample0Dto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? s.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(ZzSample0Dto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",col01,", s.col01, pattern);
        or = orLike(or, all, types, ",col02,", s.col02, pattern);
        or = orLike(or, all, types, ",col03,", s.col03, pattern);
        or = orLike(or, all, types, ",col04,", s.col04, pattern);
        or = orLike(or, all, types, ",col05,", s.col05, pattern);
        or = orLike(or, all, types, ",col06,", s.col06, pattern);
        or = orLike(or, all, types, ",col07,", s.col07, pattern);
        or = orLike(or, all, types, ",col08,", s.col08, pattern);
        or = orLike(or, all, types, ",col09,", s.col09, pattern);
        or = orLike(or, all, types, ",sample0Id,", s.sample0Id, pattern);
        or = orLike(or, all, types, ",sampleDesc,", s.sampleDesc, pattern);
        or = orLike(or, all, types, ",sampleName,", s.sampleName, pattern);
        or = orLike(or, all, types, ",sampleValue,", s.sampleValue, pattern);
        or = orLike(or, all, types, ",useYn,", s.useYn, pattern);
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
            orders.add(new OrderSpecifier(Order.ASC, s.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, s.sample0Id));
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
                    orders.add(new OrderSpecifier(order, s.sample0Id));
                } else if ("sampleName".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.sampleName));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, s.sortOrd)); }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.sample0Id));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample0 entity) {
        if (entity.getSample0Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSampleName()  != null) { update.set(s.sampleName,  entity.getSampleName());  hasAny = true; }
        if (entity.getSampleDesc()  != null) { update.set(s.sampleDesc,  entity.getSampleDesc());  hasAny = true; }
        if (entity.getSampleValue() != null) { update.set(s.sampleValue, entity.getSampleValue()); hasAny = true; }
        if (entity.getSortOrd()     != null) { update.set(s.sortOrd,     entity.getSortOrd());     hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(s.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(s.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(s.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.sample0Id.eq(entity.getSample0Id())).execute();
        return (int) affected;
    }
}
