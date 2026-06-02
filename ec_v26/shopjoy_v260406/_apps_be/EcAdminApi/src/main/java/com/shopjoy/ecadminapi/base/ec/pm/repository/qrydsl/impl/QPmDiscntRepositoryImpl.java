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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmDiscnt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntRepositoryImpl implements QPmDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmDiscntRepositoryImpl";
    private static final QPmDiscnt pmDiscnt = QPmDiscnt.pmDiscnt;

    /* 할인 baseSelColumnQuery */
    private JPAQuery<PmDiscntDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntDto.Item.class,
                        pmDiscnt.discntId, pmDiscnt.siteId, pmDiscnt.discntNm,
                        pmDiscnt.discntTypeCd, pmDiscnt.discntTargetCd, pmDiscnt.discntValue,
                        pmDiscnt.minOrderAmt, pmDiscnt.minOrderQty, pmDiscnt.maxDiscntAmt,
                        pmDiscnt.startDate, pmDiscnt.endDate,
                        pmDiscnt.discntStatusCd, pmDiscnt.discntStatusCdBefore,
                        pmDiscnt.discntDesc, pmDiscnt.memGradeCd,
                        pmDiscnt.selfCdivRate, pmDiscnt.sellerCdivRate,
                        pmDiscnt.dvcPcYn, pmDiscnt.dvcMwebYn, pmDiscnt.dvcMappYn,
                        pmDiscnt.useYn, pmDiscnt.regBy, pmDiscnt.regDate, pmDiscnt.updBy, pmDiscnt.updDate
                ))
                .from(pmDiscnt);
    }

    /* 할인 키조회 */
    @Override
    public Optional<PmDiscntDto.Item> selectById(String discntId) {
        PmDiscntDto.Item dto = baseSelColumnQuery()
                .where(pmDiscnt.discntId.eq(discntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 할인 목록조회 */
    @Override
    public List<PmDiscntDto.Item> selectList(PmDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndDiscntId(search),
                baseAndUseYn(search),
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

    /* 할인 페이지조회 */
    @Override
    public PmDiscntDto.PageResponse selectPageData(PmDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndDiscntId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PmDiscntDto.Item> query = baseSelColumnQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmDiscntDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pmDiscnt.count())
                .from(pmDiscnt)
                .where(wheres)
                .fetchOne();

        PmDiscntDto.PageResponse res = new PmDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmDiscnt.siteId.eq(search.getSiteId()) : null;
    }

    /* discntId 정확 일치 */
    private BooleanExpression baseAndDiscntId(PmDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getDiscntId())
                ? pmDiscnt.discntId.eq(search.getDiscntId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(PmDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? pmDiscnt.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmDiscntDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmDiscnt.regDate.goe(start).and(pmDiscnt.regDate.lt(endExcl));
            case "upd_date": return pmDiscnt.updDate.goe(start).and(pmDiscnt.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmDiscntDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",discntDesc,", pmDiscnt.discntDesc, pattern);
        or = orLike(or, all, types, ",discntId,", pmDiscnt.discntId, pattern);
        or = orLike(or, all, types, ",discntNm,", pmDiscnt.discntNm, pattern);
        or = orLike(or, all, types, ",discntStatusCd,", pmDiscnt.discntStatusCd, pattern);
        or = orLike(or, all, types, ",discntStatusCdBefore,", pmDiscnt.discntStatusCdBefore, pattern);
        or = orLike(or, all, types, ",discntTargetCd,", pmDiscnt.discntTargetCd, pattern);
        or = orLike(or, all, types, ",discntTypeCd,", pmDiscnt.discntTypeCd, pattern);
        or = orLike(or, all, types, ",dvcMappYn,", pmDiscnt.dvcMappYn, pattern);
        or = orLike(or, all, types, ",dvcMwebYn,", pmDiscnt.dvcMwebYn, pattern);
        or = orLike(or, all, types, ",dvcPcYn,", pmDiscnt.dvcPcYn, pattern);
        or = orLike(or, all, types, ",memGradeCd,", pmDiscnt.memGradeCd, pattern);
        or = orLike(or, all, types, ",siteId,", pmDiscnt.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", pmDiscnt.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmDiscntDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmDiscnt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmDiscnt.discntId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("discntId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscnt.discntId));
                } else if ("discntNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscnt.discntNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmDiscnt.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmDiscnt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmDiscnt.discntId));
        }
        return orders;
    }

    /* 할인 수정 */


    @Override
    public int updateSelective(PmDiscnt entity) {
        if (entity.getDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmDiscnt);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(pmDiscnt.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getDiscntNm()             != null) { update.set(pmDiscnt.discntNm,             entity.getDiscntNm());             hasAny = true; }
        if (entity.getDiscntTypeCd()         != null) { update.set(pmDiscnt.discntTypeCd,         entity.getDiscntTypeCd());         hasAny = true; }
        if (entity.getDiscntTargetCd()       != null) { update.set(pmDiscnt.discntTargetCd,       entity.getDiscntTargetCd());       hasAny = true; }
        if (entity.getDiscntValue()          != null) { update.set(pmDiscnt.discntValue,          entity.getDiscntValue());          hasAny = true; }
        if (entity.getMinOrderAmt()          != null) { update.set(pmDiscnt.minOrderAmt,          entity.getMinOrderAmt());          hasAny = true; }
        if (entity.getMinOrderQty()          != null) { update.set(pmDiscnt.minOrderQty,          entity.getMinOrderQty());          hasAny = true; }
        if (entity.getMaxDiscntAmt()         != null) { update.set(pmDiscnt.maxDiscntAmt,         entity.getMaxDiscntAmt());         hasAny = true; }
        if (entity.getStartDate()            != null) { update.set(pmDiscnt.startDate,            entity.getStartDate());            hasAny = true; }
        if (entity.getEndDate()              != null) { update.set(pmDiscnt.endDate,              entity.getEndDate());              hasAny = true; }
        if (entity.getDiscntStatusCd()       != null) { update.set(pmDiscnt.discntStatusCd,       entity.getDiscntStatusCd());       hasAny = true; }
        if (entity.getDiscntStatusCdBefore() != null) { update.set(pmDiscnt.discntStatusCdBefore, entity.getDiscntStatusCdBefore()); hasAny = true; }
        if (entity.getDiscntDesc()           != null) { update.set(pmDiscnt.discntDesc,           entity.getDiscntDesc());           hasAny = true; }
        if (entity.getMemGradeCd()           != null) { update.set(pmDiscnt.memGradeCd,           entity.getMemGradeCd());           hasAny = true; }
        if (entity.getSelfCdivRate()         != null) { update.set(pmDiscnt.selfCdivRate,         entity.getSelfCdivRate());         hasAny = true; }
        if (entity.getSellerCdivRate()       != null) { update.set(pmDiscnt.sellerCdivRate,       entity.getSellerCdivRate());       hasAny = true; }
        if (entity.getDvcPcYn()              != null) { update.set(pmDiscnt.dvcPcYn,              entity.getDvcPcYn());              hasAny = true; }
        if (entity.getDvcMwebYn()            != null) { update.set(pmDiscnt.dvcMwebYn,            entity.getDvcMwebYn());            hasAny = true; }
        if (entity.getDvcMappYn()            != null) { update.set(pmDiscnt.dvcMappYn,            entity.getDvcMappYn());            hasAny = true; }
        if (entity.getUseYn()                != null) { update.set(pmDiscnt.useYn,                entity.getUseYn());                hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(pmDiscnt.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmDiscnt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmDiscnt.discntId.eq(entity.getDiscntId())).execute();
        return (int) affected;
    }
}
