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
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** ZzSample1 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample1RepositoryImpl implements QZzSample1Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample1RepositoryImpl";
    private static final QZzSample1 zzSample1 = QZzSample1.zzSample1;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("attrNm1", zzSample1.attrNm1),
        Map.entry("attrNm2", zzSample1.attrNm2),
        Map.entry("attrNm3", zzSample1.attrNm3),
        Map.entry("attrNm4", zzSample1.attrNm4),
        Map.entry("cateCds", zzSample1.cateCds),
        Map.entry("cdGrp", zzSample1.cdGrp),
        Map.entry("cdInfwSeCd", zzSample1.cdInfwSeCd),
        Map.entry("cdNm", zzSample1.cdNm),
        Map.entry("cdVl", zzSample1.cdVl),
        Map.entry("col01", zzSample1.col01),
        Map.entry("col02", zzSample1.col02),
        Map.entry("col03", zzSample1.col03),
        Map.entry("col04", zzSample1.col04),
        Map.entry("col05", zzSample1.col05),
        Map.entry("col06", zzSample1.col06),
        Map.entry("col07", zzSample1.col07),
        Map.entry("col08", zzSample1.col08),
        Map.entry("col09", zzSample1.col09),
        Map.entry("divCd", zzSample1.divCd),
        Map.entry("explnCn", zzSample1.explnCn),
        Map.entry("groupCd", zzSample1.groupCd),
        Map.entry("kindCd", zzSample1.kindCd),
        Map.entry("sample1Id", zzSample1.sample1Id),
        Map.entry("statusCd", zzSample1.statusCd),
        Map.entry("typeCd", zzSample1.typeCd),
        Map.entry("useYn", zzSample1.useYn)
    );

    /* baseSelColumnQuery */
    private JPAQuery<ZzSample1Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample1Dto.Item.class,
                        zzSample1.sample1Id,
                        zzSample1.cdGrp,
                        zzSample1.cdVl,
                        zzSample1.cdNm,
                        zzSample1.srtordVl,
                        zzSample1.attrNm1,
                        zzSample1.attrNm2,
                        zzSample1.attrNm3,
                        zzSample1.attrNm4,
                        zzSample1.explnCn,
                        zzSample1.cdInfwSeCd,
                        zzSample1.useYn,
                        zzSample1.regBy,
                        zzSample1.regDate,
                        zzSample1.updBy,
                        zzSample1.updDate,
                        zzSample1.groupCd,
                        zzSample1.col01,
                        zzSample1.col02,
                        zzSample1.col03,
                        zzSample1.col04,
                        zzSample1.col05,
                        zzSample1.col06,
                        zzSample1.col07,
                        zzSample1.col08,
                        zzSample1.col09,
                        zzSample1.statusCd,
                        zzSample1.typeCd,
                        zzSample1.divCd,
                        zzSample1.kindCd,
                        zzSample1.cateCds
                ))
                .from(zzSample1);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample1Dto.Item> selectById(String id) {
        ZzSample1Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzSample1.sample1Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample1Dto.Item> selectList(ZzSample1Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample1Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strIn(zzSample1.sample1Id, search.getSample1Ids()),
                QdslUtil.strEq(zzSample1.sample1Id, search.getSample1Id()),
                QdslUtil.strEq(zzSample1.useYn, search.getUseYn()),
                andSearchValueLike(search)
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

    /* 페이지조회 */
    @Override
    public ZzSample1Dto.PageResponse selectPageData(ZzSample1Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(zzSample1.sample1Id, search.getSample1Ids()),
                QdslUtil.strEq(zzSample1.sample1Id, search.getSample1Id()),
                QdslUtil.strEq(zzSample1.useYn, search.getUseYn()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<ZzSample1Dto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<ZzSample1Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzSample1.count())
                .where(wheres)
                .fetchOne();

        ZzSample1Dto.PageResponse res = new ZzSample1Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(ZzSample1Dto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
            orders.add(new OrderSpecifier(Order.DESC, zzSample1.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample1.sample1Id));
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
                    orders.add(new OrderSpecifier(order, zzSample1.sample1Id));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample1.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, zzSample1.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample1.sample1Id));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample1 entity) {
        if (entity.getSample1Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzSample1);
        boolean hasAny = false;

        if (entity.getCdGrp()      != null) { update.set(zzSample1.cdGrp,      entity.getCdGrp());      hasAny = true; }
        if (entity.getCdVl()       != null) { update.set(zzSample1.cdVl,       entity.getCdVl());       hasAny = true; }
        if (entity.getCdNm()       != null) { update.set(zzSample1.cdNm,       entity.getCdNm());       hasAny = true; }
        if (entity.getSrtordVl()   != null) { update.set(zzSample1.srtordVl,   entity.getSrtordVl());   hasAny = true; }
        if (entity.getAttrNm1()    != null) { update.set(zzSample1.attrNm1,    entity.getAttrNm1());    hasAny = true; }
        if (entity.getAttrNm2()    != null) { update.set(zzSample1.attrNm2,    entity.getAttrNm2());    hasAny = true; }
        if (entity.getAttrNm3()    != null) { update.set(zzSample1.attrNm3,    entity.getAttrNm3());    hasAny = true; }
        if (entity.getAttrNm4()    != null) { update.set(zzSample1.attrNm4,    entity.getAttrNm4());    hasAny = true; }
        if (entity.getExplnCn()    != null) { update.set(zzSample1.explnCn,    entity.getExplnCn());    hasAny = true; }
        if (entity.getCdInfwSeCd() != null) { update.set(zzSample1.cdInfwSeCd, entity.getCdInfwSeCd()); hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(zzSample1.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(zzSample1.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(zzSample1.updDate,    entity.getUpdDate());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(zzSample1.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(zzSample1.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(zzSample1.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(zzSample1.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(zzSample1.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(zzSample1.cateCds,    entity.getCateCds());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(zzSample1.sample1Id.eq(entity.getSample1Id())).execute();
        return (int) affected;
    }
}
