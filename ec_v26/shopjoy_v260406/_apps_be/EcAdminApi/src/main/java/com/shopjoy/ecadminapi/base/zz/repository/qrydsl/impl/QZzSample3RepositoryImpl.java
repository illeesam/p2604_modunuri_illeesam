package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample3;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample3;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample3Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** ZzSample3 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample3RepositoryImpl implements QZzSample3Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample3RepositoryImpl";
    private static final QZzSample3 s = QZzSample3.zzSample3;

    /* buildBaseQuery */
    private JPAQuery<ZzSample3Dto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample3Dto.Item.class,
                        s.sample3Id,
                        s.cdGrp,
                        s.cdVl,
                        s.cdNm,
                        s.srtordVl,
                        s.attrNm1,
                        s.attrNm2,
                        s.attrNm3,
                        s.attrNm4,
                        s.explnCn,
                        s.cdInfwSeCd,
                        s.useYn,
                        s.regBy,
                        s.regDate,
                        s.updBy,
                        s.updDate,
                        s.groupCd,
                        s.col01,
                        s.col02,
                        s.col03,
                        s.col04,
                        s.col05,
                        s.col06,
                        s.col07,
                        s.col08,
                        s.col09,
                        s.statusCd,
                        s.typeCd,
                        s.divCd,
                        s.kindCd,
                        s.cateCds,
                        s.sample1Id,
                        s.sample2Id
                ))
                .from(s);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample3Dto.Item> selectById(String id) {
        ZzSample3Dto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(s.sample3Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample3Dto.Item> selectList(ZzSample3Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample3Dto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSample1Ids(search),
                andSample2Ids(search),
                andSample3Id(search),
                andSample1Id(search),
                andSample2Id(search),
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
    public ZzSample3Dto.PageResponse selectPageList(ZzSample3Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample3Dto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andSample1Ids(search),
                andSample2Ids(search),
                andSample3Id(search),
                andSample1Id(search),
                andSample2Id(search),
                andUseYn(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<ZzSample3Dto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(s.count())
                .from(s)
                .where(
                andSample1Ids(search),
                andSample2Ids(search),
                andSample3Id(search),
                andSample1Id(search),
                andSample2Id(search),
                andUseYn(search),
                andSearchValue(search)
        )
                .fetchOne();

        ZzSample3Dto.PageResponse res = new ZzSample3Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* sample1Id IN */
    private BooleanExpression andSample1Ids(ZzSample3Dto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getSample1Ids())
                ? s.sample1Id.in(search.getSample1Ids()) : null;
    }

    /* sample2Id IN */
    private BooleanExpression andSample2Ids(ZzSample3Dto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getSample2Ids())
                ? s.sample2Id.in(search.getSample2Ids()) : null;
    }

    /* sample3Id 정확 일치 */
    private BooleanExpression andSample3Id(ZzSample3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getSample3Id())
                ? s.sample3Id.eq(search.getSample3Id()) : null;
    }

    /* sample1Id 정확 일치 */
    private BooleanExpression andSample1Id(ZzSample3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getSample1Id())
                ? s.sample1Id.eq(search.getSample1Id()) : null;
    }

    /* sample2Id 정확 일치 */
    private BooleanExpression andSample2Id(ZzSample3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getSample2Id())
                ? s.sample2Id.eq(search.getSample2Id()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(ZzSample3Dto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? s.useYn.eq(search.getUseYn()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(ZzSample3Dto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attrNm1,", s.attrNm1, pattern);
        or = orLike(or, all, types, ",attrNm2,", s.attrNm2, pattern);
        or = orLike(or, all, types, ",attrNm3,", s.attrNm3, pattern);
        or = orLike(or, all, types, ",attrNm4,", s.attrNm4, pattern);
        or = orLike(or, all, types, ",cateCds,", s.cateCds, pattern);
        or = orLike(or, all, types, ",cdGrp,", s.cdGrp, pattern);
        or = orLike(or, all, types, ",cdInfwSeCd,", s.cdInfwSeCd, pattern);
        or = orLike(or, all, types, ",cdNm,", s.cdNm, pattern);
        or = orLike(or, all, types, ",cdVl,", s.cdVl, pattern);
        or = orLike(or, all, types, ",col01,", s.col01, pattern);
        or = orLike(or, all, types, ",col02,", s.col02, pattern);
        or = orLike(or, all, types, ",col03,", s.col03, pattern);
        or = orLike(or, all, types, ",col04,", s.col04, pattern);
        or = orLike(or, all, types, ",col05,", s.col05, pattern);
        or = orLike(or, all, types, ",col06,", s.col06, pattern);
        or = orLike(or, all, types, ",col07,", s.col07, pattern);
        or = orLike(or, all, types, ",col08,", s.col08, pattern);
        or = orLike(or, all, types, ",col09,", s.col09, pattern);
        or = orLike(or, all, types, ",divCd,", s.divCd, pattern);
        or = orLike(or, all, types, ",explnCn,", s.explnCn, pattern);
        or = orLike(or, all, types, ",groupCd,", s.groupCd, pattern);
        or = orLike(or, all, types, ",kindCd,", s.kindCd, pattern);
        or = orLike(or, all, types, ",sample1Id,", s.sample1Id, pattern);
        or = orLike(or, all, types, ",sample2Id,", s.sample2Id, pattern);
        or = orLike(or, all, types, ",sample3Id,", s.sample3Id, pattern);
        or = orLike(or, all, types, ",statusCd,", s.statusCd, pattern);
        or = orLike(or, all, types, ",typeCd,", s.typeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(ZzSample3Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.sample3Id));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sample3Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.sample3Id));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.sample3Id));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample3 entity) {
        if (entity.getSample3Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getCdGrp()      != null) { update.set(s.cdGrp,      entity.getCdGrp());      hasAny = true; }
        if (entity.getCdVl()       != null) { update.set(s.cdVl,       entity.getCdVl());       hasAny = true; }
        if (entity.getCdNm()       != null) { update.set(s.cdNm,       entity.getCdNm());       hasAny = true; }
        if (entity.getSrtordVl()   != null) { update.set(s.srtordVl,   entity.getSrtordVl());   hasAny = true; }
        if (entity.getAttrNm1()    != null) { update.set(s.attrNm1,    entity.getAttrNm1());    hasAny = true; }
        if (entity.getAttrNm2()    != null) { update.set(s.attrNm2,    entity.getAttrNm2());    hasAny = true; }
        if (entity.getAttrNm3()    != null) { update.set(s.attrNm3,    entity.getAttrNm3());    hasAny = true; }
        if (entity.getAttrNm4()    != null) { update.set(s.attrNm4,    entity.getAttrNm4());    hasAny = true; }
        if (entity.getExplnCn()    != null) { update.set(s.explnCn,    entity.getExplnCn());    hasAny = true; }
        if (entity.getCdInfwSeCd() != null) { update.set(s.cdInfwSeCd, entity.getCdInfwSeCd()); hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(s.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(s.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(s.updDate,    entity.getUpdDate());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(s.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(s.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(s.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(s.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(s.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(s.cateCds,    entity.getCateCds());    hasAny = true; }
        if (entity.getSample1Id()  != null) { update.set(s.sample1Id,  entity.getSample1Id());  hasAny = true; }
        if (entity.getSample2Id()  != null) { update.set(s.sample2Id,  entity.getSample2Id());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(s.sample3Id.eq(entity.getSample3Id())).execute();
        return (int) affected;
    }
}
