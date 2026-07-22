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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdQnaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PdProdQna QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdQnaRepositoryImpl implements QPdProdQnaRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdQnaRepositoryImpl";
    private static final QPdProdQna pdProdQna = QPdProdQna.pdProdQna;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdProdQna.regDate,
        "upd_date", pdProdQna.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("answContent", pdProdQna.answContent),
        Map.entry("answUserId", pdProdQna.answUserId),
        Map.entry("answYn", pdProdQna.answYn),
        Map.entry("dispYn", pdProdQna.dispYn),
        Map.entry("memberId", pdProdQna.memberId),
        Map.entry("orderId", pdProdQna.orderId),
        Map.entry("prodId", pdProdQna.prodId),
        Map.entry("prodQnaContent", pdProdQna.prodQnaContent),
        Map.entry("prodQnaId", pdProdQna.prodQnaId),
        Map.entry("prodQnaTitle", pdProdQna.prodQnaTitle),
        Map.entry("prodQnaTypeCd", pdProdQna.prodQnaTypeCd),
        Map.entry("scrtYn", pdProdQna.scrtYn),
        Map.entry("siteId", pdProdQna.siteId),
        Map.entry("prodSkuId", pdProdQna.prodSkuId),
        Map.entry("useYn", pdProdQna.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (prodQnaTypeCd 는 sy_code 미등록 — Entity 주석 기준 예시)
     * SCRT_YN / ANSW_YN / DISP_YN / USE_YN  {Y: '예', N: '아니오'}
     */
    /** 단건 조회 */
    private JPAQuery<PdProdQnaDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdQnaDto.Item.class,
                        pdProdQna.prodQnaId,      // 문의ID (PK, YYMMDDhhmmss+rand4)
                        pdProdQna.siteId,          // 사이트ID (sy_site.site_id)
                        pdProdQna.prodId,          // 상품ID (pd_prod.prod_id)
                        pdProdQna.prodSkuId,       // SKUID (pd_prod_sku.prod_sku_id)
                        pdProdQna.memberId,        // 회원ID (mb_member.member_id)
                        pdProdQna.orderId,         // 주문ID (od_order.order_id)
                        pdProdQna.prodQnaTypeCd,    // 문의유형코드
                        pdProdQna.prodQnaTitle,    // 문의제목
                        pdProdQna.prodQnaContent,  // 문의내용
                        pdProdQna.scrtYn,            // 비밀글여부 — {Y: '예', N: '아니오'}
                        pdProdQna.answYn,             // 답변여부 — {Y: '예', N: '아니오'}
                        pdProdQna.answContent,     // 답변내용
                        pdProdQna.answDate,        // 답변일시
                        pdProdQna.answUserId,      // 답변자ID (sy_user.user_id)
                        pdProdQna.dispYn,             // 노출여부 — {Y: '예', N: '아니오'}
                        pdProdQna.useYn,              // 사용여부 — {Y: '예', N: '아니오'}
                        pdProdQna.regBy, pdProdQna.regDate, pdProdQna.updBy, pdProdQna.updDate
                ))
                .from(pdProdQna);
    }

    @Override
    public Optional<PdProdQnaDto.Item> selectById(String prodQnaId) {
        PdProdQnaDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdQna.prodQnaId.eq(prodQnaId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdProdQnaDto.Item> selectList(PdProdQnaDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdQnaDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pdProdQna.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdProdQna.prodQnaId, search.getProdQnaId()),
                    QdslUtil.strEq(pdProdQna.prodId, search.getProdId()),
                    QdslUtil.strEq(pdProdQna.answYn, search.getAnswYn()),
                    QdslUtil.strEq(pdProdQna.useYn, search.getUseYn()),
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

    /** 페이지 목록 */
    @Override
    public PdProdQnaDto.PageResponse selectPageData(PdProdQnaDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdProdQna.siteId, search.getSiteId()),
                QdslUtil.strEq(pdProdQna.prodQnaId, search.getProdQnaId()),
                QdslUtil.strEq(pdProdQna.prodId, search.getProdId()),
                QdslUtil.strEq(pdProdQna.answYn, search.getAnswYn()),
                QdslUtil.strEq(pdProdQna.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdProdQnaDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdProdQnaDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdQna.count())
                .where(wheres)
                .fetchOne();

        PdProdQnaDto.PageResponse res = new PdProdQnaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /** 검색조건 빌드 — Mapper XML pdProdQnaCond 와 동일 동작 (DTO Request 필드 한정) */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PdProdQnaDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdQnaDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdProdQna.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdQna.prodQnaId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodQnaId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdQna.prodQnaId));
                } else if ("prodQnaTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdQna.prodQnaTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdQna.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdProdQna.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdQna.prodQnaId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */

    @Override
    public int updateSelective(PdProdQna entity) {
        if (entity.getProdQnaId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdQna);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(pdProdQna.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getProdId()        != null) { update.set(pdProdQna.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getProdSkuId()     != null) { update.set(pdProdQna.prodSkuId,     entity.getProdSkuId());     hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(pdProdQna.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(pdProdQna.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getProdQnaTypeCd() != null) { update.set(pdProdQna.prodQnaTypeCd, entity.getProdQnaTypeCd()); hasAny = true; }
        if (entity.getProdQnaTitle()  != null) { update.set(pdProdQna.prodQnaTitle,  entity.getProdQnaTitle());  hasAny = true; }
        if (entity.getProdQnaContent()!= null) { update.set(pdProdQna.prodQnaContent,entity.getProdQnaContent());hasAny = true; }
        if (entity.getScrtYn()        != null) { update.set(pdProdQna.scrtYn,        entity.getScrtYn());        hasAny = true; }
        if (entity.getAnswYn()        != null) { update.set(pdProdQna.answYn,        entity.getAnswYn());        hasAny = true; }
        if (entity.getAnswContent()   != null) { update.set(pdProdQna.answContent,   entity.getAnswContent());   hasAny = true; }
        if (entity.getAnswDate()      != null) { update.set(pdProdQna.answDate,      entity.getAnswDate());      hasAny = true; }
        if (entity.getAnswUserId()    != null) { update.set(pdProdQna.answUserId,    entity.getAnswUserId());    hasAny = true; }
        if (entity.getDispYn()        != null) { update.set(pdProdQna.dispYn,        entity.getDispYn());        hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(pdProdQna.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pdProdQna.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdQna.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdQna.prodQnaId.eq(entity.getProdQnaId())).execute();
        return (int) affected;
    }
}
