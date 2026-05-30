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
    private static final QStSettle  s   = QStSettle.stSettle;
    private static final QSyVendor  vnd = QSyVendor.syVendor;
    private static final QSySite    ste = QSySite.sySite;
    private static final QSyCode    cdSs = new QSyCode("cd_ss");

    /* 정산 키조회 */
    @Override
    public Optional<StSettleDto.Item> selectById(String id) {
        StSettleDto.Item dto = baseListQuery()
                .where(s.settleId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 목록조회 */
    @Override
    public List<StSettleDto.Item> selectList(StSettleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleId(search),
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

    /* 정산 페이지조회 */
    @Override
    public StSettleDto.PageResponse selectPageList(StSettleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(s.count())
                .from(s)
                .where(
                andSiteId(search),
                andSettleId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        StSettleDto.PageResponse res = new StSettleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 baseListQuery */
    private JPAQuery<StSettleDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleDto.Item.class,
                        s.settleId, s.siteId, s.vendorId, s.settleYm,
                        s.settleStartDate, s.settleEndDate,
                        s.totalOrderAmt, s.totalReturnAmt, s.totalClaimCnt, s.totalDiscntAmt,
                        s.commissionRate, s.commissionAmt, s.settleAmt,
                        s.adjAmt, s.etcAdjAmt, s.finalSettleAmt,
                        s.settleStatusCd, s.settleStatusCdBefore, s.settleMemo,
                        s.regBy, s.regDate, s.updBy, s.updDate,
                        vnd.vendorNm.as("vendorNm"),
                        ste.siteNm.as("siteNm"),
                        cdSs.codeLabel.as("settleStatusCdNm")
                ))
                .from(s)
                .leftJoin(vnd).on(vnd.vendorId.eq(s.vendorId))
                .leftJoin(ste).on(ste.siteId.eq(s.siteId))
                .leftJoin(cdSs).on(cdSs.codeGrp.eq("SETTLE_STATUS").and(cdSs.codeValue.eq(s.settleStatusCd)));
    }

    /* 정산 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(StSettleDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? s.siteId.eq(search.getSiteId()) : null;
    }

    /* settleId 정확 일치 */
    private BooleanExpression andSettleId(StSettleDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleId())
                ? s.settleId.eq(search.getSettleId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(StSettleDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return s.regDate.goe(start).and(s.regDate.lt(endExcl));
            case "upd_date": return s.updDate.goe(start).and(s.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(StSettleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",settleId,", s.settleId, pattern);
        or = orLike(or, all, types, ",settleMemo,", s.settleMemo, pattern);
        or = orLike(or, all, types, ",settleStatusCd,", s.settleStatusCd, pattern);
        or = orLike(or, all, types, ",settleStatusCdBefore,", s.settleStatusCdBefore, pattern);
        or = orLike(or, all, types, ",settleYm,", s.settleYm, pattern);
        or = orLike(or, all, types, ",siteId,", s.siteId, pattern);
        or = orLike(or, all, types, ",vendorId,", s.vendorId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.settleId));
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
                    orders.add(new OrderSpecifier(order, s.settleId));
                } else if ("settleYm".equals(field)) {
                    orders.add(new OrderSpecifier(order, s.settleYm));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, s.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, s.settleId));
        }
        return orders;
    }

    /* 정산 수정 */
    @Override
    public int updateSelective(StSettle entity) {
        if (entity.getSettleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(s);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(s.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getVendorId()             != null) { update.set(s.vendorId,             entity.getVendorId());             hasAny = true; }
        if (entity.getSettleYm()             != null) { update.set(s.settleYm,             entity.getSettleYm());             hasAny = true; }
        if (entity.getSettleStartDate()      != null) { update.set(s.settleStartDate,      entity.getSettleStartDate());      hasAny = true; }
        if (entity.getSettleEndDate()        != null) { update.set(s.settleEndDate,        entity.getSettleEndDate());        hasAny = true; }
        if (entity.getTotalOrderAmt()        != null) { update.set(s.totalOrderAmt,        entity.getTotalOrderAmt());        hasAny = true; }
        if (entity.getTotalReturnAmt()       != null) { update.set(s.totalReturnAmt,       entity.getTotalReturnAmt());       hasAny = true; }
        if (entity.getTotalClaimCnt()        != null) { update.set(s.totalClaimCnt,        entity.getTotalClaimCnt());        hasAny = true; }
        if (entity.getTotalDiscntAmt()       != null) { update.set(s.totalDiscntAmt,       entity.getTotalDiscntAmt());       hasAny = true; }
        if (entity.getCommissionRate()       != null) { update.set(s.commissionRate,       entity.getCommissionRate());       hasAny = true; }
        if (entity.getCommissionAmt()        != null) { update.set(s.commissionAmt,        entity.getCommissionAmt());        hasAny = true; }
        if (entity.getSettleAmt()            != null) { update.set(s.settleAmt,            entity.getSettleAmt());            hasAny = true; }
        if (entity.getAdjAmt()               != null) { update.set(s.adjAmt,               entity.getAdjAmt());               hasAny = true; }
        if (entity.getEtcAdjAmt()            != null) { update.set(s.etcAdjAmt,            entity.getEtcAdjAmt());            hasAny = true; }
        if (entity.getFinalSettleAmt()       != null) { update.set(s.finalSettleAmt,       entity.getFinalSettleAmt());       hasAny = true; }
        if (entity.getSettleStatusCd()       != null) { update.set(s.settleStatusCd,       entity.getSettleStatusCd());       hasAny = true; }
        if (entity.getSettleStatusCdBefore() != null) { update.set(s.settleStatusCdBefore, entity.getSettleStatusCdBefore()); hasAny = true; }
        if (entity.getSettleMemo()           != null) { update.set(s.settleMemo,           entity.getSettleMemo());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(s.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(s.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(s.settleId.eq(entity.getSettleId())).execute();
        return (int) affected;
    }
}
