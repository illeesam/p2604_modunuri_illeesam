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
    private static final QPmEventBenefit pmEventBenefit = QPmEventBenefit.pmEventBenefit;

    /* 이벤트 혜택 baseSelColumnQuery */
    private JPAQuery<PmEventBenefitDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmEventBenefitDto.Item.class,
                        pmEventBenefit.benefitId, pmEventBenefit.siteId, pmEventBenefit.eventId, pmEventBenefit.benefitNm,
                        pmEventBenefit.benefitTypeCd, pmEventBenefit.conditionDesc, pmEventBenefit.benefitValue,
                        pmEventBenefit.couponId, pmEventBenefit.sortOrd,
                        pmEventBenefit.regBy, pmEventBenefit.regDate, pmEventBenefit.updBy, pmEventBenefit.updDate
                ))
                .from(pmEventBenefit);
    }

    /* 이벤트 혜택 키조회 */
    @Override
    public Optional<PmEventBenefitDto.Item> selectById(String benefitId) {
        PmEventBenefitDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmEventBenefit.benefitId.eq(benefitId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 혜택 목록조회 */
    @Override
    public List<PmEventBenefitDto.Item> selectList(PmEventBenefitDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
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
        BooleanExpression[] wheres = {
                baseAndEventIds(search),
                baseAndEventId(search),
                baseAndSiteId(search),
                baseAndBenefitId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PmEventBenefitDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmEventBenefitDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pmEventBenefit.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt").from(pmEventBenefit)
                .where(wheres)
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
                ? pmEventBenefit.eventId.in(search.getEventIds()) : null;
    }

    /* eventId 정확 일치 */
    private BooleanExpression baseAndEventId(PmEventBenefitDto.Request search) {
        return search != null && StringUtils.hasText(search.getEventId())
                ? pmEventBenefit.eventId.eq(search.getEventId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmEventBenefitDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmEventBenefit.siteId.eq(search.getSiteId()) : null;
    }

    /* benefitId 정확 일치 */
    private BooleanExpression baseAndBenefitId(PmEventBenefitDto.Request search) {
        return search != null && StringUtils.hasText(search.getBenefitId())
                ? pmEventBenefit.benefitId.eq(search.getBenefitId()) : null;
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
            case "reg_date": return pmEventBenefit.regDate.goe(start).and(pmEventBenefit.regDate.lt(endExcl));
            case "upd_date": return pmEventBenefit.updDate.goe(start).and(pmEventBenefit.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",benefitId,", pmEventBenefit.benefitId, pattern);
        or = orLike(or, all, types, ",benefitNm,", pmEventBenefit.benefitNm, pattern);
        or = orLike(or, all, types, ",benefitTypeCd,", pmEventBenefit.benefitTypeCd, pattern);
        or = orLike(or, all, types, ",benefitValue,", pmEventBenefit.benefitValue, pattern);
        or = orLike(or, all, types, ",conditionDesc,", pmEventBenefit.conditionDesc, pattern);
        or = orLike(or, all, types, ",couponId,", pmEventBenefit.couponId, pattern);
        or = orLike(or, all, types, ",eventId,", pmEventBenefit.eventId, pattern);
        or = orLike(or, all, types, ",siteId,", pmEventBenefit.siteId, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.benefitId));

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
                    orders.add(new OrderSpecifier(order, pmEventBenefit.benefitId));
                } else if ("benefitNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEventBenefit.benefitNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEventBenefit.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pmEventBenefit.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEventBenefit.benefitId));
        }
        return orders;
    }

    /* 이벤트 혜택 수정 */


    @Override
    public int updateSelective(PmEventBenefit entity) {
        if (entity.getBenefitId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmEventBenefit);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(pmEventBenefit.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getEventId()       != null) { update.set(pmEventBenefit.eventId,       entity.getEventId());       hasAny = true; }
        if (entity.getBenefitNm()     != null) { update.set(pmEventBenefit.benefitNm,     entity.getBenefitNm());     hasAny = true; }
        if (entity.getBenefitTypeCd() != null) { update.set(pmEventBenefit.benefitTypeCd, entity.getBenefitTypeCd()); hasAny = true; }
        if (entity.getConditionDesc() != null) { update.set(pmEventBenefit.conditionDesc, entity.getConditionDesc()); hasAny = true; }
        if (entity.getBenefitValue()  != null) { update.set(pmEventBenefit.benefitValue,  entity.getBenefitValue());  hasAny = true; }
        if (entity.getCouponId()      != null) { update.set(pmEventBenefit.couponId,      entity.getCouponId());      hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(pmEventBenefit.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pmEventBenefit.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmEventBenefit.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmEventBenefit.benefitId.eq(entity.getBenefitId())).execute();
        return (int) affected;
    }
}
