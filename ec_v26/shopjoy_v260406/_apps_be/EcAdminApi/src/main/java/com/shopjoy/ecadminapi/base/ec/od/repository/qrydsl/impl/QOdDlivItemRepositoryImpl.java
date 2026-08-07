package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivItemRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** OdDlivItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdDlivItemRepositoryImpl implements QOdDlivItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdDlivItemRepositoryImpl";
    private static final QOdDlivItem odDlivItem = QOdDlivItem.odDlivItem;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", odDlivItem.regDate,
        "upd_date", odDlivItem.updDate
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * dliv_type_cd (od_dliv_item, sy_code 미등록 — Entity 주석 기준 예시)  OUT:출고, IN:입고반품
     * DLIV_STATUS  {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
     */
    private JPAQuery<OdDlivItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivItemDto.Item.class,
                        odDlivItem.dlivItemId,               // 배송항목ID (YYMMDDhhmmss+rand4)
                        odDlivItem.dlivId,                    // 배송ID (od_dliv.)
                        odDlivItem.orderItemId,               // 주문상품ID (od_order_item.)
                        odDlivItem.prodId,                     // 상품ID
                        odDlivItem.prodOptId1,                // 옵션1 값ID (pd_prod_opt.opt_id)
                        odDlivItem.prodOptId2,                // 옵션2 값ID (pd_prod_opt.opt_id)
                        odDlivItem.dlivTypeCd,                // 입출고구분 — {OUT:출고, IN:입고반품}
                        odDlivItem.unitPrice,                 // 단가 (주문시점 스냅샷)
                        odDlivItem.dlivQty,                    // 출고수량 (부분출고 시 주문수량보다 적을 수 있음)
                        odDlivItem.dlivItemStatusCd,          // 항목 배송상태 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
                        odDlivItem.dlivItemStatusCdBefore,    // 변경 전 배송상태 — DLIV_STATUS (동일 코드그룹)
                        odDlivItem.regBy, odDlivItem.regDate, odDlivItem.updBy, odDlivItem.updDate
                ))
                .from(odDlivItem);
    }

    /* 배송 아이템 키조회 */
    @Override
    public Optional<OdDlivItemDto.Item> selectById(String dlivItemId) {
        OdDlivItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odDlivItem.dlivItemId.eq(dlivItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 아이템 목록조회 */
    @Override
    public List<OdDlivItemDto.Item> selectList(OdDlivItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<OdDlivItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(odDlivItem.dlivId, search.getDlivIds()),
                    QdslUtil.strEq(odDlivItem.dlivId, search.getDlivId()),
                    QdslUtil.strEq(odDlivItem.dlivItemId, search.getDlivItemId()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
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

    /* 배송 아이템 페이지조회 */
    @Override
    public BasePage<OdDlivItemDto.Item> selectPageData(OdDlivItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(odDlivItem.dlivId, search.getDlivIds()),
                QdslUtil.strEq(odDlivItem.dlivId, search.getDlivId()),
                QdslUtil.strEq(odDlivItem.dlivItemId, search.getDlivItemId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdDlivItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdDlivItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odDlivItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdDlivItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("dlivId", odDlivItem.dlivId),
            QdslUtil.FieldDef.like("dlivItemId", odDlivItem.dlivItemId),
            QdslUtil.FieldDef.like("dlivItemStatusCd", odDlivItem.dlivItemStatusCd),
            QdslUtil.FieldDef.like("dlivItemStatusCdBefore", odDlivItem.dlivItemStatusCdBefore),
            QdslUtil.FieldDef.like("dlivTypeCd", odDlivItem.dlivTypeCd),
            QdslUtil.FieldDef.like("prodOptId1", odDlivItem.prodOptId1),
            QdslUtil.FieldDef.like("prodOptId2", odDlivItem.prodOptId2),
            QdslUtil.FieldDef.like("orderItemId", odDlivItem.orderItemId),
            QdslUtil.FieldDef.like("prodId", odDlivItem.prodId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("dlivItemId", odDlivItem.dlivItemId,
                   "regDate", odDlivItem.regDate),
        new OrderSpecifier<>(Order.DESC, odDlivItem.regDate),
        new OrderSpecifier<>(Order.ASC, odDlivItem.dlivItemId));
    }

    /* 배송 아이템 수정 */

    @Override
    public int updateSelective(OdDlivItem entity) {
        if (entity.getDlivItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odDlivItem);
        boolean hasAny = false;

        if (entity.getDlivId()                 != null) { update.set(odDlivItem.dlivId,                 entity.getDlivId());                 hasAny = true; }
        if (entity.getOrderItemId()            != null) { update.set(odDlivItem.orderItemId,            entity.getOrderItemId());            hasAny = true; }
        if (entity.getProdId()                 != null) { update.set(odDlivItem.prodId,                 entity.getProdId());                 hasAny = true; }
        if (entity.getProdOptId1()             != null) { update.set(odDlivItem.prodOptId1,             entity.getProdOptId1());             hasAny = true; }
        if (entity.getProdOptId2()             != null) { update.set(odDlivItem.prodOptId2,             entity.getProdOptId2());             hasAny = true; }
        if (entity.getDlivTypeCd()             != null) { update.set(odDlivItem.dlivTypeCd,             entity.getDlivTypeCd());             hasAny = true; }
        if (entity.getUnitPrice()              != null) { update.set(odDlivItem.unitPrice,              entity.getUnitPrice());              hasAny = true; }
        if (entity.getDlivQty()                != null) { update.set(odDlivItem.dlivQty,                entity.getDlivQty());                hasAny = true; }
        if (entity.getDlivItemStatusCd()       != null) { update.set(odDlivItem.dlivItemStatusCd,       entity.getDlivItemStatusCd());       hasAny = true; }
        if (entity.getDlivItemStatusCdBefore() != null) { update.set(odDlivItem.dlivItemStatusCdBefore, entity.getDlivItemStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(odDlivItem.updBy,                  entity.getUpdBy());                  hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odDlivItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odDlivItem.dlivItemId.eq(entity.getDlivItemId())).execute();
        return (int) affected;
    }
}
