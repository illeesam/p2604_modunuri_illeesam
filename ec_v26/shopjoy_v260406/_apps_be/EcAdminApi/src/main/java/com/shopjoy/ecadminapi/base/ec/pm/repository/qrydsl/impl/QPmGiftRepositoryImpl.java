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
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PmGift QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftRepositoryImpl implements QPmGiftRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmGiftRepositoryImpl";
    private static final QPmGift  pmGift    = QPmGift.pmGift;
    private static final QPdProd  pdProd  = QPdProd.pdProd;
    private static final QSySite  sySite  = QSySite.sySite;
    private static final QSyCode  cdGt = new QSyCode("cd_gt");
    private static final QSyCode  cdGs = new QSyCode("cd_gs");
    private static final QSyCode  cdMg = new QSyCode("cd_mg");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmGift.regDate,
        "upd_date", pmGift.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("giftDesc", pmGift.giftDesc),
        Map.entry("giftId", pmGift.giftId),
        Map.entry("giftNm", pmGift.giftNm),
        Map.entry("giftStatusCd", pmGift.giftStatusCd),
        Map.entry("giftStatusCdBefore", pmGift.giftStatusCdBefore),
        Map.entry("giftTypeCd", pmGift.giftTypeCd),
        Map.entry("memGradeCd", pmGift.memGradeCd),
        Map.entry("prodId", pmGift.prodId),
        Map.entry("siteId", pmGift.siteId),
        Map.entry("useYn", pmGift.useYn)
    );

    /**
     * 공통 base query — JOIN 일치, Item 필드만 projection
     *
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GIFT_TYPE    {PRODUCT: '상품', SAMPLE: '샘플', ETC: '기타'}
     * GIFT_STATUS  {ACTIVE: '활성', INACTIVE: '비활성'}
     */
    private JPAQuery<PmGiftDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftDto.Item.class,
                        pmGift.giftId,               // 사은품ID (PK, YYMMDDhhmmss+rand4)
                        pmGift.siteId,               // 사이트ID
                        pmGift.giftNm,               // 사은품명
                        pmGift.giftTypeCd,           // 사은품유형 — GIFT_TYPE {PRODUCT: '상품', SAMPLE: '샘플', ETC: '기타'}
                        pmGift.prodId,               // 연결 상품ID (pd_prod.prod_id)
                        pmGift.giftStock,            // 사은품 재고
                        pmGift.giftDesc,             // 사은품 설명
                        pmGift.startDate,            // 시작일시
                        pmGift.endDate,              // 종료일시
                        pmGift.giftStatusCd,         // 상태 — GIFT_STATUS {ACTIVE: '활성', INACTIVE: '비활성'}
                        pmGift.giftStatusCdBefore,   // 변경 전 상태
                        pmGift.memGradeCd,           // 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
                        pmGift.minOrderAmt,          // 최소주문금액 — 사은품 지급 기준 금액
                        pmGift.minOrderQty,          // 최소주문수량 (NULL=제한없음)
                        pmGift.selfCdivRate,         // 자사(사이트) 분담율 (%) — 기본 100%
                        pmGift.sellerCdivRate,       // 판매자(업체) 분담율 (%) — 기본 0%
                        pmGift.useYn, pmGift.regBy, pmGift.regDate, pmGift.updBy, pmGift.updDate
                ))
                .from(pmGift)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pmGift.prodId))
                .leftJoin(sySite).on(sySite.siteId.eq(pmGift.siteId))
                .leftJoin(cdGt).on(cdGt.codeGrp.eq("GIFT_TYPE").and(cdGt.codeValue.eq(pmGift.giftTypeCd)))
                .leftJoin(cdGs).on(cdGs.codeGrp.eq("GIFT_STATUS").and(cdGs.codeValue.eq(pmGift.giftStatusCd)))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(pmGift.memGradeCd)));
    }

    /** 단건 조회 */
    @Override
    public Optional<PmGiftDto.Item> selectById(String giftId) {
        PmGiftDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmGift.giftId.eq(giftId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PmGiftDto.Item> selectList(PmGiftDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmGift.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmGift.giftId, search.getGiftId()),
                    QdslUtil.strEq(pmGift.giftTypeCd, search.getGiftTypeCd()),
                    QdslUtil.strEq(pmGift.giftStatusCd, search.getGiftStatusCd()),
                    QdslUtil.strEq(pmGift.useYn, search.getUseYn()),
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
    public PmGiftDto.PageResponse selectPageData(PmGiftDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmGift.siteId, search.getSiteId()),
                QdslUtil.strEq(pmGift.giftId, search.getGiftId()),
                QdslUtil.strEq(pmGift.giftTypeCd, search.getGiftTypeCd()),
                QdslUtil.strEq(pmGift.giftStatusCd, search.getGiftStatusCd()),
                QdslUtil.strEq(pmGift.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmGiftDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmGiftDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmGift.count())
                .where(wheres)
                .fetchOne();

        PmGiftDto.PageResponse res = new PmGiftDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pmGiftCond 와 동일 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PmGiftDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmGiftDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmGift.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmGift.giftId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("giftId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGift.giftId));
                } else if ("giftNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGift.giftNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGift.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmGift.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmGift.giftId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PmGift entity) {
        if (entity.getGiftId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmGift);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(pmGift.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getGiftNm()             != null) { update.set(pmGift.giftNm,             entity.getGiftNm());             hasAny = true; }
        if (entity.getGiftTypeCd()         != null) { update.set(pmGift.giftTypeCd,         entity.getGiftTypeCd());         hasAny = true; }
        if (entity.getProdId()             != null) { update.set(pmGift.prodId,             entity.getProdId());             hasAny = true; }
        if (entity.getGiftStock()          != null) { update.set(pmGift.giftStock,          entity.getGiftStock());          hasAny = true; }
        if (entity.getGiftDesc()           != null) { update.set(pmGift.giftDesc,           entity.getGiftDesc());           hasAny = true; }
        if (entity.getStartDate()          != null) { update.set(pmGift.startDate,          entity.getStartDate());          hasAny = true; }
        if (entity.getEndDate()            != null) { update.set(pmGift.endDate,            entity.getEndDate());            hasAny = true; }
        if (entity.getGiftStatusCd()       != null) { update.set(pmGift.giftStatusCd,       entity.getGiftStatusCd());       hasAny = true; }
        if (entity.getGiftStatusCdBefore() != null) { update.set(pmGift.giftStatusCdBefore, entity.getGiftStatusCdBefore()); hasAny = true; }
        if (entity.getMemGradeCd()         != null) { update.set(pmGift.memGradeCd,         entity.getMemGradeCd());         hasAny = true; }
        if (entity.getMinOrderAmt()        != null) { update.set(pmGift.minOrderAmt,        entity.getMinOrderAmt());        hasAny = true; }
        if (entity.getMinOrderQty()        != null) { update.set(pmGift.minOrderQty,        entity.getMinOrderQty());        hasAny = true; }
        if (entity.getSelfCdivRate()       != null) { update.set(pmGift.selfCdivRate,       entity.getSelfCdivRate());       hasAny = true; }
        if (entity.getSellerCdivRate()     != null) { update.set(pmGift.sellerCdivRate,     entity.getSellerCdivRate());     hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(pmGift.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(pmGift.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmGift.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmGift.giftId.eq(entity.getGiftId())).execute();
        return (int) affected;
    }
}
