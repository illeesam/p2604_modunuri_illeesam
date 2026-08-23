package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSavePolicyDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSavePolicy;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSavePolicy;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSavePolicyRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PmSavePolicy(적립금 정책(캠페인)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSavePolicyRepositoryImpl implements QPmSavePolicyRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSavePolicyRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPmSavePolicy pmSavePolicy = QPmSavePolicy.pmSavePolicy;
    private static final QSyVendor     syVendor     = QSyVendor.syVendor;    // EXISTS 서브쿼리용 별칭 (대상상품 필터 — pm_save_prod → pd_prod)
    private static final QPmSaveProd saveProdEx = new QPmSaveProd("save_prod_ex");
    private static final QPdProd     pProdEx    = new QPdProd("p_prod_ex");

    private JPAQuery<PmSavePolicyDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmSavePolicyDto.Item.class,
                        pmSavePolicy.saveId,  // 적립금정책ID (YYMMDDhhmmss+rand4)
                        pmSavePolicy.saveNm,  // 적립금명
                        pmSavePolicy.saveTypeCd,  // 적립금 유형 (코드: SAVE_TYPE_CD)
                        pmSavePolicy.saveType,  // 적립유형 (코드: SAVE_ISSUE_TYPE_CD)
                        pmSavePolicy.saveVal,  // 적립값
                        pmSavePolicy.saveUnit,  // 적립단위 (코드: SAVE_UNIT)
                        pmSavePolicy.minOrderAmt,  // 최소주문금액
                        pmSavePolicy.expireDay,  // 유효기간(일)
                        pmSavePolicy.saveStatus,  // 상태 (코드: PROMO_STATUS)
                        pmSavePolicy.startDate,  // 시작일
                        pmSavePolicy.endDate,  // 종료일
                        pmSavePolicy.memGradeCd,  // 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
                        pmSavePolicy.visibilityTargets,  // 공개대상 (^코드^코드^ 형식, 예: ^PUBLIC^)
                        pmSavePolicy.vendorId,  // 판매업체 (sy_vendor.vendor_id)
                        pmSavePolicy.chargeStaff,  // 판매담당자명 (업체 선택 시 자동 채움, 수정 가능)
                        pmSavePolicy.remark,  // 비고
                        pmSavePolicy.useYn,  // 사용여부 Y/N
                        pmSavePolicy.regBy,      // 등록자
                        pmSavePolicy.regDate,    // 등록일시
                        pmSavePolicy.updBy,      // 수정자
                        pmSavePolicy.updDate,    // 수정일시
                        pmSavePolicy.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pmSavePolicy.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pmSavePolicy)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pmSavePolicy.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pmSavePolicy.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pmSavePolicy.siteId)) // 사이트

                ;
    }

    /* 단건 조회 */
    @Override
    public Optional<PmSavePolicyDto.Item> selectById(String saveId) {
        PmSavePolicyDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmSavePolicy.saveId.eq(saveId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 목록조회 */
    @Override
    public List<PmSavePolicyDto.Item> selectList(PmSavePolicyDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmSavePolicy.saveId, search.getSaveId()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.saveTypeCd, search.getSaveTypeCd()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.saveStatus, search.getSaveStatus()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.useYn, search.getUseYn()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.vendorId, search.getVendorId())); // 업체 ID 필터
        whereList.add(QdslUtil.strLike(syVendor.vendorNm, search.getVendorNm())); // 업체명 필터
        whereList.add(andProd(search));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmSavePolicy.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmSavePolicy.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.siteId, search.getSiteId())); // 사이트ID

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmSavePolicyDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pmSavePolicy.vendorId)) // 업체
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PmSavePolicyDto.Item> list = query.fetch();
        return list;
    }

    /* 페이지 목록 */
    @Override
    public BasePage<PmSavePolicyDto.Item> selectPageData(PmSavePolicyDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmSavePolicy.saveId, search.getSaveId()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.saveTypeCd, search.getSaveTypeCd()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.saveStatus, search.getSaveStatus()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.useYn, search.getUseYn()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.vendorId, search.getVendorId())); // 업체 ID 필터
        whereList.add(QdslUtil.strLike(syVendor.vendorNm, search.getVendorNm())); // 업체명 필터
        whereList.add(andProd(search));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmSavePolicy.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmSavePolicy.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmSavePolicy.siteId, search.getSiteId())); // 사이트ID
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmSavePolicyDto.Item> query = baseSelColumnQuery()
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pmSavePolicy.vendorId)) // 업체
                ;

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmSavePolicyDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmSavePolicy.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmSavePolicyDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** andProd — 대상상품 필터. pm_save_prod(save_id↔prod_id, 배치 전개) 를 거쳐 pd_prod 조인 */
    private BooleanExpression andProd(PmSavePolicyDto.Request search) {
        if (!StringUtils.hasText(search.getProdId()) && !StringUtils.hasText(search.getProdNm())) return null;
        return JPAExpressions.selectOne().from(saveProdEx)
            .where(saveProdEx.saveId.eq(pmSavePolicy.saveId),
                   QdslUtil.strEq(saveProdEx.prodId, search.getProdId()),
                   StringUtils.hasText(search.getProdId()) ? null
                       : JPAExpressions.selectOne().from(pProdEx)
                             .where(pProdEx.prodId.eq(saveProdEx.prodId), QdslUtil.strLike(pProdEx.prodNm, search.getProdNm())).exists())
            .exists();
    }

    /* searchType 예: "saveId,saveNm,remark,saveStatus,saveTypeCd" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("saveId", pmSavePolicy.saveId),
            QdslUtil.FieldDef.like("saveNm", pmSavePolicy.saveNm),
            QdslUtil.FieldDef.like("remark", pmSavePolicy.remark),
            QdslUtil.FieldDef.like("saveStatus", pmSavePolicy.saveStatus),
            QdslUtil.FieldDef.like("saveTypeCd", pmSavePolicy.saveTypeCd)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("saveId", pmSavePolicy.saveId,
                   "saveNm", pmSavePolicy.saveNm,
                   "regDate", pmSavePolicy.regDate),
        new OrderSpecifier<>(Order.DESC, pmSavePolicy.regDate),
        new OrderSpecifier<>(Order.ASC, pmSavePolicy.saveId));
    }

    @Override
    public int updateSelective(PmSavePolicy entity) {
        if (entity.getSaveId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmSavePolicy);
        boolean hasAny = false;

        if (entity.getSaveNm()            != null) { update.set(pmSavePolicy.saveNm,            entity.getSaveNm());            hasAny = true; }
        if (entity.getSaveTypeCd()        != null) { update.set(pmSavePolicy.saveTypeCd,        entity.getSaveTypeCd());        hasAny = true; }
        if (entity.getSaveType()          != null) { update.set(pmSavePolicy.saveType,          entity.getSaveType());          hasAny = true; }
        if (entity.getSaveVal()           != null) { update.set(pmSavePolicy.saveVal,           entity.getSaveVal());           hasAny = true; }
        if (entity.getSaveUnit()          != null) { update.set(pmSavePolicy.saveUnit,          entity.getSaveUnit());          hasAny = true; }
        if (entity.getMinOrderAmt()       != null) { update.set(pmSavePolicy.minOrderAmt,       entity.getMinOrderAmt());       hasAny = true; }
        if (entity.getExpireDay()         != null) { update.set(pmSavePolicy.expireDay,         entity.getExpireDay());         hasAny = true; }
        if (entity.getSaveStatus()        != null) { update.set(pmSavePolicy.saveStatus,        entity.getSaveStatus());        hasAny = true; }
        if (entity.getStartDate()         != null) { update.set(pmSavePolicy.startDate,         entity.getStartDate());         hasAny = true; }
        if (entity.getEndDate()           != null) { update.set(pmSavePolicy.endDate,           entity.getEndDate());           hasAny = true; }
        if (entity.getMemGradeCd()        != null) { update.set(pmSavePolicy.memGradeCd,        entity.getMemGradeCd());        hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(pmSavePolicy.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getVendorId()          != null) { update.set(pmSavePolicy.vendorId,          entity.getVendorId());          hasAny = true; }
        if (entity.getChargeStaff()       != null) { update.set(pmSavePolicy.chargeStaff,       entity.getChargeStaff());       hasAny = true; }
        if (entity.getRemark()            != null) { update.set(pmSavePolicy.remark,            entity.getRemark());            hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(pmSavePolicy.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(pmSavePolicy.updBy,             entity.getUpdBy());             hasAny = true; }
        update.set(pmSavePolicy.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmSavePolicy.saveId.eq(entity.getSaveId())).execute();
        return (int) affected;
    }
}
