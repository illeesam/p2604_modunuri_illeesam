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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventItemRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmEventItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventItemRepositoryImpl implements QPmEventItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventItemRepositoryImpl";
    private static final QPmEventItem pmEventItem = QPmEventItem.pmEventItem;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * EVENT_ITEM_TARGET  {PRODUCT: '상품', CATEGORY: '카테고리', VENDOR: '판매자', BRAND: '브랜드'}
     */
    private JPAQuery<PmEventItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmEventItemDto.Item.class,
                        pmEventItem.eventItemId,   // 이벤트항목ID (PK, YYMMDDhhmmss+rand4)
                        pmEventItem.eventId,       // 이벤트ID (pm_event.event_id)
                        pmEventItem.targetTypeCd,  // 대상유형 — EVENT_ITEM_TARGET {PRODUCT, CATEGORY, VENDOR, BRAND}
                        pmEventItem.targetId,      // 대상ID (prod_id / category_id / vendor_id / brand_id)
                        pmEventItem.sortNo,        // 이벤트 내 노출 순서
                        pmEventItem.regBy, pmEventItem.regDate
                ))
                .from(pmEventItem);
    }

    /* 이벤트 대상 상품 키조회 */
    @Override
    public Optional<PmEventItemDto.Item> selectById(String eventItemId) {
        PmEventItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmEventItem.eventItemId.eq(eventItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 대상 상품 목록조회 */
    @Override
    public List<PmEventItemDto.Item> selectList(PmEventItemDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = pmEventItem.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pmEventItem.updDate;
        }
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PmEventItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pmEventItem.eventId, search.getEventIds()),
                    QdslUtil.strEq(pmEventItem.eventId, search.getEventId()),
                    QdslUtil.strEq(pmEventItem.eventItemId, search.getEventItemId()),
                    QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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

    /* 이벤트 대상 상품 페이지조회 */
    @Override
    public BasePage<PmEventItemDto.Item> selectPageData(PmEventItemDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = pmEventItem.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pmEventItem.updDate;
        }
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pmEventItem.eventId, search.getEventIds()),
                QdslUtil.strEq(pmEventItem.eventId, search.getEventId()),
                QdslUtil.strEq(pmEventItem.eventItemId, search.getEventItemId()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmEventItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmEventItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmEventItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmEventItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("eventId", pmEventItem.eventId),
            QdslUtil.FieldDef.like("eventItemId", pmEventItem.eventItemId),
            QdslUtil.FieldDef.like("targetId", pmEventItem.targetId),
            QdslUtil.FieldDef.like("targetTypeCd", pmEventItem.targetTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("eventItemId", pmEventItem.eventItemId,
                   "regDate", pmEventItem.regDate),
        new OrderSpecifier<>(Order.DESC, pmEventItem.regDate),
        new OrderSpecifier<>(Order.ASC, pmEventItem.eventItemId));
    }

    /* 이벤트 대상 상품 수정 */

    @Override
    public int updateSelective(PmEventItem entity) {
        if (entity.getEventItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmEventItem);
        boolean hasAny = false;

        if (entity.getEventId()     != null) { update.set(pmEventItem.eventId,     entity.getEventId());     hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(pmEventItem.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(pmEventItem.targetId,    entity.getTargetId());    hasAny = true; }
        if (entity.getSortNo()      != null) { update.set(pmEventItem.sortNo,      entity.getSortNo());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmEventItem.eventItemId.eq(entity.getEventItemId())).execute();
        return (int) affected;
    }
}
