package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QPmDiscntItem pmDiscntItem = QPmDiscntItem.pmDiscntItem;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmDiscntItem.regDate,
        "upd_date", pmDiscntItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("discntId", pmDiscntItem.discntId),
        Map.entry("discntItemId", pmDiscntItem.discntItemId),
        Map.entry("siteId", pmDiscntItem.siteId),
        Map.entry("targetId", pmDiscntItem.targetId),
        Map.entry("targetTypeCd", pmDiscntItem.targetTypeCd)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * DISCNT_ITEM_TARGET  {CATEGORY: '카테고리', PRODUCT: '상품', MEMBER_GRADE: '회원등급'} (Entity 주석 대상ID 설명 기준)
     */
    private JPAQuery<PmDiscntItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntItemDto.Item.class,
                        pmDiscntItem.discntItemId,   // 할인항목ID (PK)
                        pmDiscntItem.discntId,       // 할인ID (pm_discnt.discnt_id)
                        pmDiscntItem.siteId,         // 사이트ID
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmDiscntItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmDiscntItem.discntItemId, search.getDiscntItemId()),
                    QdslUtil.strEq(pmDiscntItem.discntId, search.getDiscntId()),
                    QdslUtil.strEq(pmDiscntItem.targetId, search.getTargetId()),
                    QdslUtil.strEq(pmDiscntItem.targetTypeCd, search.getTargetTypeCd()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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

    /* 할인 대상 상품 페이지조회 */
    @Override
    public PmDiscntItemDto.PageResponse selectPageData(PmDiscntItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmDiscntItem.siteId, search.getSiteId()),
                QdslUtil.strEq(pmDiscntItem.discntItemId, search.getDiscntItemId()),
                QdslUtil.strEq(pmDiscntItem.discntId, search.getDiscntId()),
                QdslUtil.strEq(pmDiscntItem.targetId, search.getTargetId()),
                QdslUtil.strEq(pmDiscntItem.targetTypeCd, search.getTargetTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmDiscntItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmDiscntItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmDiscntItem.count())
                .where(wheres)
                .fetchOne();

        PmDiscntItemDto.PageResponse res = new PmDiscntItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PmDiscntItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmDiscntItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmDiscntItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmDiscntItem.discntItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("discntItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscntItem.discntItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscntItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmDiscntItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmDiscntItem.discntItemId));
        }
        return orders;
    }

    /* 할인 대상 상품 수정 */

    @Override
    public int updateSelective(PmDiscntItem entity) {
        if (entity.getDiscntItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmDiscntItem);
        boolean hasAny = false;

        if (entity.getDiscntId()    != null) { update.set(pmDiscntItem.discntId,    entity.getDiscntId());    hasAny = true; }
        if (entity.getSiteId()      != null) { update.set(pmDiscntItem.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(pmDiscntItem.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(pmDiscntItem.targetId,    entity.getTargetId());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmDiscntItem.discntItemId.eq(entity.getDiscntItemId())).execute();
        return (int) affected;
    }
}
