package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample1;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample1Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** ZzSample1 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample1RepositoryImpl implements QZzSample1Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample1RepositoryImpl";
    private static final QZzSample1 a = QZzSample1.zzSample1;

    /* buildBaseQuery */
    private JPAQuery<ZzSample1Dto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample1Dto.Item.class,
                        a.sample1Id,
                        a.cdGrp,
                        a.cdVl,
                        a.cdNm,
                        a.srtordVl,
                        a.attrNm1,
                        a.attrNm2,
                        a.attrNm3,
                        a.attrNm4,
                        a.explnCn,
                        a.cdInfwSeCd,
                        a.useYn,
                        a.regBy,
                        a.regDate,
                        a.updBy,
                        a.updDate,
                        a.groupCd,
                        a.col01,
                        a.col02,
                        a.col03,
                        a.col04,
                        a.col05,
                        a.col06,
                        a.col07,
                        a.col08,
                        a.col09,
                        a.statusCd,
                        a.typeCd,
                        a.divCd,
                        a.kindCd,
                        a.cateCds
                ))
                .from(a);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample1Dto.Item> selectById(String id) {
        ZzSample1Dto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(a.sample1Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample1Dto.Item> selectList(ZzSample1Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample1Dto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSample1Ids(search),
                baseAndSample1Id(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
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
    public ZzSample1Dto.PageResponse selectPageList(ZzSample1Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample1Dto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                baseAndSample1Ids(search),
                baseAndSample1Id(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzSample1Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSample1Ids(search),
                baseAndSample1Id(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        ZzSample1Dto.PageResponse res = new ZzSample1Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(a), andDeptId(a), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* sample1Id IN */
    private BooleanExpression baseAndSample1Ids(ZzSample1Dto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getSample1Ids())
                ? a.sample1Id.in(search.getSample1Ids()) : null;
    }

    /* sample1Id 정확 일치 */
    private BooleanExpression baseAndSample1Id(ZzSample1Dto.Request search) {
        return search != null && StringUtils.hasText(search.getSample1Id())
                ? a.sample1Id.eq(search.getSample1Id()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(ZzSample1Dto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? a.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(ZzSample1Dto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attrNm1,", a.attrNm1, pattern);
        or = orLike(or, all, types, ",attrNm2,", a.attrNm2, pattern);
        or = orLike(or, all, types, ",attrNm3,", a.attrNm3, pattern);
        or = orLike(or, all, types, ",attrNm4,", a.attrNm4, pattern);
        or = orLike(or, all, types, ",cateCds,", a.cateCds, pattern);
        or = orLike(or, all, types, ",cdGrp,", a.cdGrp, pattern);
        or = orLike(or, all, types, ",cdInfwSeCd,", a.cdInfwSeCd, pattern);
        or = orLike(or, all, types, ",cdNm,", a.cdNm, pattern);
        or = orLike(or, all, types, ",cdVl,", a.cdVl, pattern);
        or = orLike(or, all, types, ",col01,", a.col01, pattern);
        or = orLike(or, all, types, ",col02,", a.col02, pattern);
        or = orLike(or, all, types, ",col03,", a.col03, pattern);
        or = orLike(or, all, types, ",col04,", a.col04, pattern);
        or = orLike(or, all, types, ",col05,", a.col05, pattern);
        or = orLike(or, all, types, ",col06,", a.col06, pattern);
        or = orLike(or, all, types, ",col07,", a.col07, pattern);
        or = orLike(or, all, types, ",col08,", a.col08, pattern);
        or = orLike(or, all, types, ",col09,", a.col09, pattern);
        or = orLike(or, all, types, ",divCd,", a.divCd, pattern);
        or = orLike(or, all, types, ",explnCn,", a.explnCn, pattern);
        or = orLike(or, all, types, ",groupCd,", a.groupCd, pattern);
        or = orLike(or, all, types, ",kindCd,", a.kindCd, pattern);
        or = orLike(or, all, types, ",sample1Id,", a.sample1Id, pattern);
        or = orLike(or, all, types, ",statusCd,", a.statusCd, pattern);
        or = orLike(or, all, types, ",typeCd,", a.typeCd, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(ZzSample1Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.sample1Id));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sample1Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.sample1Id));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.sample1Id));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample1 entity) {
        if (entity.getSample1Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getCdGrp()      != null) { update.set(a.cdGrp,      entity.getCdGrp());      hasAny = true; }
        if (entity.getCdVl()       != null) { update.set(a.cdVl,       entity.getCdVl());       hasAny = true; }
        if (entity.getCdNm()       != null) { update.set(a.cdNm,       entity.getCdNm());       hasAny = true; }
        if (entity.getSrtordVl()   != null) { update.set(a.srtordVl,   entity.getSrtordVl());   hasAny = true; }
        if (entity.getAttrNm1()    != null) { update.set(a.attrNm1,    entity.getAttrNm1());    hasAny = true; }
        if (entity.getAttrNm2()    != null) { update.set(a.attrNm2,    entity.getAttrNm2());    hasAny = true; }
        if (entity.getAttrNm3()    != null) { update.set(a.attrNm3,    entity.getAttrNm3());    hasAny = true; }
        if (entity.getAttrNm4()    != null) { update.set(a.attrNm4,    entity.getAttrNm4());    hasAny = true; }
        if (entity.getExplnCn()    != null) { update.set(a.explnCn,    entity.getExplnCn());    hasAny = true; }
        if (entity.getCdInfwSeCd() != null) { update.set(a.cdInfwSeCd, entity.getCdInfwSeCd()); hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(a.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(a.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(a.updDate,    entity.getUpdDate());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(a.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(a.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(a.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(a.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(a.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(a.cateCds,    entity.getCateCds());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.sample1Id.eq(entity.getSample1Id())).execute();
        return (int) affected;
    }
}
