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
    private static final QSyVendorBrand b = QSyVendorBrand.syVendorBrand;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyVendor vnd = QSyVendor.syVendor;
    private static final QSyBrand brd = QSyBrand.syBrand;
    private static final QSyCode cdVbc = new QSyCode("cd_vbc");

    /* 업체별 브랜드 buildBaseQuery */
    private JPAQuery<SyVendorBrandDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyVendorBrandDto.Item.class,
                        b.vendorBrandId, b.siteId, b.vendorId, b.brandId, b.isMain,
                        b.contractCd, b.startDate, b.endDate, b.commissionRate,
                        b.sortOrd, b.useYn, b.vendorBrandRemark,
                        b.regBy, b.regDate, b.updBy, b.updDate,
                        vnd.vendorNm.as("vendorNm"),
                        brd.brandNm.as("brandNm")
                ))
                .from(b)
                .leftJoin(ste).on(ste.siteId.eq(b.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(b.vendorId))
                .leftJoin(brd).on(brd.brandId.eq(b.brandId))
                .leftJoin(cdVbc).on(cdVbc.codeGrp.eq("VENDOR_BRAND_CONTRACT").and(cdVbc.codeValue.eq(b.contractCd)));
    }

    /* 업체별 브랜드 키조회 */
    @Override
    public Optional<SyVendorBrandDto.Item> selectById(String vendorBrandId) {
        SyVendorBrandDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(b.vendorBrandId.eq(vendorBrandId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 업체별 브랜드 목록조회 */
    @Override
    public List<SyVendorBrandDto.Item> selectList(SyVendorBrandDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyVendorBrandDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteId(search),
                andVendorBrandId(search),
                andBrandId(search),
                andVendorId(search),
                andDateRange(search),
                andSearchValue(search)
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
    public SyVendorBrandDto.PageResponse selectPageList(SyVendorBrandDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyVendorBrandDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andSiteId(search),
                andVendorBrandId(search),
                andBrandId(search),
                andVendorId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyVendorBrandDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(
                andSiteId(search),
                andVendorBrandId(search),
                andBrandId(search),
                andVendorId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        SyVendorBrandDto.PageResponse res = new SyVendorBrandDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 업체별 브랜드 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyVendorBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? b.siteId.eq(search.getSiteId()) : null;
    }

    /* vendorBrandId 정확 일치 */
    private BooleanExpression andVendorBrandId(SyVendorBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorBrandId())
                ? b.vendorBrandId.eq(search.getVendorBrandId()) : null;
    }

    /* brandId 정확 일치 */
    private BooleanExpression andBrandId(SyVendorBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getBrandId())
                ? b.brandId.eq(search.getBrandId()) : null;
    }

    /* vendorId 정확 일치 */
    private BooleanExpression andVendorId(SyVendorBrandDto.Request search) {
        return search != null && StringUtils.hasText(search.getVendorId())
                ? b.vendorId.eq(search.getVendorId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SyVendorBrandDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return b.regDate.goe(start).and(b.regDate.lt(endExcl));
            case "upd_date": return b.updDate.goe(start).and(b.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyVendorBrandDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",brandId,", b.brandId, pattern);
        or = orLike(or, all, types, ",contractCd,", b.contractCd, pattern);
        or = orLike(or, all, types, ",isMain,", b.isMain, pattern);
        or = orLike(or, all, types, ",siteId,", b.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", b.useYn, pattern);
        or = orLike(or, all, types, ",vendorBrandId,", b.vendorBrandId, pattern);
        or = orLike(or, all, types, ",vendorBrandRemark,", b.vendorBrandRemark, pattern);
        or = orLike(or, all, types, ",vendorId,", b.vendorId, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, b.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, b.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, b.vendorBrandId));

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
                    orders.add(new OrderSpecifier(order, b.vendorBrandId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, b.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, b.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, b.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, b.vendorBrandId));
        }
        return orders;
    }

    /* 업체별 브랜드 수정 */
    @Override
    public int updateSelective(SyVendorBrand entity) {
        if (entity.getVendorBrandId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(b.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getVendorId()          != null) { update.set(b.vendorId,          entity.getVendorId());          hasAny = true; }
        if (entity.getBrandId()           != null) { update.set(b.brandId,           entity.getBrandId());           hasAny = true; }
        if (entity.getIsMain()            != null) { update.set(b.isMain,            entity.getIsMain());            hasAny = true; }
        if (entity.getContractCd()        != null) { update.set(b.contractCd,        entity.getContractCd());        hasAny = true; }
        if (entity.getStartDate()         != null) { update.set(b.startDate,         entity.getStartDate());         hasAny = true; }
        if (entity.getEndDate()           != null) { update.set(b.endDate,           entity.getEndDate());           hasAny = true; }
        if (entity.getCommissionRate()    != null) { update.set(b.commissionRate,    entity.getCommissionRate());    hasAny = true; }
        if (entity.getSortOrd()           != null) { update.set(b.sortOrd,           entity.getSortOrd());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(b.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getVendorBrandRemark() != null) { update.set(b.vendorBrandRemark, entity.getVendorBrandRemark()); hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(b.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(b.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(b.vendorBrandId.eq(entity.getVendorBrandId())).execute();
        return (int) affected;
    }
}
