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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntUsageRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmDiscntUsage QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntUsageRepositoryImpl implements QPmDiscntUsageRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmDiscntUsageRepositoryImpl";
    private static final QPmDiscntUsage pmDiscntUsage = QPmDiscntUsage.pmDiscntUsage;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * discntTypeCd  {RATE: '정률', FIXED: '정액', FREE_SHIP: '무료배송'} (Entity 주석 기준 — 사용 시점 스냅샷)
     */
    private JPAQuery<PmDiscntUsageDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntUsageDto.Item.class,
                        pmDiscntUsage.discntUsageId,   // 할인사용ID (PK, YYMMDDhhmmss+rand4)
                        pmDiscntUsage.discntId,        // 할인ID (pm_discnt.discnt_id)
                        pmDiscntUsage.discntNm,        // 할인명 스냅샷
                        pmDiscntUsage.memberId,        // 회원ID (mb_member.member_id)
                        pmDiscntUsage.orderId,         // 주문ID (od_order.order_id)
                        pmDiscntUsage.orderItemId,     // 주문상품ID (od_order_item.order_item_id, 상품별 할인 적용 시)
                        pmDiscntUsage.prodId,          // 상품ID (pd_prod.prod_id, 할인 적용 상품)
                        pmDiscntUsage.discntTypeCd,    // 할인유형 스냅샷 — RATE: '정률' / FIXED: '정액' / FREE_SHIP: '무료배송'
                        pmDiscntUsage.discntValue,     // 할인값 스냅샷 (정률이면 % / 정액이면 원)
                        pmDiscntUsage.discntAmt,       // 실할인금액
                        pmDiscntUsage.usedDate,        // 적용일시
                        pmDiscntUsage.regBy, pmDiscntUsage.regDate
                ))
                .from(pmDiscntUsage);
    }

    /* 할인 사용 이력 키조회 */
    @Override
    public Optional<PmDiscntUsageDto.Item> selectById(String discntUsageId) {
        PmDiscntUsageDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmDiscntUsage.discntUsageId.eq(discntUsageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 할인 사용 이력 목록조회 */
    @Override
    public List<PmDiscntUsageDto.Item> selectList(PmDiscntUsageDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pmDiscntUsage.discntUsageId, search.getDiscntUsageId()));
        wheres.add(QdslUtil.strEq(pmDiscntUsage.orderId, search.getOrderId()));
        wheres.add(QdslUtil.strEq(pmDiscntUsage.orderItemId, search.getOrderItemId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(pmDiscntUsage.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(pmDiscntUsage.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PmDiscntUsageDto.Item> query = baseSelColumnQuery()
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

    /* 할인 사용 이력 페이지조회 */
    @Override
    public BasePage<PmDiscntUsageDto.Item> selectPageData(PmDiscntUsageDto.Request search) {
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
        whereList.add(QdslUtil.strEq(pmDiscntUsage.discntUsageId, search.getDiscntUsageId()));
        whereList.add(QdslUtil.strEq(pmDiscntUsage.orderId, search.getOrderId()));
        whereList.add(QdslUtil.strEq(pmDiscntUsage.orderItemId, search.getOrderItemId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pmDiscntUsage.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pmDiscntUsage.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmDiscntUsageDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmDiscntUsageDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmDiscntUsage.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmDiscntUsageDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("discntId", pmDiscntUsage.discntId),
            QdslUtil.FieldDef.like("discntNm", pmDiscntUsage.discntNm),
            QdslUtil.FieldDef.like("discntTypeCd", pmDiscntUsage.discntTypeCd),
            QdslUtil.FieldDef.like("discntUsageId", pmDiscntUsage.discntUsageId),
            QdslUtil.FieldDef.like("memberId", pmDiscntUsage.memberId),
            QdslUtil.FieldDef.like("orderId", pmDiscntUsage.orderId),
            QdslUtil.FieldDef.like("orderItemId", pmDiscntUsage.orderItemId),
            QdslUtil.FieldDef.like("prodId", pmDiscntUsage.prodId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("discntUsageId", pmDiscntUsage.discntUsageId,
                   "discntNm", pmDiscntUsage.discntNm,
                   "regDate", pmDiscntUsage.regDate),
        new OrderSpecifier<>(Order.DESC, pmDiscntUsage.regDate),
        new OrderSpecifier<>(Order.ASC, pmDiscntUsage.discntUsageId));
    }

    /* 할인 사용 이력 수정 */

    @Override
    public int updateSelective(PmDiscntUsage entity) {
        if (entity.getDiscntUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmDiscntUsage);
        boolean hasAny = false;

        if (entity.getDiscntId()      != null) { update.set(pmDiscntUsage.discntId,      entity.getDiscntId());      hasAny = true; }
        if (entity.getDiscntNm()      != null) { update.set(pmDiscntUsage.discntNm,      entity.getDiscntNm());      hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(pmDiscntUsage.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(pmDiscntUsage.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getOrderItemId()   != null) { update.set(pmDiscntUsage.orderItemId,   entity.getOrderItemId());   hasAny = true; }
        if (entity.getProdId()        != null) { update.set(pmDiscntUsage.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getDiscntTypeCd()  != null) { update.set(pmDiscntUsage.discntTypeCd,  entity.getDiscntTypeCd());  hasAny = true; }
        if (entity.getDiscntValue()   != null) { update.set(pmDiscntUsage.discntValue,   entity.getDiscntValue());   hasAny = true; }
        if (entity.getDiscntAmt()     != null) { update.set(pmDiscntUsage.discntAmt,     entity.getDiscntAmt());     hasAny = true; }
        if (entity.getUsedDate()      != null) { update.set(pmDiscntUsage.usedDate,      entity.getUsedDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmDiscntUsage.discntUsageId.eq(entity.getDiscntUsageId())).execute();
        return (int) affected;
    }
}
