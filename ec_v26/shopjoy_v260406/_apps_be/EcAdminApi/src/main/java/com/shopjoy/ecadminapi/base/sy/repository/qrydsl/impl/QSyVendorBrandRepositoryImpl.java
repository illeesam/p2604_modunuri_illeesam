package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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
                baseAndSiteId(search),
                baseAndVendorBrandId(search),
                baseAndBrandId(search),
                baseAndVendorId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 업체별 브랜드 페이지조회 */
    @Override
    public SyVendorBrandDto.PageResponse selectPageData(SyVendorBrandDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndVendorBrandId(search),
                baseAndBrandId(search),
                baseAndVendorId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<SyVendorBrandDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorBrandDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(syVendorBrand.count()).from(syVendorBrand).where(wheres).fetchOne();

        SyVendorBrandDto.PageResponse res = new SyVendorBrandDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 업체별 브랜드 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyVendorBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syVendorBrand.siteId.eq(search.getSiteId()) : null;
    }

    /* vendorBrandId 정확 일치 */
    private BooleanExpression baseAndVendorBrandId(SyVendorBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorBrandId())
                ? syVendorBrand.vendorBrandId.eq(search.getVendorBrandId()) : null;
    }

    /* brandId 정확 일치 */
    private BooleanExpression baseAndBrandId(SyVendorBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getBrandId())
                ? syVendorBrand.brandId.eq(search.getBrandId()) : null;
    }

    /* vendorId 정확 일치 */
    private BooleanExpression baseAndVendorId(SyVendorBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorId())
                ? syVendorBrand.vendorId.eq(search.getVendorId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyVendorBrandDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return syVendorBrand.regDate.goe(start).and(syVendorBrand.regDate.lt(endExcl));
            case "upd_date": return syVendorBrand.updDate.goe(start).and(syVendorBrand.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyVendorBrandDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",brandId,", syVendorBrand.brandId, pattern);
        or = orLike(or, all, types, ",contractCd,", syVendorBrand.contractCd, pattern);
        or = orLike(or, all, types, ",isMain,", syVendorBrand.isMain, pattern);
        or = orLike(or, all, types, ",siteId,", syVendorBrand.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", syVendorBrand.useYn, pattern);
        or = orLike(or, all, types, ",vendorBrandId,", syVendorBrand.vendorBrandId, pattern);
        or = orLike(or, all, types, ",vendorBrandRemark,", syVendorBrand.vendorBrandRemark, pattern);
        or = orLike(or, all, types, ",vendorId,", syVendorBrand.vendorId, pattern);
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
