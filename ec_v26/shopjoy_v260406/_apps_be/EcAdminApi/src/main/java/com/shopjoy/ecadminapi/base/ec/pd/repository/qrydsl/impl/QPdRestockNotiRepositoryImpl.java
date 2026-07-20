package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdRestockNotiRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdRestockNoti QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdRestockNotiRepositoryImpl implements QPdRestockNotiRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdRestockNotiRepositoryImpl";
    private static final QPdRestockNoti pdRestockNoti   = QPdRestockNoti.pdRestockNoti;
    private static final QSySite        sySite = QSySite.sySite;
    private static final QPdProd        pdProd = QPdProd.pdProd;
    private static final QMbMember      mbMember = QMbMember.mbMember;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdRestockNoti.regDate,
        "upd_date", pdRestockNoti.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("memberId", pdRestockNoti.memberId),
        Map.entry("notiYn", pdRestockNoti.notiYn),
        Map.entry("prodId", pdRestockNoti.prodId),
        Map.entry("restockNotiId", pdRestockNoti.restockNotiId),
        Map.entry("siteId", pdRestockNoti.siteId),
        Map.entry("skuId", pdRestockNoti.prodSkuId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * NOTI_YN  {Y: '발송완료', N: '미발송'}
     */
    /* 재입고 알림 baseSelColumnQuery */
    private JPAQuery<PdRestockNotiDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdRestockNotiDto.Item.class,
                        pdRestockNoti.restockNotiId,   // 재입고알림ID (PK, YYMMDDhhmmss+rand4)
                        pdRestockNoti.siteId,           // 사이트ID (sy_site.site_id)
                        pdRestockNoti.prodId,           // 상품ID (pd_prod.prod_id)
                        pdRestockNoti.prodSkuId,        // SKUID (pd_prod_sku.prod_sku_id)
                        pdRestockNoti.memberId,         // 회원ID (mb_member.member_id)
                        pdRestockNoti.notiYn,             // 알림발송여부 — {Y: '발송완료', N: '미발송'}
                        pdRestockNoti.notiDate,         // 알림발송일시
                        pdRestockNoti.regBy, pdRestockNoti.regDate, pdRestockNoti.updBy, pdRestockNoti.updDate
                ))
                .from(pdRestockNoti)
                .leftJoin(sySite).on(sySite.siteId.eq(pdRestockNoti.siteId))
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdRestockNoti.prodId))
                .leftJoin(mbMember).on(mbMember.memberId.eq(pdRestockNoti.memberId));
    }

    /* 재입고 알림 키조회 */
    @Override
    public Optional<PdRestockNotiDto.Item> selectById(String restockNotiId) {
        PdRestockNotiDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdRestockNoti.restockNotiId.eq(restockNotiId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 재입고 알림 목록조회 */
    @Override
    public List<PdRestockNotiDto.Item> selectList(PdRestockNotiDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdRestockNotiDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pdRestockNoti.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdRestockNoti.restockNotiId, search.getRestockNotiId()),
                    QdslUtil.strEq(pdRestockNoti.prodId, search.getProdId()),
                    QdslUtil.strEq(pdRestockNoti.notiYn, search.getNotiYn()),
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

    /* 재입고 알림 페이지조회 */
    @Override
    public PdRestockNotiDto.PageResponse selectPageData(PdRestockNotiDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdRestockNoti.siteId, search.getSiteId()),
                QdslUtil.strEq(pdRestockNoti.restockNotiId, search.getRestockNotiId()),
                QdslUtil.strEq(pdRestockNoti.prodId, search.getProdId()),
                QdslUtil.strEq(pdRestockNoti.notiYn, search.getNotiYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdRestockNotiDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdRestockNotiDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdRestockNoti.count())
                .where(wheres)
                .fetchOne();

        PdRestockNotiDto.PageResponse res = new PdRestockNotiDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdRestockNotiDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdRestockNotiDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdRestockNoti.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdRestockNoti.restockNotiId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("restockNotiId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdRestockNoti.restockNotiId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdRestockNoti.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdRestockNoti.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdRestockNoti.restockNotiId));
        }
        return orders;
    }

    /* 재입고 알림 수정 */

    @Override
    public int updateSelective(PdRestockNoti entity) {
        if (entity.getRestockNotiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdRestockNoti);
        boolean hasAny = false;

        if (entity.getSiteId()   != null) { update.set(pdRestockNoti.siteId,   entity.getSiteId());   hasAny = true; }
        if (entity.getProdId()   != null) { update.set(pdRestockNoti.prodId,   entity.getProdId());   hasAny = true; }
        if (entity.getProdSkuId() != null) { update.set(pdRestockNoti.prodSkuId, entity.getProdSkuId()); hasAny = true; }
        if (entity.getMemberId() != null) { update.set(pdRestockNoti.memberId, entity.getMemberId()); hasAny = true; }
        if (entity.getNotiYn()   != null) { update.set(pdRestockNoti.notiYn,   entity.getNotiYn());   hasAny = true; }
        if (entity.getNotiDate() != null) { update.set(pdRestockNoti.notiDate, entity.getNotiDate()); hasAny = true; }
        if (entity.getUpdBy()    != null) { update.set(pdRestockNoti.updBy,    entity.getUpdBy());    hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdRestockNoti.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdRestockNoti.restockNotiId.eq(entity.getRestockNotiId())).execute();
        return (int) affected;
    }
}
