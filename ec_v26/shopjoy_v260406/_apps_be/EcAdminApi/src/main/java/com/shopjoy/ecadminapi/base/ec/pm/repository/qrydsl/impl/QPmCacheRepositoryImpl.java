package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCache;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCacheRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmCache QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCacheRepositoryImpl implements QPmCacheRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCacheRepositoryImpl";
    private static final QPmCache a    = QPmCache.pmCache;
    private static final QSySite  ste  = QSySite.sySite;
    private static final QSyCode  cdCt = new QSyCode("cd_ct");

    /* 캐시(충전금) baseSelColumnQuery */
    private JPAQuery<PmCacheDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCacheDto.Item.class,
                        a.cacheId, a.siteId, a.memberId, a.memberNm,
                        a.cacheTypeCd, a.cacheAmt, a.balanceAmt,
                        a.refId, a.cacheDesc, a.procUserId,
                        a.cacheDate, a.expireDate,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CACHE_TYPE").and(cdCt.codeValue.eq(a.cacheTypeCd)));
    }

    /* 캐시(충전금) 키조회 */
    @Override
    public Optional<PmCacheDto.Item> selectById(String cacheId) {
        PmCacheDto.Item dto = baseSelColumnQuery()
                .where(a.cacheId.eq(cacheId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 캐시(충전금) 목록조회 */
    @Override
    public List<PmCacheDto.Item> selectList(PmCacheDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCacheDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndCacheId(search),
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

    /* 캐시(충전금) 페이지조회 */
    @Override
    public PmCacheDto.PageResponse selectPageData(PmCacheDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCacheDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndCacheId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmCacheDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndCacheId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PmCacheDto.PageResponse res = new PmCacheDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmCacheDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* cacheId 정확 일치 */
    private BooleanExpression baseAndCacheId(PmCacheDto.Request search) {
        return search != null && StringUtils.hasText(search.getCacheId())
                ? a.cacheId.eq(search.getCacheId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmCacheDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmCacheDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",cacheDesc,", a.cacheDesc, pattern);
        or = orLike(or, all, types, ",cacheId,", a.cacheId, pattern);
        or = orLike(or, all, types, ",cacheTypeCd,", a.cacheTypeCd, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", a.memberNm, pattern);
        or = orLike(or, all, types, ",procUserId,", a.procUserId, pattern);
        or = orLike(or, all, types, ",refId,", a.refId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmCacheDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.cacheId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("cacheId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.cacheId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.cacheId));
        }
        return orders;
    }

    /* 캐시(충전금) 수정 */


    @Override
    public int updateSelective(PmCache entity) {
        if (entity.getCacheId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(a.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getMemberId()    != null) { update.set(a.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getMemberNm()    != null) { update.set(a.memberNm,    entity.getMemberNm());    hasAny = true; }
        if (entity.getCacheTypeCd() != null) { update.set(a.cacheTypeCd, entity.getCacheTypeCd()); hasAny = true; }
        if (entity.getCacheAmt()    != null) { update.set(a.cacheAmt,    entity.getCacheAmt());    hasAny = true; }
        if (entity.getBalanceAmt()  != null) { update.set(a.balanceAmt,  entity.getBalanceAmt());  hasAny = true; }
        if (entity.getRefId()       != null) { update.set(a.refId,       entity.getRefId());       hasAny = true; }
        if (entity.getCacheDesc()   != null) { update.set(a.cacheDesc,   entity.getCacheDesc());   hasAny = true; }
        if (entity.getProcUserId()  != null) { update.set(a.procUserId,  entity.getProcUserId());  hasAny = true; }
        if (entity.getCacheDate()   != null) { update.set(a.cacheDate,   entity.getCacheDate());   hasAny = true; }
        if (entity.getExpireDate()  != null) { update.set(a.expireDate,  entity.getExpireDate());  hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(a.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.cacheId.eq(entity.getCacheId())).execute();
        return (int) affected;
    }
}
