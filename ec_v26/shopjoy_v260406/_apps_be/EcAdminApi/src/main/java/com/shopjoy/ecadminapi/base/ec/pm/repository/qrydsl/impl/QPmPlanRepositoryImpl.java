package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmPlanItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmPlanRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmPlan QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmPlanRepositoryImpl implements QPmPlanRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmPlanRepositoryImpl";
    private static final QPmPlan pmPlan    = QPmPlan.pmPlan;
    private static final QSySite sySite  = QSySite.sySite;
    private static final QVwSyCode cdPt = new QVwSyCode("cd_pt");
    private static final QVwSyCode cdPs = new QVwSyCode("cd_ps");
    // EXISTS 서브쿼리용 별칭 (대상상품/업체/담당MD 필터 — pm_plan_item → pd_prod → sy_vendor/sy_user)
    private static final QPmPlanItem planItemEx = new QPmPlanItem("plan_item_ex");
    private static final QPdProd     pProdEx    = new QPdProd("p_prod_ex");
    private static final QSyVendor   syVendorEx = new QSyVendor("sy_vendor_ex");
    private static final QSyUser     syUserEx   = new QSyUser("sy_user_ex");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * PLAN_TYPE    {SEASON: '시즌', BRAND: '브랜드', THEME: '테마', COLLAB: '협업'}
     * PLAN_STATUS  {DRAFT: '초안', ACTIVE: '공개', ENDED: '종료'}
     */
    private JPAQuery<PmPlanDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmPlanDto.Item.class,
                        pmPlan.planId,               // 기획전ID (PK, YYMMDDhhmmss+rand4)
                        pmPlan.planNm,               // 기획전명 (내부용)
                        pmPlan.planTitle,            // 기획전 타이틀 (노출용)
                        pmPlan.planTypeCd,           // 유형 — PLAN_TYPE {SEASON: '시즌', BRAND: '브랜드', THEME: '테마', COLLAB: '협업'}
                        pmPlan.planDesc,             // 기획전 설명
                        pmPlan.thumbnailUrl,         // 썸네일 이미지 URL
                        pmPlan.bannerUrl,            // 배너 이미지 URL
                        pmPlan.startDate,            // 시작일시
                        pmPlan.endDate,              // 종료일시
                        pmPlan.planStatusCd,         // 상태 — PLAN_STATUS {DRAFT: '초안', ACTIVE: '공개', ENDED: '종료'}
                        pmPlan.planStatusCdBefore,   // 변경 전 상태
                        pmPlan.sortOrd,              // 정렬순서
                        pmPlan.useYn, pmPlan.regBy, pmPlan.regDate, pmPlan.updBy, pmPlan.updDate
                ))
                .from(pmPlan)
                .leftJoin(cdPt).on(cdPt.codeGrp.eq("PLAN_TYPE_CD").and(cdPt.codeValue.eq(pmPlan.planTypeCd)))
                .leftJoin(cdPs).on(cdPs.codeGrp.eq("PLAN_STATUS_CD").and(cdPs.codeValue.eq(pmPlan.planStatusCd)));
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
        DateTimePath<LocalDateTime> dateRangeField = pmPlan.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pmPlan.updDate;
        }
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PmPlanDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmPlan.planId, search.getPlanId()),
                    QdslUtil.strEq(pmPlan.useYn, search.getUseYn()),
                    QdslUtil.strEq(pmPlan.planStatusCd, search.getPlanStatusCd()),
                    QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                    andProdVendorMd(search),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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

    /* 프로모션 플랜 페이지조회 */
    @Override
    public BasePage<PmPlanDto.Item> selectPageData(PmPlanDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = pmPlan.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pmPlan.updDate;
        }
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmPlan.planId, search.getPlanId()),
                QdslUtil.strEq(pmPlan.useYn, search.getUseYn()),
                QdslUtil.strEq(pmPlan.planStatusCd, search.getPlanStatusCd()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andProdVendorMd(search),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

        BasePage<PmPlanDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /** andProdVendorMd — 대상상품/업체/담당MD 필터. pm_plan_item(plan_id↔prod_id) 를 거쳐
     *  pd_prod 의 vendor_id/md_user_id 까지 조인해야 하는 2단 EXISTS.
     *  ⚠ memberId 는 추가하지 않았다 — 기획전을 회원별로 기록하는 테이블이 없어
     *     안전하게 연결할 근거 컬럼이 없다. */
    private BooleanExpression andProdVendorMd(PmPlanDto.Request search) {
        boolean needProd   = StringUtils.hasText(search.getProdId()) || StringUtils.hasText(search.getProdNm());
        boolean needVendor = StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm());
        boolean needMd     = StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm());
        if (!needProd && !needVendor && !needMd) return null;

        com.querydsl.jpa.JPQLQuery<Integer> sub = JPAExpressions.selectOne().from(planItemEx)
            .where(planItemEx.planId.eq(pmPlan.planId));

        if (needProd) {
            sub = sub.where(
                QdslUtil.strEq(planItemEx.prodId, search.getProdId()),
                StringUtils.hasText(search.getProdId()) ? null
                    : JPAExpressions.selectOne().from(pProdEx)
                          .where(pProdEx.prodId.eq(planItemEx.prodId), QdslUtil.strLike(pProdEx.prodNm, search.getProdNm())).exists());
        }
        if (needVendor) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syVendorEx).on(syVendorEx.vendorId.eq(pProdEx.vendorId))
                .where(pProdEx.prodId.eq(planItemEx.prodId),
                       QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                       StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                .exists());
        }
        if (needMd) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syUserEx).on(syUserEx.userId.eq(pProdEx.mdUserId))
                .where(pProdEx.prodId.eq(planItemEx.prodId),
                       QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                       StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                .exists());
        }
        return sub.exists();
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("bannerUrl", pmPlan.bannerUrl),
            QdslUtil.FieldDef.like("planDesc", pmPlan.planDesc),
            QdslUtil.FieldDef.like("planId", pmPlan.planId),
            QdslUtil.FieldDef.like("planNm", pmPlan.planNm),
            QdslUtil.FieldDef.like("planStatusCd", pmPlan.planStatusCd),
            QdslUtil.FieldDef.like("planStatusCdBefore", pmPlan.planStatusCdBefore),
            QdslUtil.FieldDef.like("planTitle", pmPlan.planTitle),
            QdslUtil.FieldDef.like("planTypeCd", pmPlan.planTypeCd),
            QdslUtil.FieldDef.like("thumbnailUrl", pmPlan.thumbnailUrl),
            QdslUtil.FieldDef.like("useYn", pmPlan.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("planId", pmPlan.planId,
                   "planNm", pmPlan.planNm,
                   "regDate", pmPlan.regDate,
                   "sortOrd", pmPlan.sortOrd),
        new OrderSpecifier<>(Order.ASC, pmPlan.sortOrd),
        new OrderSpecifier<>(Order.ASC, pmPlan.regDate),
        new OrderSpecifier<>(Order.ASC, pmPlan.planId));
    }

    /* 프로모션 플랜 수정 */
    @Override
    public int updateSelective(PmPlan entity) {
        if (entity.getPlanId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmPlan);
        boolean hasAny = false;

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
