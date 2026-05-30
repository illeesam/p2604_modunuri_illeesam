package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrderItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveUsageRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmSaveUsage QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveUsageRepositoryImpl implements QPmSaveUsageRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmSaveUsage u    = QPmSaveUsage.pmSaveUsage;
    private static final QSySite      ste  = QSySite.sySite;
    private static final QMbMember    mem  = QMbMember.mbMember;
    private static final QOdOrder     ord  = QOdOrder.odOrder;
    private static final QOdOrderItem ite  = QOdOrderItem.odOrderItem;
    private static final QPdProd      prd  = QPdProd.pdProd;

    /* 적립금 사용 이력 baseQuery */
    private JPAQuery<PmSaveUsageDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveUsageDto.Item.class,
                        u.saveUsageId, u.siteId, u.memberId, u.orderId, u.orderItemId, u.prodId,
                        u.useAmt, u.balanceAmt, u.usedDate, u.regBy, u.regDate
                ))
                .from(u)
                .leftJoin(ste).on(ste.siteId.eq(u.siteId))
                .leftJoin(mem).on(mem.memberId.eq(u.memberId))
                .leftJoin(ord).on(ord.orderId.eq(u.orderId))
                .leftJoin(ite).on(ite.orderItemId.eq(u.orderItemId))
                .leftJoin(prd).on(prd.prodId.eq(u.prodId));
    }

    /* 적립금 사용 이력 키조회 */
    @Override
    public Optional<PmSaveUsageDto.Item> selectById(String saveUsageId) {
        PmSaveUsageDto.Item dto = baseQuery()
                .where(u.saveUsageId.eq(saveUsageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 적립금 사용 이력 목록조회 */
    @Override
    public List<PmSaveUsageDto.Item> selectList(PmSaveUsageDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveUsageDto.Item> query = baseQuery().where(
                andSiteId(search),
                andSaveUsageId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 적립금 사용 이력 페이지조회 */
    @Override
    public PmSaveUsageDto.PageResponse selectPageList(PmSaveUsageDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveUsageDto.Item> query = baseQuery().where(
                andSiteId(search),
                andSaveUsageId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmSaveUsageDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(u.count())
                .from(u)
                .where(
                andSiteId(search),
                andSaveUsageId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PmSaveUsageDto.PageResponse res = new PmSaveUsageDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 적립금 사용 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PmSaveUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? u.siteId.eq(search.getSiteId()) : null;
    }

    /* saveUsageId 정확 일치 */
    private BooleanExpression andSaveUsageId(PmSaveUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getSaveUsageId())
                ? u.saveUsageId.eq(search.getSaveUsageId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PmSaveUsageDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return u.regDate.goe(start).and(u.regDate.lt(endExcl));
            case "upd_date": return u.updDate.goe(start).and(u.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PmSaveUsageDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",memberId,", u.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", u.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", u.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", u.prodId, pattern);
        or = orLike(or, all, types, ",saveUsageId,", u.saveUsageId, pattern);
        or = orLike(or, all, types, ",siteId,", u.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmSaveUsageDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.saveUsageId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("saveUsageId".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.saveUsageId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.saveUsageId));
        }
        return orders;
    }

    /* 적립금 사용 이력 수정 */
    @Override
    public int updateSelective(PmSaveUsage entity) {
        if (entity.getSaveUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(u.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getMemberId()    != null) { update.set(u.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getOrderId()     != null) { update.set(u.orderId,     entity.getOrderId());     hasAny = true; }
        if (entity.getOrderItemId() != null) { update.set(u.orderItemId, entity.getOrderItemId()); hasAny = true; }
        if (entity.getProdId()      != null) { update.set(u.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getUseAmt()      != null) { update.set(u.useAmt,      entity.getUseAmt());      hasAny = true; }
        if (entity.getBalanceAmt()  != null) { update.set(u.balanceAmt,  entity.getBalanceAmt());  hasAny = true; }
        if (entity.getUsedDate()    != null) { update.set(u.usedDate,    entity.getUsedDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(u.saveUsageId.eq(entity.getSaveUsageId())).execute();
        return (int) affected;
    }
}
