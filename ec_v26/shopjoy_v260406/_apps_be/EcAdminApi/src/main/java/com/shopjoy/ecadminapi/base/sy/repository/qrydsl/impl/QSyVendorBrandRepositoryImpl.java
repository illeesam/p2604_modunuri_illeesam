package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVendorBrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QSySite sySite = QSySite.sySite;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyBrand syBrand = QSyBrand.syBrand;
    private static final QSyCode cdVbc = new QSyCode("cd_vbc");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syVendorBrand.regDate,
        "upd_date", syVendorBrand.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("brandId", syVendorBrand.brandId),
        Map.entry("contractCd", syVendorBrand.contractCd),
        Map.entry("isMain", syVendorBrand.isMain),
        Map.entry("siteId", syVendorBrand.siteId),
        Map.entry("useYn", syVendorBrand.useYn),
        Map.entry("vendorBrandId", syVendorBrand.vendorBrandId),
        Map.entry("vendorBrandRemark", syVendorBrand.vendorBrandRemark),
        Map.entry("vendorId", syVendorBrand.vendorId)
    );

    /* 업체별 브랜드 baseSelColumnQuery */
    private JPAQuery<SyVendorBrandDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorBrandDto.Item.class,
                        syVendorBrand.vendorBrandId, syVendorBrand.siteId, syVendorBrand.vendorId, syVendorBrand.brandId, syVendorBrand.isMain,
                        syVendorBrand.contractCd, syVendorBrand.startDate, syVendorBrand.endDate, syVendorBrand.commissionRate,
                        syVendorBrand.sortOrd, syVendorBrand.useYn, syVendorBrand.vendorBrandRemark,
                        syVendorBrand.regBy, syVendorBrand.regDate, syVendorBrand.updBy, syVendorBrand.updDate,
                        syVendor.vendorNm.as("vendorNm"),
                        syBrand.brandNm.as("brandNm")
                ))
                .from(syVendorBrand)
                .leftJoin(sySite).on(sySite.siteId.eq(syVendorBrand.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(syVendorBrand.vendorId))
                .leftJoin(syBrand).on(syBrand.brandId.eq(syVendorBrand.brandId))
                .leftJoin(cdVbc).on(cdVbc.codeGrp.eq("VENDOR_BRAND_CONTRACT").and(cdVbc.codeValue.eq(syVendorBrand.contractCd)));
    }

    /* 업체별 브랜드 키조회 */
    @Override
    public Optional<SyVendorBrandDto.Item> selectById(String vendorBrandId) {
        SyVendorBrandDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVendorBrand.vendorBrandId.eq(vendorBrandId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체별 브랜드 목록조회 */
    @Override
    public List<SyVendorBrandDto.Item> selectList(SyVendorBrandDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorBrandDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syVendorBrand.siteId, search.getSiteId()),
                QdslUtil.strEq(syVendorBrand.vendorBrandId, search.getVendorBrandId()),
                QdslUtil.strEq(syVendorBrand.brandId, search.getBrandId()),
                QdslUtil.strEq(syVendorBrand.vendorId, search.getVendorId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 업체별 브랜드 페이지조회 */
    @Override
    public SyVendorBrandDto.PageResponse selectPageData(SyVendorBrandDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syVendorBrand.siteId, search.getSiteId()),
                QdslUtil.strEq(syVendorBrand.vendorBrandId, search.getVendorBrandId()),
                QdslUtil.strEq(syVendorBrand.brandId, search.getBrandId()),
                QdslUtil.strEq(syVendorBrand.vendorId, search.getVendorId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyVendorBrandDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyVendorBrandDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVendorBrand.count())
                .where(wheres)
                .fetchOne();

        SyVendorBrandDto.PageResponse res = new SyVendorBrandDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 업체별 브랜드 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(SyVendorBrandDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyVendorBrandDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorBrand.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorBrand.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorBrand.vendorBrandId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("vendorBrandId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syVendorBrand.vendorBrandId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syVendorBrand.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syVendorBrand.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorBrand.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorBrand.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syVendorBrand.vendorBrandId));
        }
        return orders;
    }

    /* 업체별 브랜드 수정 */
    @Override
    public int updateSelective(SyVendorBrand entity) {
        if (entity.getVendorBrandId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVendorBrand);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(syVendorBrand.siteId,            entity.getSiteId());            hasAny = true; }
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syVendorBrand.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVendorBrand.vendorBrandId.eq(entity.getVendorBrandId())).execute();
        return (int) affected;
    }
}
