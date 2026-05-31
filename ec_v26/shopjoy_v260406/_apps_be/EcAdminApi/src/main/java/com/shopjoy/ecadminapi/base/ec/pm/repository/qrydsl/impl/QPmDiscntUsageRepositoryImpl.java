package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmDiscntUsage QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntUsageRepositoryImpl implements QPmDiscntUsageRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmDiscntUsageRepositoryImpl";
    private static final QPmDiscntUsage u = QPmDiscntUsage.pmDiscntUsage;

    /* 할인 사용 이력 키조회 */
    @Override
    public Optional<PmDiscntUsageDto.Item> selectById(String discntUsageId) {
        PmDiscntUsageDto.Item dto = baseQuery()
                .where(u.discntUsageId.eq(discntUsageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 할인 사용 이력 목록조회 */
    @Override
    public List<PmDiscntUsageDto.Item> selectList(PmDiscntUsageDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntUsageDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndDiscntUsageId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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

    /* 할인 사용 이력 페이지조회 */
    @Override
    public PmDiscntUsageDto.PageResponse selectPageList(PmDiscntUsageDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntUsageDto.Item> query = baseQuery().where(
                baseAndSiteId(search),
                baseAndDiscntUsageId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmDiscntUsageDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(u.count())
                .from(u)
                .where(
                baseAndSiteId(search),
                baseAndDiscntUsageId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmDiscntUsageDto.PageResponse res = new PmDiscntUsageDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 할인 사용 이력 baseQuery */
    private JPAQuery<PmDiscntUsageDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntUsageDto.Item.class,
                        u.discntUsageId, u.siteId, u.discntId, u.discntNm,
                        u.memberId, u.orderId, u.orderItemId, u.prodId,
                        u.discntTypeCd, u.discntValue, u.discntAmt, u.usedDate,
                        u.regBy, u.regDate
                ))
                .from(u);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmDiscntUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? u.siteId.eq(search.getSiteId()) : null;
    }

    /* discntUsageId 정확 일치 */
    private BooleanExpression baseAndDiscntUsageId(PmDiscntUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getDiscntUsageId())
                ? u.discntUsageId.eq(search.getDiscntUsageId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmDiscntUsageDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(PmDiscntUsageDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",discntId,", u.discntId, pattern);
        or = orLike(or, all, types, ",discntNm,", u.discntNm, pattern);
        or = orLike(or, all, types, ",discntTypeCd,", u.discntTypeCd, pattern);
        or = orLike(or, all, types, ",discntUsageId,", u.discntUsageId, pattern);
        or = orLike(or, all, types, ",memberId,", u.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", u.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", u.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", u.prodId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmDiscntUsageDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.discntUsageId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("discntUsageId".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.discntUsageId));
                } else if ("discntNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.discntNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, u.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, u.discntUsageId));
        }
        return orders;
    }

    /* 할인 사용 이력 수정 */
    @Override
    public int updateSelective(PmDiscntUsage entity) {
        if (entity.getDiscntUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(u.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getDiscntId()      != null) { update.set(u.discntId,      entity.getDiscntId());      hasAny = true; }
        if (entity.getDiscntNm()      != null) { update.set(u.discntNm,      entity.getDiscntNm());      hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(u.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(u.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getOrderItemId()   != null) { update.set(u.orderItemId,   entity.getOrderItemId());   hasAny = true; }
        if (entity.getProdId()        != null) { update.set(u.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getDiscntTypeCd()  != null) { update.set(u.discntTypeCd,  entity.getDiscntTypeCd());  hasAny = true; }
        if (entity.getDiscntValue()   != null) { update.set(u.discntValue,   entity.getDiscntValue());   hasAny = true; }
        if (entity.getDiscntAmt()     != null) { update.set(u.discntAmt,     entity.getDiscntAmt());     hasAny = true; }
        if (entity.getUsedDate()      != null) { update.set(u.usedDate,      entity.getUsedDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(u.discntUsageId.eq(entity.getDiscntUsageId())).execute();
        return (int) affected;
    }
}
