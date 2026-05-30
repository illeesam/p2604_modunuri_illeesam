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
    private static final QPdDlivTmplt t      = QPdDlivTmplt.pdDlivTmplt;
    private static final QSySite      ste    = QSySite.sySite;
    private static final QSyVendor    vnd    = QSyVendor.syVendor;
    private static final QSyCode      cdDm   = new QSyCode("cd_dm");
    private static final QSyCode      cdDpt  = new QSyCode("cd_dpt");

    /* 배송 템플릿 키조회 */
    @Override
    public Optional<PdDlivTmpltDto.Item> selectById(String dlivTmpltId) {
        PdDlivTmpltDto.Item dto = baseQuery()
                .where(t.dlivTmpltId.eq(dlivTmpltId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 템플릿 목록조회 */
    @Override
    public List<PdDlivTmpltDto.Item> selectList(PdDlivTmpltDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdDlivTmpltDto.Item> query = baseQuery().where(
                andSiteId(search),
                andDlivTmpltId(search),
                andDateRange(search),
                andSearchValue(search)
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
    public PdDlivTmpltDto.PageResponse selectPageList(PdDlivTmpltDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdDlivTmpltDto.Item> query = baseQuery().where(
                andSiteId(search),
                andDlivTmpltId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdDlivTmpltDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(
                andSiteId(search),
                andDlivTmpltId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        PdDlivTmpltDto.PageResponse res = new PdDlivTmpltDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 배송 템플릿 baseQuery */
    private JPAQuery<PdDlivTmpltDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdDlivTmpltDto.Item.class,
                        t.dlivTmpltId, t.siteId, t.vendorId, t.dlivTmpltNm,
                        t.dlivMethodCd, t.dlivPayTypeCd, t.dlivCourierCd,
                        t.dlivCost, t.freeDlivMinAmt, t.islandExtraCost,
                        t.returnCost, t.exchangeCost, t.returnCourierCd,
                        t.returnAddrZip, t.returnAddr, t.returnAddrDetail, t.returnTelNo,
                        t.baseDlivYn, t.useYn,
                        t.regBy, t.regDate, t.updBy, t.updDate
                ))
                .from(t)
                .leftJoin(ste).on(ste.siteId.eq(t.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(t.vendorId))
                .leftJoin(cdDm).on(cdDm.codeGrp.eq("DLIV_METHOD").and(cdDm.codeValue.eq(t.dlivMethodCd)))
                .leftJoin(cdDpt).on(cdDpt.codeGrp.eq("DLIV_PAY_TYPE").and(cdDpt.codeValue.eq(t.dlivPayTypeCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdDlivTmpltDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? t.siteId.eq(search.getSiteId()) : null;
    }

    /* dlivTmpltId 정확 일치 */
    private BooleanExpression andDlivTmpltId(PdDlivTmpltDto.Request search) {
        return search != null && StringUtils.hasText(search.getDlivTmpltId())
                ? t.dlivTmpltId.eq(search.getDlivTmpltId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdDlivTmpltDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return t.regDate.goe(start).and(t.regDate.lt(endExcl));
            case "upd_date": return t.updDate.goe(start).and(t.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdDlivTmpltDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",baseDlivYn,", t.baseDlivYn, pattern);
        or = orLike(or, all, types, ",dlivCourierCd,", t.dlivCourierCd, pattern);
        or = orLike(or, all, types, ",dlivMethodCd,", t.dlivMethodCd, pattern);
        or = orLike(or, all, types, ",dlivPayTypeCd,", t.dlivPayTypeCd, pattern);
        or = orLike(or, all, types, ",dlivTmpltId,", t.dlivTmpltId, pattern);
        or = orLike(or, all, types, ",dlivTmpltNm,", t.dlivTmpltNm, pattern);
        or = orLike(or, all, types, ",returnAddr,", t.returnAddr, pattern);
        or = orLike(or, all, types, ",returnAddrDetail,", t.returnAddrDetail, pattern);
        or = orLike(or, all, types, ",returnAddrZip,", t.returnAddrZip, pattern);
        or = orLike(or, all, types, ",returnCourierCd,", t.returnCourierCd, pattern);
        or = orLike(or, all, types, ",returnTelNo,", t.returnTelNo, pattern);
        or = orLike(or, all, types, ",siteId,", t.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", t.useYn, pattern);
        or = orLike(or, all, types, ",vendorId,", t.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.dlivTmpltId));
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
                    orders.add(new OrderSpecifier(order, t.dlivTmpltId));
                } else if ("dlivTmpltNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.dlivTmpltNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, t.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, t.dlivTmpltId));
        }
        return orders;
    }

    /* 배송 템플릿 수정 */
    @Override
    public int updateSelective(PdDlivTmplt entity) {
        if (entity.getDlivTmpltId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(t.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(t.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getDlivTmpltNm()      != null) { update.set(t.dlivTmpltNm,      entity.getDlivTmpltNm());      hasAny = true; }
        if (entity.getDlivMethodCd()     != null) { update.set(t.dlivMethodCd,     entity.getDlivMethodCd());     hasAny = true; }
        if (entity.getDlivPayTypeCd()    != null) { update.set(t.dlivPayTypeCd,    entity.getDlivPayTypeCd());    hasAny = true; }
        if (entity.getDlivCourierCd()    != null) { update.set(t.dlivCourierCd,    entity.getDlivCourierCd());    hasAny = true; }
        if (entity.getDlivCost()         != null) { update.set(t.dlivCost,         entity.getDlivCost());         hasAny = true; }
        if (entity.getFreeDlivMinAmt()   != null) { update.set(t.freeDlivMinAmt,   entity.getFreeDlivMinAmt());   hasAny = true; }
        if (entity.getIslandExtraCost()  != null) { update.set(t.islandExtraCost,  entity.getIslandExtraCost());  hasAny = true; }
        if (entity.getReturnCost()       != null) { update.set(t.returnCost,       entity.getReturnCost());       hasAny = true; }
        if (entity.getExchangeCost()     != null) { update.set(t.exchangeCost,     entity.getExchangeCost());     hasAny = true; }
        if (entity.getReturnCourierCd()  != null) { update.set(t.returnCourierCd,  entity.getReturnCourierCd());  hasAny = true; }
        if (entity.getReturnAddrZip()    != null) { update.set(t.returnAddrZip,    entity.getReturnAddrZip());    hasAny = true; }
        if (entity.getReturnAddr()       != null) { update.set(t.returnAddr,       entity.getReturnAddr());       hasAny = true; }
        if (entity.getReturnAddrDetail() != null) { update.set(t.returnAddrDetail, entity.getReturnAddrDetail()); hasAny = true; }
        if (entity.getReturnTelNo()      != null) { update.set(t.returnTelNo,      entity.getReturnTelNo());      hasAny = true; }
        if (entity.getBaseDlivYn()       != null) { update.set(t.baseDlivYn,       entity.getBaseDlivYn());       hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(t.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(t.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(t.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(t.dlivTmpltId.eq(entity.getDlivTmpltId())).execute();
        return (int) affected;
    }
}
