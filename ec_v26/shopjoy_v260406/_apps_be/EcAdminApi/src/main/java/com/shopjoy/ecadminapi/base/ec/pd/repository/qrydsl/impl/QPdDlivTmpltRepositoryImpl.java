package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdDlivTmpltRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdDlivTmplt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdDlivTmpltRepositoryImpl implements QPdDlivTmpltRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdDlivTmpltRepositoryImpl";
    private static final QPdDlivTmplt pdDlivTmplt      = QPdDlivTmplt.pdDlivTmplt;
    private static final QSySite      sySite    = QSySite.sySite;
    private static final QSyVendor    syVendor    = QSyVendor.syVendor;
    private static final QSyCode      cdDm   = new QSyCode("cd_dm");
    private static final QSyCode      cdDpt  = new QSyCode("cd_dpt");

    /* 배송 템플릿 baseSelColumnQuery */
    private JPAQuery<PdDlivTmpltDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdDlivTmpltDto.Item.class,
                        pdDlivTmplt.dlivTmpltId, pdDlivTmplt.siteId, pdDlivTmplt.vendorId, pdDlivTmplt.dlivTmpltNm,
                        pdDlivTmplt.dlivMethodCd, pdDlivTmplt.dlivPayTypeCd, pdDlivTmplt.dlivCourierCd,
                        pdDlivTmplt.dlivCost, pdDlivTmplt.freeDlivMinAmt, pdDlivTmplt.islandExtraCost,
                        pdDlivTmplt.returnCost, pdDlivTmplt.exchangeCost, pdDlivTmplt.returnCourierCd,
                        pdDlivTmplt.returnAddrZip, pdDlivTmplt.returnAddr, pdDlivTmplt.returnAddrDetail, pdDlivTmplt.returnTelNo,
                        pdDlivTmplt.baseDlivYn, pdDlivTmplt.useYn,
                        pdDlivTmplt.regBy, pdDlivTmplt.regDate, pdDlivTmplt.updBy, pdDlivTmplt.updDate
                ))
                .from(pdDlivTmplt)
                .leftJoin(sySite).on(sySite.siteId.eq(pdDlivTmplt.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pdDlivTmplt.vendorId))
                .leftJoin(cdDm).on(cdDm.codeGrp.eq("DLIV_METHOD").and(cdDm.codeValue.eq(pdDlivTmplt.dlivMethodCd)))
                .leftJoin(cdDpt).on(cdDpt.codeGrp.eq("DLIV_PAY_TYPE").and(cdDpt.codeValue.eq(pdDlivTmplt.dlivPayTypeCd)));
    }

    /* 배송 템플릿 키조회 */
    @Override
    public Optional<PdDlivTmpltDto.Item> selectById(String dlivTmpltId) {
        PdDlivTmpltDto.Item dto = baseSelColumnQuery()
                .where(pdDlivTmplt.dlivTmpltId.eq(dlivTmpltId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 템플릿 목록조회 */
    @Override
    public List<PdDlivTmpltDto.Item> selectList(PdDlivTmpltDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdDlivTmpltDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndDlivTmpltId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 배송 템플릿 페이지조회 */
    @Override
    public PdDlivTmpltDto.PageResponse selectPageData(PdDlivTmpltDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndDlivTmpltId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PdDlivTmpltDto.Item> query = baseSelColumnQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdDlivTmpltDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(pdDlivTmplt.count()).from(pdDlivTmplt).where(wheres).fetchOne();

        PdDlivTmpltDto.PageResponse res = new PdDlivTmpltDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdDlivTmpltDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdDlivTmplt.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivTmpltId 정확 일치 */
    private BooleanExpression baseAndDlivTmpltId(PdDlivTmpltDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivTmpltId())
                ? pdDlivTmplt.dlivTmpltId.eq(search.getDlivTmpltId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdDlivTmpltDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdDlivTmplt.regDate.goe(start).and(pdDlivTmplt.regDate.lt(endExcl));
            case "upd_date": return pdDlivTmplt.updDate.goe(start).and(pdDlivTmplt.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdDlivTmpltDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",baseDlivYn,", pdDlivTmplt.baseDlivYn, pattern);
        or = orLike(or, all, types, ",dlivCourierCd,", pdDlivTmplt.dlivCourierCd, pattern);
        or = orLike(or, all, types, ",dlivMethodCd,", pdDlivTmplt.dlivMethodCd, pattern);
        or = orLike(or, all, types, ",dlivPayTypeCd,", pdDlivTmplt.dlivPayTypeCd, pattern);
        or = orLike(or, all, types, ",dlivTmpltId,", pdDlivTmplt.dlivTmpltId, pattern);
        or = orLike(or, all, types, ",dlivTmpltNm,", pdDlivTmplt.dlivTmpltNm, pattern);
        or = orLike(or, all, types, ",returnAddr,", pdDlivTmplt.returnAddr, pattern);
        or = orLike(or, all, types, ",returnAddrDetail,", pdDlivTmplt.returnAddrDetail, pattern);
        or = orLike(or, all, types, ",returnAddrZip,", pdDlivTmplt.returnAddrZip, pattern);
        or = orLike(or, all, types, ",returnCourierCd,", pdDlivTmplt.returnCourierCd, pattern);
        or = orLike(or, all, types, ",returnTelNo,", pdDlivTmplt.returnTelNo, pattern);
        or = orLike(or, all, types, ",siteId,", pdDlivTmplt.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", pdDlivTmplt.useYn, pattern);
        or = orLike(or, all, types, ",vendorId,", pdDlivTmplt.vendorId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdDlivTmpltDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdDlivTmplt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdDlivTmplt.dlivTmpltId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivTmpltId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdDlivTmplt.dlivTmpltId));
                } else if ("dlivTmpltNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdDlivTmplt.dlivTmpltNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdDlivTmplt.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdDlivTmplt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdDlivTmplt.dlivTmpltId));
        }
        return orders;
    }

    /* 배송 템플릿 수정 */


    @Override
    public int updateSelective(PdDlivTmplt entity) {
        if (entity.getDlivTmpltId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdDlivTmplt);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(pdDlivTmplt.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(pdDlivTmplt.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getDlivTmpltNm()      != null) { update.set(pdDlivTmplt.dlivTmpltNm,      entity.getDlivTmpltNm());      hasAny = true; }
        if (entity.getDlivMethodCd()     != null) { update.set(pdDlivTmplt.dlivMethodCd,     entity.getDlivMethodCd());     hasAny = true; }
        if (entity.getDlivPayTypeCd()    != null) { update.set(pdDlivTmplt.dlivPayTypeCd,    entity.getDlivPayTypeCd());    hasAny = true; }
        if (entity.getDlivCourierCd()    != null) { update.set(pdDlivTmplt.dlivCourierCd,    entity.getDlivCourierCd());    hasAny = true; }
        if (entity.getDlivCost()         != null) { update.set(pdDlivTmplt.dlivCost,         entity.getDlivCost());         hasAny = true; }
        if (entity.getFreeDlivMinAmt()   != null) { update.set(pdDlivTmplt.freeDlivMinAmt,   entity.getFreeDlivMinAmt());   hasAny = true; }
        if (entity.getIslandExtraCost()  != null) { update.set(pdDlivTmplt.islandExtraCost,  entity.getIslandExtraCost());  hasAny = true; }
        if (entity.getReturnCost()       != null) { update.set(pdDlivTmplt.returnCost,       entity.getReturnCost());       hasAny = true; }
        if (entity.getExchangeCost()     != null) { update.set(pdDlivTmplt.exchangeCost,     entity.getExchangeCost());     hasAny = true; }
        if (entity.getReturnCourierCd()  != null) { update.set(pdDlivTmplt.returnCourierCd,  entity.getReturnCourierCd());  hasAny = true; }
        if (entity.getReturnAddrZip()    != null) { update.set(pdDlivTmplt.returnAddrZip,    entity.getReturnAddrZip());    hasAny = true; }
        if (entity.getReturnAddr()       != null) { update.set(pdDlivTmplt.returnAddr,       entity.getReturnAddr());       hasAny = true; }
        if (entity.getReturnAddrDetail() != null) { update.set(pdDlivTmplt.returnAddrDetail, entity.getReturnAddrDetail()); hasAny = true; }
        if (entity.getReturnTelNo()      != null) { update.set(pdDlivTmplt.returnTelNo,      entity.getReturnTelNo());      hasAny = true; }
        if (entity.getBaseDlivYn()       != null) { update.set(pdDlivTmplt.baseDlivYn,       entity.getBaseDlivYn());       hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(pdDlivTmplt.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(pdDlivTmplt.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdDlivTmplt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdDlivTmplt.dlivTmpltId.eq(entity.getDlivTmpltId())).execute();
        return (int) affected;
    }
}
