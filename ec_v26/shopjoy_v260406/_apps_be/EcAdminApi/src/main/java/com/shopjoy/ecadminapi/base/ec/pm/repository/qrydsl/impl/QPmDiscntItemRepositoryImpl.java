package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntItemRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmDiscntItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntItemRepositoryImpl implements QPmDiscntItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmDiscntItemRepositoryImpl";
    private static final QPmDiscntItem pmDiscntItem = QPmDiscntItem.pmDiscntItem;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * DISCNT_ITEM_TARGET  {CATEGORY: '카테고리', PRODUCT: '상품', MEMBER_GRADE: '회원등급'} (Entity 주석 대상ID 설명 기준)
     */
    private JPAQuery<PmDiscntItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntItemDto.Item.class,
                        pmDiscntItem.discntItemId,   // 할인항목ID (PK)
                        pmDiscntItem.discntId,       // 할인ID (pm_discnt.discnt_id)
                        pmDiscntItem.targetTypeCd,   // 대상유형 — DISCNT_ITEM_TARGET {CATEGORY, PRODUCT, MEMBER_GRADE}
                        pmDiscntItem.targetId,       // 대상ID (category_id/prod_id/grade_cd)
                        pmDiscntItem.regBy, pmDiscntItem.regDate
                ))
                .from(pmDiscntItem);
    }

    /* 할인 대상 상품 키조회 */
    @Override
    public Optional<PmDiscntItemDto.Item> selectById(String discntItemId) {
        PmDiscntItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmDiscntItem.discntItemId.eq(discntItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 할인 대상 상품 목록조회 */
    @Override
    public List<PmDiscntItemDto.Item> selectList(PmDiscntItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmDiscntItem.discntItemId, search.getDiscntItemId()));
        wheres.add(QdslUtil.strEq(pmDiscntItem.discntId, search.getDiscntId()));
        wheres.add(QdslUtil.strEq(pmDiscntItem.targetId, search.getTargetId()));
        wheres.add(QdslUtil.strEq(pmDiscntItem.targetTypeCd, search.getTargetTypeCd()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscntItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscntItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmDiscntItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres2)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 할인 대상 상품 페이지조회 */
    @Override
    public BasePage<PmDiscntItemDto.Item> selectPageData(PmDiscntItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmDiscntItem.discntItemId, search.getDiscntItemId()));
        wheres.add(QdslUtil.strEq(pmDiscntItem.discntId, search.getDiscntId()));
        wheres.add(QdslUtil.strEq(pmDiscntItem.targetId, search.getTargetId()));
        wheres.add(QdslUtil.strEq(pmDiscntItem.targetTypeCd, search.getTargetTypeCd()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscntItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscntItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);

        JPAQuery<PmDiscntItemDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmDiscntItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmDiscntItem.count())
                .where(wheres2)
                .fetchOne();

        BasePage<PmDiscntItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("discntId", pmDiscntItem.discntId),
            QdslUtil.FieldDef.like("discntItemId", pmDiscntItem.discntItemId),
            QdslUtil.FieldDef.like("targetId", pmDiscntItem.targetId),
            QdslUtil.FieldDef.like("targetTypeCd", pmDiscntItem.targetTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("discntItemId", pmDiscntItem.discntItemId,
                   "regDate", pmDiscntItem.regDate),
        new OrderSpecifier<>(Order.DESC, pmDiscntItem.regDate),
        new OrderSpecifier<>(Order.ASC, pmDiscntItem.discntItemId));
    }

    /* 할인 대상 상품 수정 */
    @Override
    public int updateSelective(PmDiscntItem entity) {
        if (entity.getDiscntItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmDiscntItem);
        boolean hasAny = false;

        if (entity.getDiscntId()    != null) { update.set(pmDiscntItem.discntId,    entity.getDiscntId());    hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(pmDiscntItem.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(pmDiscntItem.targetId,    entity.getTargetId());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmDiscntItem.discntItemId.eq(entity.getDiscntItemId())).execute();
        return (int) affected;
    }
}
