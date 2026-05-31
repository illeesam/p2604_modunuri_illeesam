package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmCoupon QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponRepositoryImpl implements QPmCouponRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponRepositoryImpl";
    private static final QPmCoupon c   = QPmCoupon.pmCoupon;
    private static final QSyCode  cdCt = new QSyCode("cd_ct");
    private static final QSyCode  cdCs = new QSyCode("cd_cs");
    private static final QSyCode  cdTt = new QSyCode("cd_tt");
    private static final QSyCode  cdMg = new QSyCode("cd_mg");

    /* 쿠폰 키조회 */
    @Override
    public Optional<PmCouponDto.Item> selectById(String couponId) {
        PmCouponDto.Item dto = baseQuery()
                .where(c.couponId.eq(couponId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 목록조회 */
    @Override
    public List<PmCouponDto.Item> selectList(PmCouponDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponDto.Item> query = baseQuery().where(
                baseAndCouponIds(search),
                baseAndSiteId(search),
                baseAndCouponId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 쿠폰 페이지조회 */
    @Override
    public PmCouponDto.PageResponse selectPageList(PmCouponDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponDto.Item> query = baseQuery().where(
                baseAndCouponIds(search),
                baseAndSiteId(search),
                baseAndCouponId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(
                baseAndCouponIds(search),
                baseAndSiteId(search),
                baseAndCouponId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmCouponDto.PageResponse res = new PmCouponDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 쿠폰 baseQuery */
    private JPAQuery<PmCouponDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponDto.Item.class,
                        c.couponId, c.siteId, c.couponCd, c.couponNm,
                        c.couponTypeCd, c.discountRate, c.discountAmt,
                        c.minOrderAmt, c.minOrderQty, c.maxDiscountAmt,
                        c.issueLimit, c.issueCnt, c.maxIssuePerMem,
                        c.couponDesc, c.validFrom, c.validTo,
                        c.couponStatusCd, c.couponStatusCdBefore,
                        c.useYn, c.targetTypeCd, c.targetValue, c.memGradeCd,
                        c.selfCdivRate, c.sellerCdivRate, c.sellerCdivRemark,
                        c.dvcPcYn, c.dvcMwebYn, c.dvcMappYn, c.memo,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        cdCt.codeLabel.as("couponTypeCdNm"),
                        cdCs.codeLabel.as("couponStatusCdNm"),
                        cdTt.codeLabel.as("targetTypeCdNm"),
                        cdMg.codeLabel.as("memGradeCdNm")
                ))
                .from(c)
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("COUPON_TYPE").and(cdCt.codeValue.eq(c.couponTypeCd)))
                .leftJoin(cdCs).on(cdCs.codeGrp.eq("COUPON_STATUS").and(cdCs.codeValue.eq(c.couponStatusCd)))
                .leftJoin(cdTt).on(cdTt.codeGrp.eq("COUPON_TARGET").and(cdTt.codeValue.eq(c.targetTypeCd)))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(c.memGradeCd)));
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* couponId IN */
    private BooleanExpression baseAndCouponIds(PmCouponDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getCouponIds())
                ? c.couponId.in(search.getCouponIds()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmCouponDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? c.siteId.eq(search.getSiteId()) : null;
    }

    /* couponId 정확 일치 */
    private BooleanExpression baseAndCouponId(PmCouponDto.Request search) {
        return search != null && StringUtils.hasText(search.getCouponId())
                ? c.couponId.eq(search.getCouponId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(PmCouponDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? c.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmCouponDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return c.regDate.goe(start).and(c.regDate.lt(endExcl));
            case "upd_date": return c.updDate.goe(start).and(c.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmCouponDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",couponCd,", c.couponCd, pattern);
        or = orLike(or, all, types, ",couponDesc,", c.couponDesc, pattern);
        or = orLike(or, all, types, ",couponId,", c.couponId, pattern);
        or = orLike(or, all, types, ",couponNm,", c.couponNm, pattern);
        or = orLike(or, all, types, ",couponStatusCd,", c.couponStatusCd, pattern);
        or = orLike(or, all, types, ",couponStatusCdBefore,", c.couponStatusCdBefore, pattern);
        or = orLike(or, all, types, ",couponTypeCd,", c.couponTypeCd, pattern);
        or = orLike(or, all, types, ",dvcMappYn,", c.dvcMappYn, pattern);
        or = orLike(or, all, types, ",dvcMwebYn,", c.dvcMwebYn, pattern);
        or = orLike(or, all, types, ",dvcPcYn,", c.dvcPcYn, pattern);
        or = orLike(or, all, types, ",memGradeCd,", c.memGradeCd, pattern);
        or = orLike(or, all, types, ",memo,", c.memo, pattern);
        or = orLike(or, all, types, ",sellerCdivRemark,", c.sellerCdivRemark, pattern);
        or = orLike(or, all, types, ",siteId,", c.siteId, pattern);
        or = orLike(or, all, types, ",targetTypeCd,", c.targetTypeCd, pattern);
        or = orLike(or, all, types, ",targetValue,", c.targetValue, pattern);
        or = orLike(or, all, types, ",useYn,", c.useYn, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.couponId));
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
                    orders.add(new OrderSpecifier(order, c.couponId));
                } else if ("couponNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.couponNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.couponId));
        }
        return orders;
    }

    /* 쿠폰 수정 */
    @Override
    public int updateSelective(PmCoupon entity) {
        if (entity.getCouponId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getCouponStatusCd()       != null) { update.set(c.couponStatusCd,       entity.getCouponStatusCd());       hasAny = true; }
        if (entity.getCouponStatusCdBefore() != null) { update.set(c.couponStatusCdBefore, entity.getCouponStatusCdBefore()); hasAny = true; }
        if (entity.getCouponNm()             != null) { update.set(c.couponNm,             entity.getCouponNm());             hasAny = true; }
        if (entity.getUseYn()                != null) { update.set(c.useYn,                entity.getUseYn());                hasAny = true; }
        if (entity.getValidFrom()            != null) { update.set(c.validFrom,            entity.getValidFrom());            hasAny = true; }
        if (entity.getValidTo()              != null) { update.set(c.validTo,              entity.getValidTo());              hasAny = true; }
        if (entity.getIssueCnt()             != null) { update.set(c.issueCnt,             entity.getIssueCnt());             hasAny = true; }
        if (entity.getMemo()                 != null) { update.set(c.memo,                 entity.getMemo());                 hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(c.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(c.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(c.couponId.eq(entity.getCouponId())).execute();
        return (int) affected;
    }
}
