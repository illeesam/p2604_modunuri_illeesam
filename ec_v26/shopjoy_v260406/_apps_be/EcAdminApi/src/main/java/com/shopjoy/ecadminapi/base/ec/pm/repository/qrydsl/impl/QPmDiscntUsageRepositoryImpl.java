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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QPmDiscntUsage pmDiscntUsage = QPmDiscntUsage.pmDiscntUsage;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmDiscntUsage.regDate,
        "upd_date", pmDiscntUsage.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("discntId", pmDiscntUsage.discntId),
        Map.entry("discntNm", pmDiscntUsage.discntNm),
        Map.entry("discntTypeCd", pmDiscntUsage.discntTypeCd),
        Map.entry("discntUsageId", pmDiscntUsage.discntUsageId),
        Map.entry("memberId", pmDiscntUsage.memberId),
        Map.entry("orderId", pmDiscntUsage.orderId),
        Map.entry("orderItemId", pmDiscntUsage.orderItemId),
        Map.entry("prodId", pmDiscntUsage.prodId),
        Map.entry("siteId", pmDiscntUsage.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * discntTypeCd  {RATE: '정률', FIXED: '정액', FREE_SHIP: '무료배송'} (Entity 주석 기준 — 사용 시점 스냅샷)
     */
    private JPAQuery<PmDiscntUsageDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntUsageDto.Item.class,
                        pmDiscntUsage.discntUsageId,   // 할인사용ID (PK, YYMMDDhhmmss+rand4)
                        pmDiscntUsage.siteId,          // 사이트ID (sy_site.site_id)
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntUsageDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmDiscntUsage.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmDiscntUsage.discntUsageId, search.getDiscntUsageId()),
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

    /* 할인 사용 이력 페이지조회 */
    @Override
    public PmDiscntUsageDto.PageResponse selectPageData(PmDiscntUsageDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmDiscntUsage.siteId, search.getSiteId()),
                QdslUtil.strEq(pmDiscntUsage.discntUsageId, search.getDiscntUsageId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

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

        PmDiscntUsageDto.PageResponse res = new PmDiscntUsageDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PmDiscntUsageDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmDiscntUsageDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmDiscntUsage.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmDiscntUsage.discntUsageId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("discntUsageId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscntUsage.discntUsageId));
                } else if ("discntNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscntUsage.discntNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscntUsage.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmDiscntUsage.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmDiscntUsage.discntUsageId));
        }
        return orders;
    }

    /* 할인 사용 이력 수정 */

    @Override
    public int updateSelective(PmDiscntUsage entity) {
        if (entity.getDiscntUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmDiscntUsage);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(pmDiscntUsage.siteId,        entity.getSiteId());        hasAny = true; }
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
