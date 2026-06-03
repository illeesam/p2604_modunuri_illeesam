package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample2;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample2Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** ZzSample2 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample2RepositoryImpl implements QZzSample2Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample2RepositoryImpl";
    private static final QZzSample2 zzSample2 = QZzSample2.zzSample2;

    /* baseSelColumnQuery */
    private JPAQuery<ZzSample2Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample2Dto.Item.class,
                        zzSample2.sample2Id,
                        zzSample2.cdGrp,
                        zzSample2.cdVl,
                        zzSample2.cdNm,
                        zzSample2.srtordVl,
                        zzSample2.attrNm1,
                        zzSample2.attrNm2,
                        zzSample2.attrNm3,
                        zzSample2.attrNm4,
                        zzSample2.explnCn,
                        zzSample2.cdInfwSeCd,
                        zzSample2.useYn,
                        zzSample2.regBy,
                        zzSample2.regDate,
                        zzSample2.updBy,
                        zzSample2.updDate,
                        zzSample2.groupCd,
                        zzSample2.col01,
                        zzSample2.col02,
                        zzSample2.col03,
                        zzSample2.col04,
                        zzSample2.col05,
                        zzSample2.col06,
                        zzSample2.col07,
                        zzSample2.col08,
                        zzSample2.col09,
                        zzSample2.statusCd,
                        zzSample2.typeCd,
                        zzSample2.divCd,
                        zzSample2.kindCd,
                        zzSample2.cateCds,
                        zzSample2.sample1Id
                ))
                .from(zzSample2);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample2Dto.Item> selectById(String id) {
        ZzSample2Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzSample2.sample2Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample2Dto.Item> selectList(ZzSample2Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample2Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSample1Ids(search),
                baseAndSample2Ids(search),
                baseAndSample2Id(search),
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
    public ZzSample2Dto.PageResponse selectPageData(ZzSample2Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSample1Ids(search),
                baseAndSample2Ids(search),
                baseAndSample2Id(search),
                baseAndSample1Id(search),
                baseAndUseYn(search),
                baseAndSearchValue(search)
        };

        JPAQuery<ZzSample2Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzSample2Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(zzSample2.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt").from(zzSample2)
                .where(wheres)
                .fetchOne();

        ZzSample2Dto.PageResponse res = new ZzSample2Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(a), andDeptId(a), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* sample1Id IN */
    private BooleanExpression baseAndSample1Ids(ZzSample2Dto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getSample1Ids())
                ? zzSample2.sample1Id.in(search.getSample1Ids()) : null;
    }

    /* sample2Id IN */
    private BooleanExpression baseAndSample2Ids(ZzSample2Dto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getSample2Ids())
                ? zzSample2.sample2Id.in(search.getSample2Ids()) : null;
    }

    /* sample2Id 정확 일치 */
    private BooleanExpression baseAndSample2Id(ZzSample2Dto.Request search) {
        return search != null && StringUtils.hasText(search.getSample2Id())
                ? zzSample2.sample2Id.eq(search.getSample2Id()) : null;
    }

    /* sample1Id 정확 일치 */
    private BooleanExpression baseAndSample1Id(ZzSample2Dto.Request search) {
        return search != null && StringUtils.hasText(search.getSample1Id())
                ? zzSample2.sample1Id.eq(search.getSample1Id()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(ZzSample2Dto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? zzSample2.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(ZzSample2Dto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attrNm1,", zzSample2.attrNm1, pattern);
        or = orLike(or, all, types, ",attrNm2,", zzSample2.attrNm2, pattern);
        or = orLike(or, all, types, ",attrNm3,", zzSample2.attrNm3, pattern);
        or = orLike(or, all, types, ",attrNm4,", zzSample2.attrNm4, pattern);
        or = orLike(or, all, types, ",cateCds,", zzSample2.cateCds, pattern);
        or = orLike(or, all, types, ",cdGrp,", zzSample2.cdGrp, pattern);
        or = orLike(or, all, types, ",cdInfwSeCd,", zzSample2.cdInfwSeCd, pattern);
        or = orLike(or, all, types, ",cdNm,", zzSample2.cdNm, pattern);
        or = orLike(or, all, types, ",cdVl,", zzSample2.cdVl, pattern);
        or = orLike(or, all, types, ",col01,", zzSample2.col01, pattern);
        or = orLike(or, all, types, ",col02,", zzSample2.col02, pattern);
        or = orLike(or, all, types, ",col03,", zzSample2.col03, pattern);
        or = orLike(or, all, types, ",col04,", zzSample2.col04, pattern);
        or = orLike(or, all, types, ",col05,", zzSample2.col05, pattern);
        or = orLike(or, all, types, ",col06,", zzSample2.col06, pattern);
        or = orLike(or, all, types, ",col07,", zzSample2.col07, pattern);
        or = orLike(or, all, types, ",col08,", zzSample2.col08, pattern);
        or = orLike(or, all, types, ",col09,", zzSample2.col09, pattern);
        or = orLike(or, all, types, ",divCd,", zzSample2.divCd, pattern);
        or = orLike(or, all, types, ",explnCn,", zzSample2.explnCn, pattern);
        or = orLike(or, all, types, ",groupCd,", zzSample2.groupCd, pattern);
        or = orLike(or, all, types, ",kindCd,", zzSample2.kindCd, pattern);
        or = orLike(or, all, types, ",sample1Id,", zzSample2.sample1Id, pattern);
        or = orLike(or, all, types, ",sample2Id,", zzSample2.sample2Id, pattern);
        or = orLike(or, all, types, ",statusCd,", zzSample2.statusCd, pattern);
        or = orLike(or, all, types, ",typeCd,", zzSample2.typeCd, pattern);
        or = orLike(or, all, types, ",useYn,", zzSample2.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(ZzSample2Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, zzSample2.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample2.sample2Id));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sample2Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample2.sample2Id));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample2.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, zzSample2.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample2.sample2Id));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample2 entity) {
        if (entity.getSample2Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzSample2);
        boolean hasAny = false;

        if (entity.getCdGrp()      != null) { update.set(zzSample2.cdGrp,      entity.getCdGrp());      hasAny = true; }
        if (entity.getCdVl()       != null) { update.set(zzSample2.cdVl,       entity.getCdVl());       hasAny = true; }
        if (entity.getCdNm()       != null) { update.set(zzSample2.cdNm,       entity.getCdNm());       hasAny = true; }
        if (entity.getSrtordVl()   != null) { update.set(zzSample2.srtordVl,   entity.getSrtordVl());   hasAny = true; }
        if (entity.getAttrNm1()    != null) { update.set(zzSample2.attrNm1,    entity.getAttrNm1());    hasAny = true; }
        if (entity.getAttrNm2()    != null) { update.set(zzSample2.attrNm2,    entity.getAttrNm2());    hasAny = true; }
        if (entity.getAttrNm3()    != null) { update.set(zzSample2.attrNm3,    entity.getAttrNm3());    hasAny = true; }
        if (entity.getAttrNm4()    != null) { update.set(zzSample2.attrNm4,    entity.getAttrNm4());    hasAny = true; }
        if (entity.getExplnCn()    != null) { update.set(zzSample2.explnCn,    entity.getExplnCn());    hasAny = true; }
        if (entity.getCdInfwSeCd() != null) { update.set(zzSample2.cdInfwSeCd, entity.getCdInfwSeCd()); hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(zzSample2.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(zzSample2.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(zzSample2.updDate,    entity.getUpdDate());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(zzSample2.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(zzSample2.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(zzSample2.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(zzSample2.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(zzSample2.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(zzSample2.cateCds,    entity.getCateCds());    hasAny = true; }
        if (entity.getSample1Id()  != null) { update.set(zzSample2.sample1Id,  entity.getSample1Id());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(zzSample2.sample2Id.eq(entity.getSample2Id())).execute();
        return (int) affected;
    }
}
