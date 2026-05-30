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
    private static final QPmCouponIssue ci    = QPmCouponIssue.pmCouponIssue;
    private static final QPmCoupon       c    = QPmCoupon.pmCoupon;
    private static final QMbMember       m    = QMbMember.mbMember;
    private static final QSyCode         cdCt = new QSyCode("cd_ct");

    /* 쿠폰 발행 키조회 */
    @Override
    public Optional<PmCouponIssueDto.Item> selectById(String issueId) {
        PmCouponIssueDto.Item dto = baseQuery()
                .where(ci.issueId.eq(issueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 쿠폰 발행 목록조회 */
    @Override
    public List<PmCouponIssueDto.Item> selectList(PmCouponIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponIssueDto.Item> query = baseQuery().where(
                andSiteId(search),
                andIssueId(search),
                andMemberId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
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
    public PmCouponIssueDto.PageResponse selectPageList(PmCouponIssueDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponIssueDto.Item> query = baseQuery().where(
                andSiteId(search),
                andIssueId(search),
                andMemberId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(ci.count())
                .from(ci)
                .leftJoin(c).on(c.couponId.eq(ci.couponId))
                .leftJoin(m).on(m.memberId.eq(ci.memberId))
                .where(
                andSiteId(search),
                andIssueId(search),
                andMemberId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PmCouponIssueDto.PageResponse res = new PmCouponIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 쿠폰 발행 baseQuery */
    private JPAQuery<PmCouponIssueDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmCouponIssueDto.Item.class,
                        ci.issueId, ci.siteId, ci.couponId, ci.memberId,
                        ci.issueDate, ci.useYn, ci.useDate, ci.orderId,
                        ci.regBy, ci.regDate, ci.updBy, ci.updDate,
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
                .from(ci)
                .leftJoin(c).on(c.couponId.eq(ci.couponId))
                .leftJoin(m).on(m.memberId.eq(ci.memberId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("COUPON_TYPE").and(cdCt.codeValue.eq(c.couponTypeCd)));
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PmCouponIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? ci.siteId.eq(search.getSiteId()) : null;
    }

    /* issueId 정확 일치 */
    private BooleanExpression andIssueId(PmCouponIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getIssueId())
                ? ci.issueId.eq(search.getIssueId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression andMemberId(PmCouponIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? ci.memberId.eq(search.getMemberId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(PmCouponIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? ci.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PmCouponIssueDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "issue_date": return ci.issueDate.goe(start).and(ci.issueDate.lt(endExcl));
            case "reg_date": return ci.regDate.goe(start).and(ci.regDate.lt(endExcl));
            case "upd_date": return ci.updDate.goe(start).and(ci.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PmCouponIssueDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",couponId,", ci.couponId, pattern);
        or = orLike(or, all, types, ",issueId,", ci.issueId, pattern);
        or = orLike(or, all, types, ",memberId,", ci.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", ci.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", ci.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", ci.useYn, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, ci.issueDate));
            orders.add(new OrderSpecifier<>(Order.ASC, ci.issueId));
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
                    orders.add(new OrderSpecifier(order, ci.issueId));
                } else if ("issueDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, ci.issueDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, ci.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, ci.issueId));
        }
        return orders;
    }

    /* 쿠폰 발행 수정 */
    @Override
    public int updateSelective(PmCouponIssue entity) {
        if (entity.getIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(ci);
        boolean hasAny = false;

        if (entity.getUseYn()   != null) { update.set(ci.useYn,   entity.getUseYn());   hasAny = true; }
        if (entity.getUseDate() != null) { update.set(ci.useDate, entity.getUseDate()); hasAny = true; }
        if (entity.getOrderId() != null) { update.set(ci.orderId, entity.getOrderId()); hasAny = true; }
        if (entity.getUpdBy()   != null) { update.set(ci.updBy,   entity.getUpdBy());   hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(ci.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(ci.issueId.eq(entity.getIssueId())).execute();
        return (int) affected;
    }
}
