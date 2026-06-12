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
    private static final QPmPlan pmPlan    = QPmPlan.pmPlan;
    private static final QSySite sySite  = QSySite.sySite;
    private static final QSyCode cdPt = new QSyCode("cd_pt");
    private static final QSyCode cdPs = new QSyCode("cd_ps");

    /* 프로모션 플랜 baseSelColumnQuery */
    private JPAQuery<PmPlanDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmPlanDto.Item.class,
                        pmPlan.planId, pmPlan.siteId, pmPlan.planNm, pmPlan.planTitle, pmPlan.planTypeCd,
                        pmPlan.planDesc, pmPlan.thumbnailUrl, pmPlan.bannerUrl, pmPlan.startDate, pmPlan.endDate,
                        pmPlan.planStatusCd, pmPlan.planStatusCdBefore, pmPlan.sortOrd, pmPlan.useYn,
                        pmPlan.regBy, pmPlan.regDate, pmPlan.updBy, pmPlan.updDate
                ))
                .from(pmPlan)
                .leftJoin(sySite).on(sySite.siteId.eq(pmPlan.siteId))
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PLAN_TYPE").and(cdPt.codeValue.eq(pmPlan.planTypeCd)))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PLAN_STATUS").and(cdPs.codeValue.eq(pmPlan.planStatusCd)));
    }

    /* 프로모션 플랜 키조회 */
    @Override
    public Optional<PmPlanDto.Item> selectById(String planId) {
        PmPlanDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmPlan.planId.eq(planId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 프로모션 플랜 목록조회 */
    @Override
    public List<PmPlanDto.Item> selectList(PmPlanDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmPlanDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndPlanId(search),
                    baseAndUseYn(search),
                    baseAndPlanStatusCd(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 프로모션 플랜 페이지조회 */
    @Override
    public PmPlanDto.PageResponse selectPageData(PmPlanDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndPlanId(search),
                baseAndUseYn(search),
                baseAndPlanStatusCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmPlanDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmPlanDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmPlan.count())
                .where(wheres)
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
                ? pmPlan.siteId.eq(search.getSiteId()) : null;
    }

    /* planId 정확 일치 */
    private BooleanExpression baseAndPlanId(PmPlanDto.Request search) {
        return search != null && StringUtils.hasText(search.getPlanId())
                ? pmPlan.planId.eq(search.getPlanId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(PmPlanDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? pmPlan.useYn.eq(search.getUseYn()) : null;
    }

    /* planStatusCd 정확 일치 */
    private BooleanExpression baseAndPlanStatusCd(PmPlanDto.Request search) {
        return search != null && StringUtils.hasText(search.getPlanStatusCd())
                ? pmPlan.planStatusCd.eq(search.getPlanStatusCd()) : null;
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
            case "reg_date": return pmPlan.regDate.goe(start).and(pmPlan.regDate.lt(endExcl));
            case "upd_date": return pmPlan.updDate.goe(start).and(pmPlan.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",bannerUrl,", pmPlan.bannerUrl, pattern);
        or = orLike(or, all, types, ",planDesc,", pmPlan.planDesc, pattern);
        or = orLike(or, all, types, ",planId,", pmPlan.planId, pattern);
        or = orLike(or, all, types, ",planNm,", pmPlan.planNm, pattern);
        or = orLike(or, all, types, ",planStatusCd,", pmPlan.planStatusCd, pattern);
        or = orLike(or, all, types, ",planStatusCdBefore,", pmPlan.planStatusCdBefore, pattern);
        or = orLike(or, all, types, ",planTitle,", pmPlan.planTitle, pattern);
        or = orLike(or, all, types, ",planTypeCd,", pmPlan.planTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", pmPlan.siteId, pattern);
        or = orLike(or, all, types, ",thumbnailUrl,", pmPlan.thumbnailUrl, pattern);
        or = orLike(or, all, types, ",useYn,", pmPlan.useYn, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlan.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlan.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlan.planId));

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
                    orders.add(new OrderSpecifier(order, pmPlan.planId));
                } else if ("planNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmPlan.planNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmPlan.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pmPlan.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlan.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlan.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmPlan.planId));
        }
        return orders;
    }

    /* 프로모션 플랜 수정 */
    @Override
    public int updateSelective(PmPlan entity) {
        if (entity.getPlanId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmPlan);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(pmPlan.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getPlanNm()             != null) { update.set(pmPlan.planNm,             entity.getPlanNm());             hasAny = true; }
        if (entity.getPlanTitle()          != null) { update.set(pmPlan.planTitle,          entity.getPlanTitle());          hasAny = true; }
        if (entity.getPlanTypeCd()         != null) { update.set(pmPlan.planTypeCd,         entity.getPlanTypeCd());         hasAny = true; }
        if (entity.getPlanDesc()           != null) { update.set(pmPlan.planDesc,           entity.getPlanDesc());           hasAny = true; }
        if (entity.getThumbnailUrl()       != null) { update.set(pmPlan.thumbnailUrl,       entity.getThumbnailUrl());       hasAny = true; }
        if (entity.getBannerUrl()          != null) { update.set(pmPlan.bannerUrl,          entity.getBannerUrl());          hasAny = true; }
        if (entity.getStartDate()          != null) { update.set(pmPlan.startDate,          entity.getStartDate());          hasAny = true; }
        if (entity.getEndDate()            != null) { update.set(pmPlan.endDate,            entity.getEndDate());            hasAny = true; }
        if (entity.getPlanStatusCd()       != null) { update.set(pmPlan.planStatusCd,       entity.getPlanStatusCd());       hasAny = true; }
        if (entity.getPlanStatusCdBefore() != null) { update.set(pmPlan.planStatusCdBefore, entity.getPlanStatusCdBefore()); hasAny = true; }
        if (entity.getSortOrd()            != null) { update.set(pmPlan.sortOrd,            entity.getSortOrd());            hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(pmPlan.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(pmPlan.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmPlan.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmPlan.planId.eq(entity.getPlanId())).execute();
        return (int) affected;
    }
}
