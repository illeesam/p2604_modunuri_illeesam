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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmCoupon QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponRepositoryImpl implements QPmCouponRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponRepositoryImpl";
    private static final QPmCoupon pmCoupon   = QPmCoupon.pmCoupon;
    private static final QSyCode  cdCt = new QSyCode("cd_ct");
    private static final QSyCode  cdCs = new QSyCode("cd_cs");
    private static final QSyCode  cdTt = new QSyCode("cd_tt");
    private static final QSyCode  cdMg = new QSyCode("cd_mg");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmCoupon.regDate,
        "upd_date", pmCoupon.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("couponCd", pmCoupon.couponCd),
        Map.entry("couponDesc", pmCoupon.couponDesc),
        Map.entry("couponId", pmCoupon.couponId),
        Map.entry("couponNm", pmCoupon.couponNm),
        Map.entry("couponStatusCd", pmCoupon.couponStatusCd),
        Map.entry("couponStatusCdBefore", pmCoupon.couponStatusCdBefore),
        Map.entry("couponTypeCd", pmCoupon.couponTypeCd),
        Map.entry("dvcMappYn", pmCoupon.dvcMappYn),
        Map.entry("dvcMwebYn", pmCoupon.dvcMwebYn),
        Map.entry("dvcPcYn", pmCoupon.dvcPcYn),
        Map.entry("memGradeCd", pmCoupon.memGradeCd),
        Map.entry("memo", pmCoupon.memo),
        Map.entry("sellerCdivRemark", pmCoupon.sellerCdivRemark),
        Map.entry("siteId", pmCoupon.siteId),
        Map.entry("targetTypeCd", pmCoupon.targetTypeCd),
        Map.entry("targetValue", pmCoupon.targetValue),
        Map.entry("useYn", pmCoupon.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * COUPON_TYPE    {PROD_DISCNT: '상품할인', ORDER_DISCNT: '주문할인', SHIP_DISCNT: '배송비할인', SHIP_FREE: '무료배송', JOIN_GIFT: '가입축하', VIP: 'VIP전용', CLAIM_COMP: '클레임보상'}
     * COUPON_STATUS  {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'}
     * COUPON_TARGET  {ALL: '전체', MEMBER: '회원', GRADE: '등급'}
     * MEMBER_GRADE   회원 등급 코드 (sy_code MEMBER_GRADE 그룹, 사이트별 등급 구성에 따라 값 상이)
     */
    private JPAQuery<PmCouponDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponDto.Item.class,
                        pmCoupon.couponId,              // 쿠폰ID (PK, YYMMDDhhmmss+rand4)
                        pmCoupon.siteId,                // 사이트ID (sy_site.site_id)
                        pmCoupon.couponCd,               // 쿠폰코드 (UNIQUE)
                        pmCoupon.couponNm,               // 쿠폰명
                        pmCoupon.couponTypeCd,           // 쿠폰유형 — COUPON_TYPE {PROD_DISCNT, ORDER_DISCNT, SHIP_DISCNT, SHIP_FREE, JOIN_GIFT, VIP, CLAIM_COMP}
                        pmCoupon.discountRate,           // 할인률 (%)
                        pmCoupon.discountAmt,            // 할인금액
                        pmCoupon.minOrderAmt,            // 최소주문금액
                        pmCoupon.minOrderQty,            // 최소주문수량 (NULL=제한없음)
                        pmCoupon.maxDiscountAmt,         // 최대할인한도 (NULL=무제한)
                        pmCoupon.issueLimit,             // 총발급한도 (NULL=무제한)
                        pmCoupon.issueCnt,               // 발급된 개수
                        pmCoupon.maxIssuePerMem,         // 회원당 최대발급수 (NULL=무제한)
                        pmCoupon.couponDesc,             // 쿠폰설명
                        pmCoupon.validFrom,              // 유효기간 시작
                        pmCoupon.validTo,                // 유효기간 종료
                        pmCoupon.couponStatusCd,         // 상태 — COUPON_STATUS {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'}
                        pmCoupon.couponStatusCdBefore,   // 변경 전 쿠폰상태 — COUPON_STATUS
                        pmCoupon.useYn,                  // 사용여부 Y/N
                        pmCoupon.targetTypeCd,           // 적용대상 — COUPON_TARGET {ALL: '전체', MEMBER: '회원', GRADE: '등급'}
                        pmCoupon.targetValue,            // 적용대상값 (회원ID/등급코드)
                        pmCoupon.memGradeCd,             // 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
                        pmCoupon.selfCdivRate,           // 자사(사이트) 분담율 (%) — 기본 100%
                        pmCoupon.sellerCdivRate,         // 판매자(업체) 분담율 (%) — 기본 0%
                        pmCoupon.sellerCdivRemark,       // 판매자 분담 비고
                        pmCoupon.dvcPcYn,                // PC 채널 적용여부 Y/N
                        pmCoupon.dvcMwebYn,              // 모바일WEB 적용여부 Y/N
                        pmCoupon.dvcMappYn,              // 모바일APP 적용여부 Y/N
                        pmCoupon.memo,                   // 메모
                        pmCoupon.regBy, pmCoupon.regDate, pmCoupon.updBy, pmCoupon.updDate,
                        cdCt.codeLabel.as("couponTypeCdNm"),     // 쿠폰유형 코드라벨 (조인)
                        cdCs.codeLabel.as("couponStatusCdNm"),   // 쿠폰상태 코드라벨 (조인)
                        cdTt.codeLabel.as("targetTypeCdNm"),     // 적용대상 코드라벨 (조인)
                        cdMg.codeLabel.as("memGradeCdNm")        // 적용등급 코드라벨 (조인)
                ))
                .from(pmCoupon)
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("COUPON_TYPE").and(cdCt.codeValue.eq(pmCoupon.couponTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("COUPON_STATUS").and(cdCs.codeValue.eq(pmCoupon.couponStatusCd)))
                .leftJoin(cdTt).on(cdTt.codeGrp.eq("COUPON_TARGET").and(cdTt.codeValue.eq(pmCoupon.targetTypeCd)))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(pmCoupon.memGradeCd)));
    }

    /* 쿠폰 키조회 */
    @Override
    public Optional<PmCouponDto.Item> selectById(String couponId) {
        PmCouponDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCoupon.couponId.eq(couponId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 목록조회 */
    @Override
    public List<PmCouponDto.Item> selectList(PmCouponDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pmCoupon.couponId, search.getCouponIds()),
                    QdslUtil.strEq(pmCoupon.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmCoupon.couponId, search.getCouponId()),
                    QdslUtil.strEq(pmCoupon.useYn, search.getUseYn()),
                    QdslUtil.strEq(pmCoupon.couponStatusCd, search.getCouponStatusCd()),
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

    /* 쿠폰 페이지조회 */
    @Override
    public PmCouponDto.PageResponse selectPageData(PmCouponDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pmCoupon.couponId, search.getCouponIds()),
                QdslUtil.strEq(pmCoupon.siteId, search.getSiteId()),
                QdslUtil.strEq(pmCoupon.couponId, search.getCouponId()),
                QdslUtil.strEq(pmCoupon.useYn, search.getUseYn()),
                QdslUtil.strEq(pmCoupon.couponStatusCd, search.getCouponStatusCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmCouponDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmCouponDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCoupon.count())
                .where(wheres)
                .fetchOne();

        PmCouponDto.PageResponse res = new PmCouponDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PmCouponDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmCouponDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmCoupon.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmCoupon.couponId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("couponId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCoupon.couponId));
                } else if ("couponNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCoupon.couponNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCoupon.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmCoupon.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmCoupon.couponId));
        }
        return orders;
    }

    /* 쿠폰 수정 */

    @Override
    public int updateSelective(PmCoupon entity) {
        if (entity.getCouponId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCoupon);
        boolean hasAny = false;

        if (entity.getCouponStatusCd()       != null) { update.set(pmCoupon.couponStatusCd,       entity.getCouponStatusCd());       hasAny = true; }
        if (entity.getCouponStatusCdBefore() != null) { update.set(pmCoupon.couponStatusCdBefore, entity.getCouponStatusCdBefore()); hasAny = true; }
        if (entity.getCouponNm()             != null) { update.set(pmCoupon.couponNm,             entity.getCouponNm());             hasAny = true; }
        if (entity.getUseYn()                != null) { update.set(pmCoupon.useYn,                entity.getUseYn());                hasAny = true; }
        if (entity.getValidFrom()            != null) { update.set(pmCoupon.validFrom,            entity.getValidFrom());            hasAny = true; }
        if (entity.getValidTo()              != null) { update.set(pmCoupon.validTo,              entity.getValidTo());              hasAny = true; }
        if (entity.getIssueCnt()             != null) { update.set(pmCoupon.issueCnt,             entity.getIssueCnt());             hasAny = true; }
        if (entity.getMemo()                 != null) { update.set(pmCoupon.memo,                 entity.getMemo());                 hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(pmCoupon.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmCoupon.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmCoupon.couponId.eq(entity.getCouponId())).execute();
        return (int) affected;
    }
}
