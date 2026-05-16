package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponIssueDto.Item> query = baseQuery().where(where);
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

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCouponIssueDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCouponIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(ci.count())
                .from(ci)
                .leftJoin(c).on(c.couponId.eq(ci.couponId))
                .leftJoin(m).on(m.memberId.eq(ci.memberId))
                .where(where)
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
    private BooleanBuilder buildCondition(PmCouponIssueDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(ci.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getIssueId()))  w.and(ci.issueId.eq(s.getIssueId()));
        if (StringUtils.hasText(s.getMemberId())) w.and(ci.memberId.eq(s.getMemberId()));
        if (StringUtils.hasText(s.getUseYn()))    w.and(ci.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",memberNm,")) or.or(m.memberNm.likeIgnoreCase(pattern));
            if (all || types.contains(",loginId,"))  or.or(m.loginId.likeIgnoreCase(pattern));
            if (all || types.contains(",couponNm,")) or.or(c.couponNm.likeIgnoreCase(pattern));
            if (all || types.contains(",couponCd,")) or.or(c.couponCd.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(s.getDateStart(), fmt);
            LocalDate endDate   = LocalDate.parse(s.getDateEnd(),   fmt);
            LocalDateTime start   = startDate.atStartOfDay();
            LocalDateTime endExcl = endDate.plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "issue_date":
                    w.and(ci.issueDate.goe(start)).and(ci.issueDate.lt(endExcl)); break;
                case "reg_date":
                    w.and(ci.regDate.goe(start)).and(ci.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(ci.updDate.goe(start)).and(ci.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
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
        if (entity.getUpdDate() != null) { update.set(ci.updDate, entity.getUpdDate()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(ci.issueId.eq(entity.getIssueId())).execute();
        return (int) affected;
    }
}
