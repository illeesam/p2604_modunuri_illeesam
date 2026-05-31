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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdRestockNotiRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdRestockNoti QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdRestockNotiRepositoryImpl implements QPdRestockNotiRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdRestockNotiRepositoryImpl";
    private static final QPdRestockNoti n   = QPdRestockNoti.pdRestockNoti;
    private static final QSySite        ste = QSySite.sySite;
    private static final QPdProd        prd = QPdProd.pdProd;
    private static final QMbMember      mem = QMbMember.mbMember;

    /* 재입고 알림 키조회 */
    @Override
    public Optional<PdRestockNotiDto.Item> selectById(String restockNotiId) {
        PdRestockNotiDto.Item dto = baseQuery()
                .where(n.restockNotiId.eq(restockNotiId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 재입고 알림 목록조회 */
    @Override
    public List<PdRestockNotiDto.Item> selectList(PdRestockNotiDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdRestockNotiDto.Item> query = baseQuery().where(
                andSiteId(search),
                andRestockNotiId(search),
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

    /* 재입고 알림 페이지조회 */
    @Override
    public PdRestockNotiDto.PageResponse selectPageList(PdRestockNotiDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdRestockNotiDto.Item> query = baseQuery().where(
                andSiteId(search),
                andRestockNotiId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdRestockNotiDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(n.count()).from(n).where(
                andSiteId(search),
                andRestockNotiId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        PdRestockNotiDto.PageResponse res = new PdRestockNotiDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 재입고 알림 baseQuery */
    private JPAQuery<PdRestockNotiDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdRestockNotiDto.Item.class,
                        n.restockNotiId, n.siteId, n.prodId, n.skuId, n.memberId,
                        n.notiYn, n.notiDate,
                        n.regBy, n.regDate, n.updBy, n.updDate
                ))
                .from(n)
                .leftJoin(ste).on(ste.siteId.eq(n.siteId))
                .leftJoin(prd).on(prd.prodId.eq(n.prodId))
                .leftJoin(mem).on(mem.memberId.eq(n.memberId));
    }

    /* 재입고 알림 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdRestockNotiDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? n.siteId.eq(search.getSiteId()) : null;
    }

    /* restockNotiId 정확 일치 */
    private BooleanExpression andRestockNotiId(PdRestockNotiDto.Request search) {
        return search != null && StringUtils.hasText(search.getRestockNotiId())
                ? n.restockNotiId.eq(search.getRestockNotiId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdRestockNotiDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return n.regDate.goe(start).and(n.regDate.lt(endExcl));
            case "upd_date": return n.updDate.goe(start).and(n.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdRestockNotiDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",memberId,", n.memberId, pattern);
        or = orLike(or, all, types, ",notiYn,", n.notiYn, pattern);
        or = orLike(or, all, types, ",prodId,", n.prodId, pattern);
        or = orLike(or, all, types, ",restockNotiId,", n.restockNotiId, pattern);
        or = orLike(or, all, types, ",siteId,", n.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", n.skuId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdRestockNotiDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, n.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, n.restockNotiId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("restockNotiId".equals(field)) {
                    orders.add(new OrderSpecifier(order, n.restockNotiId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, n.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, n.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, n.restockNotiId));
        }
        return orders;
    }

    /* 재입고 알림 수정 */
    @Override
    public int updateSelective(PdRestockNoti entity) {
        if (entity.getRestockNotiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(n);
        boolean hasAny = false;

        if (entity.getSiteId()   != null) { update.set(n.siteId,   entity.getSiteId());   hasAny = true; }
        if (entity.getProdId()   != null) { update.set(n.prodId,   entity.getProdId());   hasAny = true; }
        if (entity.getSkuId()    != null) { update.set(n.skuId,    entity.getSkuId());    hasAny = true; }
        if (entity.getMemberId() != null) { update.set(n.memberId, entity.getMemberId()); hasAny = true; }
        if (entity.getNotiYn()   != null) { update.set(n.notiYn,   entity.getNotiYn());   hasAny = true; }
        if (entity.getNotiDate() != null) { update.set(n.notiDate, entity.getNotiDate()); hasAny = true; }
        if (entity.getUpdBy()    != null) { update.set(n.updBy,    entity.getUpdBy());    hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(n.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(n.restockNotiId.eq(entity.getRestockNotiId())).execute();
        return (int) affected;
    }
}
