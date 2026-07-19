package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettle;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleRepository;
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
/** StSettle QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleRepositoryImpl implements QStSettleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleRepositoryImpl";
    private static final QStSettle  stSettle   = QStSettle.stSettle;
    private static final QSyVendor  syVendor = QSyVendor.syVendor;
    private static final QSySite    sySite = QSySite.sySite;
    private static final QSyCode    cdSs = new QSyCode("cd_ss");

    /* 정산 baseListQuery */
    private JPAQuery<StSettleDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleDto.Item.class,
                        stSettle.settleId, stSettle.siteId, stSettle.vendorId, stSettle.settleYm,
                        stSettle.settleStartDate, stSettle.settleEndDate,
                        stSettle.totalOrderAmt, stSettle.totalReturnAmt, stSettle.totalClaimCnt, stSettle.totalDiscntAmt,
                        stSettle.commissionRate, stSettle.commissionAmt, stSettle.settleAmt,
                        stSettle.adjAmt, stSettle.etcAdjAmt, stSettle.finalSettleAmt,
                        stSettle.settleStatusCd, stSettle.settleStatusCdBefore, stSettle.settleMemo,
                        stSettle.regBy, stSettle.regDate, stSettle.updBy, stSettle.updDate,
                        syVendor.vendorNm.as("vendorNm"),
                        sySite.siteNm.as("siteNm"),
                        cdSs.codeLabel.as("settleStatusCdNm")
                ))
                .from(stSettle)
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stSettle.vendorId))
                .leftJoin(sySite).on(sySite.siteId.eq(stSettle.siteId))
                .leftJoin(cdSs).on(cdSs.codeGrp.eq("SETTLE_STATUS").and(cdSs.codeValue.eq(stSettle.settleStatusCd)));
    }

    /* 정산 키조회 */
    @Override
    public Optional<StSettleDto.Item> selectById(String id) {
        StSettleDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettle.settleId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 목록조회 */
    @Override
    public List<StSettleDto.Item> selectList(StSettleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andSettleIdEq(search),
                    andDateRangeBetween(search),
                    andSearchValueLike(search)
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

    /* 정산 페이지조회 */
    @Override
    public StSettleDto.PageResponse selectPageData(StSettleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andSettleIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettle.count())
                .where(wheres)
                .fetchOne();

        StSettleDto.PageResponse res = new StSettleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }



    /* 정산 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(a), andDeptId(a), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(StSettleDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? stSettle.siteId.eq(search.getSiteId()) : null;
    }

    /* settleId 정확 일치 */
    private BooleanExpression andSettleIdEq(StSettleDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleId())
                ? stSettle.settleId.eq(search.getSettleId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(StSettleDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return stSettle.regDate.goe(start).and(stSettle.regDate.lt(endExcl));
            case "upd_date": return stSettle.updDate.goe(start).and(stSettle.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(StSettleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",settleId,", stSettle.settleId, pattern);
        or = orLike(or, all, types, ",settleMemo,", stSettle.settleMemo, pattern);
        or = orLike(or, all, types, ",settleStatusCd,", stSettle.settleStatusCd, pattern);
        or = orLike(or, all, types, ",settleStatusCdBefore,", stSettle.settleStatusCdBefore, pattern);
        or = orLike(or, all, types, ",settleYm,", stSettle.settleYm, pattern);
        or = orLike(or, all, types, ",siteId,", stSettle.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", stSettle.vendorId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StSettleDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettle.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettle.settleId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettle.settleId));
                } else if ("settleYm".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettle.settleYm));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettle.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettle.settleId));
        }
        return orders;
    }

    /* 정산 수정 */
    @Override
    public int updateSelective(StSettle entity) {
        if (entity.getSettleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettle);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(stSettle.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getVendorId()             != null) { update.set(stSettle.vendorId,             entity.getVendorId());             hasAny = true; }
        if (entity.getSettleYm()             != null) { update.set(stSettle.settleYm,             entity.getSettleYm());             hasAny = true; }
        if (entity.getSettleStartDate()      != null) { update.set(stSettle.settleStartDate,      entity.getSettleStartDate());      hasAny = true; }
        if (entity.getSettleEndDate()        != null) { update.set(stSettle.settleEndDate,        entity.getSettleEndDate());        hasAny = true; }
        if (entity.getTotalOrderAmt()        != null) { update.set(stSettle.totalOrderAmt,        entity.getTotalOrderAmt());        hasAny = true; }
        if (entity.getTotalReturnAmt()       != null) { update.set(stSettle.totalReturnAmt,       entity.getTotalReturnAmt());       hasAny = true; }
        if (entity.getTotalClaimCnt()        != null) { update.set(stSettle.totalClaimCnt,        entity.getTotalClaimCnt());        hasAny = true; }
        if (entity.getTotalDiscntAmt()       != null) { update.set(stSettle.totalDiscntAmt,       entity.getTotalDiscntAmt());       hasAny = true; }
        if (entity.getCommissionRate()       != null) { update.set(stSettle.commissionRate,       entity.getCommissionRate());       hasAny = true; }
        if (entity.getCommissionAmt()        != null) { update.set(stSettle.commissionAmt,        entity.getCommissionAmt());        hasAny = true; }
        if (entity.getSettleAmt()            != null) { update.set(stSettle.settleAmt,            entity.getSettleAmt());            hasAny = true; }
        if (entity.getAdjAmt()               != null) { update.set(stSettle.adjAmt,               entity.getAdjAmt());               hasAny = true; }
        if (entity.getEtcAdjAmt()            != null) { update.set(stSettle.etcAdjAmt,            entity.getEtcAdjAmt());            hasAny = true; }
        if (entity.getFinalSettleAmt()       != null) { update.set(stSettle.finalSettleAmt,       entity.getFinalSettleAmt());       hasAny = true; }
        if (entity.getSettleStatusCd()       != null) { update.set(stSettle.settleStatusCd,       entity.getSettleStatusCd());       hasAny = true; }
        if (entity.getSettleStatusCdBefore() != null) { update.set(stSettle.settleStatusCdBefore, entity.getSettleStatusCdBefore()); hasAny = true; }
        if (entity.getSettleMemo()           != null) { update.set(stSettle.settleMemo,           entity.getSettleMemo());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(stSettle.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettle.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettle.settleId.eq(entity.getSettleId())).execute();
        return (int) affected;
    }
}
