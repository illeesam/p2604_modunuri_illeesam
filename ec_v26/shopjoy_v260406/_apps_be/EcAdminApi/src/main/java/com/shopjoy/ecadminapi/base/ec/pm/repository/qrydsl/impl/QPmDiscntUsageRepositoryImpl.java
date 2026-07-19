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
    private static final QPmDiscntUsage pmDiscntUsage = QPmDiscntUsage.pmDiscntUsage;

    /* 할인 사용 이력 baseSelColumnQuery */
    private JPAQuery<PmDiscntUsageDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntUsageDto.Item.class,
                        pmDiscntUsage.discntUsageId, pmDiscntUsage.siteId, pmDiscntUsage.discntId, pmDiscntUsage.discntNm,
                        pmDiscntUsage.memberId, pmDiscntUsage.orderId, pmDiscntUsage.orderItemId, pmDiscntUsage.prodId,
                        pmDiscntUsage.discntTypeCd, pmDiscntUsage.discntValue, pmDiscntUsage.discntAmt, pmDiscntUsage.usedDate,
                        pmDiscntUsage.regBy, pmDiscntUsage.regDate
                ))
                .from(pmDiscntUsage);
    }

    /* 할인 사용 이력 키조회 */
    @Override
    public Optional<PmDiscntUsageDto.Item> selectById(String discntUsageId) {
        PmDiscntUsageDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmDiscntUsage.discntUsageId.eq(discntUsageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 할인 사용 이력 목록조회 */
    @Override
    public List<PmDiscntUsageDto.Item> selectList(PmDiscntUsageDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntUsageDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andDiscntUsageIdEq(search),
                    andDateRangeBetween(search),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 할인 사용 이력 페이지조회 */
    @Override
    public PmDiscntUsageDto.PageResponse selectPageData(PmDiscntUsageDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andDiscntUsageIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmDiscntUsageDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmDiscntUsageDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmDiscntUsage.count())
                .where(wheres)
                .fetchOne();

        PmDiscntUsageDto.PageResponse res = new PmDiscntUsageDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(PmDiscntUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmDiscntUsage.siteId.eq(search.getSiteId()) : null;
    }

    /* discntUsageId 정확 일치 */
    private BooleanExpression andDiscntUsageIdEq(PmDiscntUsageDto.Request search) {
        return search != null && StringUtils.hasText(search.getDiscntUsageId())
                ? pmDiscntUsage.discntUsageId.eq(search.getDiscntUsageId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(PmDiscntUsageDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmDiscntUsage.regDate.goe(start).and(pmDiscntUsage.regDate.lt(endExcl));
            case "upd_date": return pmDiscntUsage.updDate.goe(start).and(pmDiscntUsage.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(PmDiscntUsageDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",discntId,", pmDiscntUsage.discntId, pattern);
        or = orLike(or, all, types, ",discntNm,", pmDiscntUsage.discntNm, pattern);
        or = orLike(or, all, types, ",discntTypeCd,", pmDiscntUsage.discntTypeCd, pattern);
        or = orLike(or, all, types, ",discntUsageId,", pmDiscntUsage.discntUsageId, pattern);
        or = orLike(or, all, types, ",memberId,", pmDiscntUsage.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", pmDiscntUsage.orderId, pattern);
        or = orLike(or, all, types, ",orderItemId,", pmDiscntUsage.orderItemId, pattern);
        or = orLike(or, all, types, ",prodId,", pmDiscntUsage.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pmDiscntUsage.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, pmDiscntUsage.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmDiscntUsage.discntUsageId));
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
                    orders.add(new OrderSpecifier(order, pmDiscntUsage.discntUsageId));
                } else if ("discntNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscntUsage.discntNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscntUsage.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmDiscntUsage.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmDiscntUsage.discntUsageId));
        }
        return orders;
    }

    /* 할인 사용 이력 수정 */


    @Override
    public int updateSelective(PmDiscntUsage entity) {
        if (entity.getDiscntUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmDiscntUsage);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(pmDiscntUsage.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getDiscntId()      != null) { update.set(pmDiscntUsage.discntId,      entity.getDiscntId());      hasAny = true; }
        if (entity.getDiscntNm()      != null) { update.set(pmDiscntUsage.discntNm,      entity.getDiscntNm());      hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(pmDiscntUsage.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(pmDiscntUsage.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getOrderItemId()   != null) { update.set(pmDiscntUsage.orderItemId,   entity.getOrderItemId());   hasAny = true; }
        if (entity.getProdId()        != null) { update.set(pmDiscntUsage.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getDiscntTypeCd()  != null) { update.set(pmDiscntUsage.discntTypeCd,  entity.getDiscntTypeCd());  hasAny = true; }
        if (entity.getDiscntValue()   != null) { update.set(pmDiscntUsage.discntValue,   entity.getDiscntValue());   hasAny = true; }
        if (entity.getDiscntAmt()     != null) { update.set(pmDiscntUsage.discntAmt,     entity.getDiscntAmt());     hasAny = true; }
        if (entity.getUsedDate()      != null) { update.set(pmDiscntUsage.usedDate,      entity.getUsedDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmDiscntUsage.discntUsageId.eq(entity.getDiscntUsageId())).execute();
        return (int) affected;
    }
}
