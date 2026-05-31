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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponIssueRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmCouponIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCouponIssueRepositoryImpl implements QPmCouponIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCouponIssueRepositoryImpl";
    private static final QPmCouponIssue a    = QPmCouponIssue.pmCouponIssue;
    private static final QPmCoupon       c    = QPmCoupon.pmCoupon;
    private static final QMbMember       m    = QMbMember.mbMember;
    private static final QSyCode         cdCt = new QSyCode("cd_ct");

    /* 쿠폰 발행 baseSelColumnQuery */
    private JPAQuery<PmCouponIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponIssueDto.Item.class,
                        a.issueId, a.siteId, a.couponId, a.memberId,
                        a.issueDate, a.useYn, a.useDate, a.orderId,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        c.couponNm.as("couponNm"),
                        c.couponCd.as("couponCd"),
                        c.couponTypeCd.as("couponTypeCd"),
                        c.discountRate.as("discountRate"),
                        c.discountAmt.as("discountAmt"),
                        c.validFrom.as("validFrom"),
                        c.validTo.as("validTo"),
                        m.memberNm.as("memberNm"),
                        m.loginId.as("memberEmail"),
                        m.memberPhone.as("memberPhone"),
                        cdCt.codeLabel.as("couponTypeCdNm")
                ))
                .from(a)
                .leftJoin(c).on(c.couponId.eq(a.couponId))
                .leftJoin(m).on(m.memberId.eq(a.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("COUPON_TYPE").and(cdCt.codeValue.eq(c.couponTypeCd)));
    }

    /* 쿠폰 발행 키조회 */
    @Override
    public Optional<PmCouponIssueDto.Item> selectById(String issueId) {
        PmCouponIssueDto.Item dto = baseSelColumnQuery()
                .where(a.issueId.eq(issueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 발행 목록조회 */
    @Override
    public List<PmCouponIssueDto.Item> selectList(PmCouponIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponIssueDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndIssueId(search),
                baseAndMemberId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 쿠폰 발행 페이지조회 */
    @Override
    public PmCouponIssueDto.PageResponse selectPageData(PmCouponIssueDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponIssueDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndIssueId(search),
                baseAndMemberId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .leftJoin(c).on(c.couponId.eq(a.couponId))
                .leftJoin(m).on(m.memberId.eq(a.memberId))
                .where(
                baseAndSiteId(search),
                baseAndIssueId(search),
                baseAndMemberId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmCouponIssueDto.PageResponse res = new PmCouponIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmCouponIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* issueId 정확 일치 */
    private BooleanExpression baseAndIssueId(PmCouponIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getIssueId())
                ? a.issueId.eq(search.getIssueId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(PmCouponIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? a.memberId.eq(search.getMemberId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(PmCouponIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? a.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmCouponIssueDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "issue_date": return a.issueDate.goe(start).and(a.issueDate.lt(endExcl));
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmCouponIssueDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",couponId,", a.couponId, pattern);
        or = orLike(or, all, types, ",issueId,", a.issueId, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", a.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmCouponIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.issueDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.issueId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("issueId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.issueId));
                } else if ("issueDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.issueDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.issueId));
        }
        return orders;
    }

    /* 쿠폰 발행 수정 */


    @Override
    public int updateSelective(PmCouponIssue entity) {
        if (entity.getIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getUseYn()   != null) { update.set(a.useYn,   entity.getUseYn());   hasAny = true; }
        if (entity.getUseDate() != null) { update.set(a.useDate, entity.getUseDate()); hasAny = true; }
        if (entity.getOrderId() != null) { update.set(a.orderId, entity.getOrderId()); hasAny = true; }
        if (entity.getUpdBy()   != null) { update.set(a.updBy,   entity.getUpdBy());   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.issueId.eq(entity.getIssueId())).execute();
        return (int) affected;
    }
}
