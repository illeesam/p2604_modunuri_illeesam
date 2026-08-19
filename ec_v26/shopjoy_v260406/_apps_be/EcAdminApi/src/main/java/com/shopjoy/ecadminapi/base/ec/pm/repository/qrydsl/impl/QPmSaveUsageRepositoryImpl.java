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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveUsageRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmSaveUsage QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveUsageRepositoryImpl implements QPmSaveUsageRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveUsageRepositoryImpl";
    private static final QPmSaveUsage pmSaveUsage    = QPmSaveUsage.pmSaveUsage;
    private static final QSySite      sySite  = QSySite.sySite;
    private static final QMbMember    mbMember  = QMbMember.mbMember;
    private static final QOdOrder     odOrder  = QOdOrder.odOrder;
    private static final QOdOrderItem odOrderItem  = QOdOrderItem.odOrderItem;
    private static final QPdProd      pdProd  = QPdProd.pdProd;    /* 적립금 사용 이력 baseSelColumnQuery — 코드성 필드 없음 (주문 시 사용된 적립금 건별 기록) */
    private JPAQuery<PmSaveUsageDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveUsageDto.Item.class,
                        pmSaveUsage.saveUsageId,    // 적립사용ID (PK, YYMMDDhhmmss+rand4)
                        pmSaveUsage.memberId,       // 회원ID (mb_member.member_id)
                        pmSaveUsage.orderId,        // 주문ID (od_order.order_id)
                        pmSaveUsage.orderItemId,    // 주문상품ID (od_order_item.order_item_id, 상품별 사용 시)
                        pmSaveUsage.prodId,         // 상품ID (pd_prod.prod_id, 사용 상품)
                        pmSaveUsage.useAmt,         // 사용 적립금액
                        pmSaveUsage.balanceAmt,     // 사용 후 잔액
                        pmSaveUsage.usedDate,       // 사용일시
                        pmSaveUsage.regBy, pmSaveUsage.regDate
                ))
                .from(pmSaveUsage)
                .leftJoin(mbMember).on(mbMember.memberId.eq(pmSaveUsage.memberId))
                .leftJoin(odOrder).on(odOrder.orderId.eq(pmSaveUsage.orderId))
                .leftJoin(odOrderItem).on(odOrderItem.orderItemId.eq(pmSaveUsage.orderItemId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(pmSaveUsage.prodId));
    }

    /* 적립금 사용 이력 키조회 */
    @Override
    public Optional<PmSaveUsageDto.Item> selectById(String saveUsageId) {
        PmSaveUsageDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmSaveUsage.saveUsageId.eq(saveUsageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 적립금 사용 이력 목록조회 */
    @Override
    public List<PmSaveUsageDto.Item> selectList(PmSaveUsageDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmSaveUsage.saveUsageId, search.getSaveUsageId()));
        wheres.add(QdslUtil.strEq(pmSaveUsage.orderId, search.getOrderId()));
        wheres.add(QdslUtil.strEq(pmSaveUsage.orderItemId, search.getOrderItemId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(pmSaveUsage.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(pmSaveUsage.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PmSaveUsageDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres.toArray(BooleanExpression[]::new))
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

    /* 적립금 사용 이력 페이지조회 */
    @Override
    public BasePage<PmSaveUsageDto.Item> selectPageData(PmSaveUsageDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmSaveUsage.saveUsageId, search.getSaveUsageId()));
        whereList.add(QdslUtil.strEq(pmSaveUsage.orderId, search.getOrderId()));
        whereList.add(QdslUtil.strEq(pmSaveUsage.orderItemId, search.getOrderItemId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pmSaveUsage.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pmSaveUsage.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmSaveUsageDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmSaveUsageDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmSaveUsage.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmSaveUsageDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("memberId", pmSaveUsage.memberId),
            QdslUtil.FieldDef.like("orderId", pmSaveUsage.orderId),
            QdslUtil.FieldDef.like("orderItemId", pmSaveUsage.orderItemId),
            QdslUtil.FieldDef.like("prodId", pmSaveUsage.prodId),
            QdslUtil.FieldDef.like("saveUsageId", pmSaveUsage.saveUsageId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("saveUsageId", pmSaveUsage.saveUsageId,
                   "regDate", pmSaveUsage.regDate),
        new OrderSpecifier<>(Order.DESC, pmSaveUsage.regDate),
        new OrderSpecifier<>(Order.ASC, pmSaveUsage.saveUsageId));
    }

    /* 적립금 사용 이력 수정 */
    @Override
    public int updateSelective(PmSaveUsage entity) {
        if (entity.getSaveUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmSaveUsage);
        boolean hasAny = false;

        if (entity.getMemberId()    != null) { update.set(pmSaveUsage.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getOrderId()     != null) { update.set(pmSaveUsage.orderId,     entity.getOrderId());     hasAny = true; }
        if (entity.getOrderItemId() != null) { update.set(pmSaveUsage.orderItemId, entity.getOrderItemId()); hasAny = true; }
        if (entity.getProdId()      != null) { update.set(pmSaveUsage.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getUseAmt()      != null) { update.set(pmSaveUsage.useAmt,      entity.getUseAmt());      hasAny = true; }
        if (entity.getBalanceAmt()  != null) { update.set(pmSaveUsage.balanceAmt,  entity.getBalanceAmt());  hasAny = true; }
        if (entity.getUsedDate()    != null) { update.set(pmSaveUsage.usedDate,    entity.getUsedDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmSaveUsage.saveUsageId.eq(entity.getSaveUsageId())).execute();
        return (int) affected;
    }
}
