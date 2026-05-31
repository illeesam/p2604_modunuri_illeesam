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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmPlanRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmPlan QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmPlanRepositoryImpl implements QPmPlanRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmPlanRepositoryImpl";
    private static final QPmPlan a    = QPmPlan.pmPlan;
    private static final QSySite ste  = QSySite.sySite;
    private static final QSyCode cdPt = new QSyCode("cd_pt");
    private static final QSyCode cdPs = new QSyCode("cd_ps");

    /* 프로모션 플랜 baseSelColumnQuery */
    private JPAQuery<PmPlanDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmPlanDto.Item.class,
                        a.planId, a.siteId, a.planNm, a.planTitle, a.planTypeCd,
                        a.planDesc, a.thumbnailUrl, a.bannerUrl, a.startDate, a.endDate,
                        a.planStatusCd, a.planStatusCdBefore, a.sortOrd, a.useYn,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PLAN_TYPE").and(cdPt.codeValue.eq(a.planTypeCd)))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PLAN_STATUS").and(cdPs.codeValue.eq(a.planStatusCd)));
    }

    /* 프로모션 플랜 키조회 */
    @Override
    public Optional<PmPlanDto.Item> selectById(String planId) {
        PmPlanDto.Item dto = baseSelColumnQuery()
                .where(a.planId.eq(planId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 프로모션 플랜 목록조회 */
    @Override
    public List<PmPlanDto.Item> selectList(PmPlanDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmPlanDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndPlanId(search),
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

    /* 프로모션 플랜 페이지조회 */
    @Override
    public PmPlanDto.PageResponse selectPageList(PmPlanDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmPlanDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndPlanId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmPlanDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndPlanId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmPlanDto.PageResponse res = new PmPlanDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmPlanDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* planId 정확 일치 */
    private BooleanExpression baseAndPlanId(PmPlanDto.Request search) {
        return search != null && StringUtils.hasText(search.getPlanId())
                ? a.planId.eq(search.getPlanId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(PmPlanDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? a.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmPlanDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(PmPlanDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",bannerUrl,", a.bannerUrl, pattern);
        or = orLike(or, all, types, ",planDesc,", a.planDesc, pattern);
        or = orLike(or, all, types, ",planId,", a.planId, pattern);
        or = orLike(or, all, types, ",planNm,", a.planNm, pattern);
        or = orLike(or, all, types, ",planStatusCd,", a.planStatusCd, pattern);
        or = orLike(or, all, types, ",planStatusCdBefore,", a.planStatusCdBefore, pattern);
        or = orLike(or, all, types, ",planTitle,", a.planTitle, pattern);
        or = orLike(or, all, types, ",planTypeCd,", a.planTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",thumbnailUrl,", a.thumbnailUrl, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmPlanDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.planId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("planId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.planId));
                } else if ("planNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.planNm));
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
            orders.add(new OrderSpecifier<>(Order.ASC, a.planId));
        }
        return orders;
    }

    /* 프로모션 플랜 수정 */
    @Override
    public int updateSelective(PmPlan entity) {
        if (entity.getPlanId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(a.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getPlanNm()             != null) { update.set(a.planNm,             entity.getPlanNm());             hasAny = true; }
        if (entity.getPlanTitle()          != null) { update.set(a.planTitle,          entity.getPlanTitle());          hasAny = true; }
        if (entity.getPlanTypeCd()         != null) { update.set(a.planTypeCd,         entity.getPlanTypeCd());         hasAny = true; }
        if (entity.getPlanDesc()           != null) { update.set(a.planDesc,           entity.getPlanDesc());           hasAny = true; }
        if (entity.getThumbnailUrl()       != null) { update.set(a.thumbnailUrl,       entity.getThumbnailUrl());       hasAny = true; }
        if (entity.getBannerUrl()          != null) { update.set(a.bannerUrl,          entity.getBannerUrl());          hasAny = true; }
        if (entity.getStartDate()          != null) { update.set(a.startDate,          entity.getStartDate());          hasAny = true; }
        if (entity.getEndDate()            != null) { update.set(a.endDate,            entity.getEndDate());            hasAny = true; }
        if (entity.getPlanStatusCd()       != null) { update.set(a.planStatusCd,       entity.getPlanStatusCd());       hasAny = true; }
        if (entity.getPlanStatusCdBefore() != null) { update.set(a.planStatusCdBefore, entity.getPlanStatusCdBefore()); hasAny = true; }
        if (entity.getSortOrd()            != null) { update.set(a.sortOrd,            entity.getSortOrd());            hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(a.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(a.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.planId.eq(entity.getPlanId())).execute();
        return (int) affected;
    }
}
