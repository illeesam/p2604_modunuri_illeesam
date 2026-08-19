package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorBrandRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyVendorBrand QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVendorBrandRepositoryImpl implements QSyVendorBrandRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVendorBrandRepositoryImpl";
    private static final QSyVendorBrand syVendorBrand = QSyVendorBrand.syVendorBrand;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyBrand syBrand = QSyBrand.syBrand;
    private static final QVwSyCode cdVbc = new QVwSyCode("cd_vbc");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * VENDOR_BRAND_CONTRACT  (sy_code 미등록 — 실제 코드값 미확인, 계약유형 구분 코드로만 사용)
     */
    /* 업체별 브랜드 baseSelColumnQuery */
    private JPAQuery<SyVendorBrandDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorBrandDto.Item.class,
                        syVendorBrand.vendorBrandId,               // 업체브랜드ID (PK)
                        syVendorBrand.vendorId,                    // 업체ID (sy_vendor.vendor_id)
                        syVendorBrand.brandId,                     // 브랜드ID (sy_brand.brand_id)
                        syVendorBrand.isMain,                      // 대표 브랜드 여부 Y/N
                        syVendorBrand.contractCd,                  // 계약유형 — VENDOR_BRAND_CONTRACT (sy_code 미등록)
                        syVendorBrand.startDate,                   // 계약 시작일
                        syVendorBrand.endDate,                     // 계약 종료일
                        syVendorBrand.commissionRate,              // 수수료율 (%)
                        syVendorBrand.sortOrd,                     // 정렬순서
                        syVendorBrand.useYn,                       // 사용여부 Y/N
                        syVendorBrand.vendorBrandRemark,           // 비고
                        syVendorBrand.regBy,                       // 등록자
                        syVendorBrand.regDate,                     // 등록일시
                        syVendorBrand.updBy,                       // 수정자
                        syVendorBrand.updDate,                     // 수정일시
                        syVendor.vendorNm.as("vendorNm"),          // 업체명 (조인: sy_vendor)
                        syBrand.brandNm.as("brandNm")              // 브랜드명 (조인: sy_brand)
                ))
                .from(syVendorBrand)
                .innerJoin(syVendor).on(syVendor.vendorId.eq(syVendorBrand.vendorId)) // 업체
                .innerJoin(syBrand).on(syBrand.brandId.eq(syVendorBrand.brandId)) // 브랜드
                .leftJoin(cdVbc).on(cdVbc.codeGrp.eq("CONTRACT_CD").and(cdVbc.codeValue.eq(syVendorBrand.contractCd))) // 계약상태
                ;
    }

    /* 업체별 브랜드 키조회 */
    @Override
    public Optional<SyVendorBrandDto.Item> selectById(String vendorBrandId) {
        SyVendorBrandDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVendorBrand.vendorBrandId.eq(vendorBrandId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 업체별 브랜드 목록조회 */
    @Override
    public List<SyVendorBrandDto.Item> selectList(SyVendorBrandDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVendorBrand.vendorBrandId, search.getVendorBrandId()));
        whereList.add(QdslUtil.strEq(syVendorBrand.brandId, search.getBrandId()));
        whereList.add(QdslUtil.strEq(syVendorBrand.vendorId, search.getVendorId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorBrand.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorBrand.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyVendorBrandDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyVendorBrandDto.Item> list = query.fetch();
        return list;
    }

    /* 업체별 브랜드 페이지조회 */
    @Override
    public BasePage<SyVendorBrandDto.Item> selectPageData(SyVendorBrandDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVendorBrand.vendorBrandId, search.getVendorBrandId()));
        whereList.add(QdslUtil.strEq(syVendorBrand.brandId, search.getBrandId()));
        whereList.add(QdslUtil.strEq(syVendorBrand.vendorId, search.getVendorId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorBrand.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syVendorBrand.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyVendorBrandDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyVendorBrandDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVendorBrand.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyVendorBrandDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("brandId", syVendorBrand.brandId),
            QdslUtil.FieldDef.like("contractCd", syVendorBrand.contractCd),
            QdslUtil.FieldDef.like("isMain", syVendorBrand.isMain),
            QdslUtil.FieldDef.like("useYn", syVendorBrand.useYn),
            QdslUtil.FieldDef.like("vendorBrandId", syVendorBrand.vendorBrandId),
            QdslUtil.FieldDef.like("vendorBrandRemark", syVendorBrand.vendorBrandRemark),
            QdslUtil.FieldDef.like("vendorId", syVendorBrand.vendorId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("vendorBrandId", syVendorBrand.vendorBrandId,
                   "regDate", syVendorBrand.regDate,
                   "sortOrd", syVendorBrand.sortOrd),
        new OrderSpecifier<>(Order.ASC, syVendorBrand.sortOrd),
        new OrderSpecifier<>(Order.ASC, syVendorBrand.regDate),
        new OrderSpecifier<>(Order.ASC, syVendorBrand.vendorBrandId));
    }

    /* 업체별 브랜드 수정 */
    @Override
    public int updateSelective(SyVendorBrand entity) {
        if (entity.getVendorBrandId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVendorBrand);
        boolean hasAny = false;

        if (entity.getVendorId()          != null) { update.set(syVendorBrand.vendorId,          entity.getVendorId());          hasAny = true; }
        if (entity.getBrandId()           != null) { update.set(syVendorBrand.brandId,           entity.getBrandId());           hasAny = true; }
        if (entity.getIsMain()            != null) { update.set(syVendorBrand.isMain,            entity.getIsMain());            hasAny = true; }
        if (entity.getContractCd()        != null) { update.set(syVendorBrand.contractCd,        entity.getContractCd());        hasAny = true; }
        if (entity.getStartDate()         != null) { update.set(syVendorBrand.startDate,         entity.getStartDate());         hasAny = true; }
        if (entity.getEndDate()           != null) { update.set(syVendorBrand.endDate,           entity.getEndDate());           hasAny = true; }
        if (entity.getCommissionRate()    != null) { update.set(syVendorBrand.commissionRate,    entity.getCommissionRate());    hasAny = true; }
        if (entity.getSortOrd()           != null) { update.set(syVendorBrand.sortOrd,           entity.getSortOrd());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(syVendorBrand.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getVendorBrandRemark() != null) { update.set(syVendorBrand.vendorBrandRemark, entity.getVendorBrandRemark()); hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(syVendorBrand.updBy,             entity.getUpdBy());             hasAny = true; }
        update.set(syVendorBrand.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVendorBrand.vendorBrandId.eq(entity.getVendorBrandId())).execute();
        return (int) affected;
    }
}
