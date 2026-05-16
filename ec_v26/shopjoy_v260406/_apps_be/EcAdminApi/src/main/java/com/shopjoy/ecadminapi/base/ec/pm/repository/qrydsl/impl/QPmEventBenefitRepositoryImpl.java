package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventBenefitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmEventBenefit QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventBenefitRepositoryImpl implements QPmEventBenefitRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmEventBenefit b = QPmEventBenefit.pmEventBenefit;

    /* 이벤트 혜택 키조회 */
    @Override
    public Optional<PmEventBenefitDto.Item> selectById(String benefitId) {
        PmEventBenefitDto.Item dto = baseQuery()
                .where(b.benefitId.eq(benefitId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 혜택 목록조회 */
    @Override
    public List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventBenefitDto.Item> query = baseQuery().where(where);
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

    /* 이벤트 혜택 페이지조회 */
    @Override
    public PmEventBenefitDto.PageResponse selectPageList(PmEventBenefitDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventBenefitDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmEventBenefitDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(b.count())
                .from(b)
                .where(where)
                .fetchOne();

        PmEventBenefitDto.PageResponse res = new PmEventBenefitDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 이벤트 혜택 baseQuery */
    private JPAQuery<PmEventBenefitDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmEventBenefitDto.Item.class,
                        b.benefitId, b.siteId, b.eventId, b.benefitNm,
                        b.benefitTypeCd, b.conditionDesc, b.benefitValue,
                        b.couponId, b.sortOrd,
                        b.regBy, b.regDate, b.updBy, b.updDate
                ))
                .from(b);
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(PmEventBenefitDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))    w.and(b.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getBenefitId())) w.and(b.benefitId.eq(s.getBenefitId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_benefit_nm,")) or.or(b.benefitNm.likeIgnoreCase(pattern));
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
                case "reg_date":
                    w.and(b.regDate.goe(start)).and(b.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(b.updDate.goe(start)).and(b.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(PmEventBenefitDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, b.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("benefitId".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.benefitId));
                } else if ("benefitNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.benefitNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.regDate));
                }
            }
        }
        return orders;
    }

    /* 이벤트 혜택 수정 */
    @Override
    public int updateSelective(PmEventBenefit entity) {
        if (entity.getBenefitId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(b.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getEventId()       != null) { update.set(b.eventId,       entity.getEventId());       hasAny = true; }
        if (entity.getBenefitNm()     != null) { update.set(b.benefitNm,     entity.getBenefitNm());     hasAny = true; }
        if (entity.getBenefitTypeCd() != null) { update.set(b.benefitTypeCd, entity.getBenefitTypeCd()); hasAny = true; }
        if (entity.getConditionDesc() != null) { update.set(b.conditionDesc, entity.getConditionDesc()); hasAny = true; }
        if (entity.getBenefitValue()  != null) { update.set(b.benefitValue,  entity.getBenefitValue());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(b.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(b.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(b.updBy,         entity.getUpdBy());         hasAny = true; }
        if (entity.getUpdDate()       != null) { update.set(b.updDate,       entity.getUpdDate());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(b.benefitId.eq(entity.getBenefitId())).execute();
        return (int) affected;
    }
}
