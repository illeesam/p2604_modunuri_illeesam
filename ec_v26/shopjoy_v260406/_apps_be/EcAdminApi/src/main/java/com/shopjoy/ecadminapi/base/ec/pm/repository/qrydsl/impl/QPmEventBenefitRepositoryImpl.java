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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventBenefitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

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
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventBenefitRepositoryImpl";
    private static final QPmEventBenefit a = QPmEventBenefit.pmEventBenefit;

    /* 이벤트 혜택 baseSelColumnQuery */
    private JPAQuery<PmEventBenefitDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmEventBenefitDto.Item.class,
                        a.benefitId, a.siteId, a.eventId, a.benefitNm,
                        a.benefitTypeCd, a.conditionDesc, a.benefitValue,
                        a.couponId, a.sortOrd,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a);
    }

    /* 이벤트 혜택 키조회 */
    @Override
    public Optional<PmEventBenefitDto.Item> selectById(String benefitId) {
        PmEventBenefitDto.Item dto = baseSelColumnQuery()
                .where(a.benefitId.eq(benefitId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 혜택 목록조회 */
    @Override
    public List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery().where(
                baseAndEventIds(search),
                baseAndEventId(search),
                baseAndSiteId(search),
                baseAndBenefitId(search),
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

    /* 이벤트 혜택 페이지조회 */
    @Override
    public PmEventBenefitDto.PageResponse selectPageData(PmEventBenefitDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery().where(
                baseAndEventIds(search),
                baseAndEventId(search),
                baseAndSiteId(search),
                baseAndBenefitId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmEventBenefitDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndEventIds(search),
                baseAndEventId(search),
                baseAndSiteId(search),
                baseAndBenefitId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmEventBenefitDto.PageResponse res = new PmEventBenefitDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* eventId IN */
    private BooleanExpression baseAndEventIds(PmEventBenefitDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getEventIds())
                ? a.eventId.in(search.getEventIds()) : null;
    }

    /* eventId 정확 일치 */
    private BooleanExpression baseAndEventId(PmEventBenefitDto.Request search) {
        return search != null && StringUtils.hasText(search.getEventId())
                ? a.eventId.eq(search.getEventId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmEventBenefitDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* benefitId 정확 일치 */
    private BooleanExpression baseAndBenefitId(PmEventBenefitDto.Request search) {
        return search != null && StringUtils.hasText(search.getBenefitId())
                ? a.benefitId.eq(search.getBenefitId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmEventBenefitDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmEventBenefitDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",benefitId,", a.benefitId, pattern);
        or = orLike(or, all, types, ",benefitNm,", a.benefitNm, pattern);
        or = orLike(or, all, types, ",benefitTypeCd,", a.benefitTypeCd, pattern);
        or = orLike(or, all, types, ",benefitValue,", a.benefitValue, pattern);
        or = orLike(or, all, types, ",conditionDesc,", a.conditionDesc, pattern);
        or = orLike(or, all, types, ",couponId,", a.couponId, pattern);
        or = orLike(or, all, types, ",eventId,", a.eventId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmEventBenefitDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.benefitId));

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
                    orders.add(new OrderSpecifier(order, a.benefitId));
                } else if ("benefitNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.benefitNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, a.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.benefitId));
        }
        return orders;
    }

    /* 이벤트 혜택 수정 */


    @Override
    public int updateSelective(PmEventBenefit entity) {
        if (entity.getBenefitId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(a.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getEventId()       != null) { update.set(a.eventId,       entity.getEventId());       hasAny = true; }
        if (entity.getBenefitNm()     != null) { update.set(a.benefitNm,     entity.getBenefitNm());     hasAny = true; }
        if (entity.getBenefitTypeCd() != null) { update.set(a.benefitTypeCd, entity.getBenefitTypeCd()); hasAny = true; }
        if (entity.getConditionDesc() != null) { update.set(a.conditionDesc, entity.getConditionDesc()); hasAny = true; }
        if (entity.getBenefitValue()  != null) { update.set(a.benefitValue,  entity.getBenefitValue());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(a.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(a.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(a.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.benefitId.eq(entity.getBenefitId())).execute();
        return (int) affected;
    }
}
