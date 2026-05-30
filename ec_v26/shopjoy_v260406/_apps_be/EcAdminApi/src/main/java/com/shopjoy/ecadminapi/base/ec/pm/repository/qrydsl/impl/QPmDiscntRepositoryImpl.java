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
    private static final QPmDiscnt d = QPmDiscnt.pmDiscnt;

    /* 할인 키조회 */
    @Override
    public Optional<PmDiscntDto.Item> selectById(String discntId) {
        PmDiscntDto.Item dto = baseQuery()
                .where(d.discntId.eq(discntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 할인 목록조회 */
    @Override
    public List<PmDiscntDto.Item> selectList(PmDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntDto.Item> query = baseQuery().where(
                andSiteId(search),
                andDiscntId(search),
                andUseYn(search),
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

    /* 할인 페이지조회 */
    @Override
    public PmDiscntDto.PageResponse selectPageList(PmDiscntDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntDto.Item> query = baseQuery().where(
                andSiteId(search),
                andDiscntId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmDiscntDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(d.count())
                .from(d)
                .where(
                andSiteId(search),
                andDiscntId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PmDiscntDto.PageResponse res = new PmDiscntDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 할인 baseQuery */
    private JPAQuery<PmDiscntDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntDto.Item.class,
                        d.discntId, d.siteId, d.discntNm,
                        d.discntTypeCd, d.discntTargetCd, d.discntValue,
                        d.minOrderAmt, d.minOrderQty, d.maxDiscntAmt,
                        d.startDate, d.endDate,
                        d.discntStatusCd, d.discntStatusCdBefore,
                        d.discntDesc, d.memGradeCd,
                        d.selfCdivRate, d.sellerCdivRate,
                        d.dvcPcYn, d.dvcMwebYn, d.dvcMappYn,
                        d.useYn, d.regBy, d.regDate, d.updBy, d.updDate
                ))
                .from(d);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PmDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? d.siteId.eq(search.getSiteId()) : null;
    }

    /* discntId 정확 일치 */
    private BooleanExpression andDiscntId(PmDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getDiscntId())
                ? d.discntId.eq(search.getDiscntId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(PmDiscntDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? d.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PmDiscntDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return d.regDate.goe(start).and(d.regDate.lt(endExcl));
            case "upd_date": return d.updDate.goe(start).and(d.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PmDiscntDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",discntDesc,", d.discntDesc, pattern);
        or = orLike(or, all, types, ",discntId,", d.discntId, pattern);
        or = orLike(or, all, types, ",discntNm,", d.discntNm, pattern);
        or = orLike(or, all, types, ",discntStatusCd,", d.discntStatusCd, pattern);
        or = orLike(or, all, types, ",discntStatusCdBefore,", d.discntStatusCdBefore, pattern);
        or = orLike(or, all, types, ",discntTargetCd,", d.discntTargetCd, pattern);
        or = orLike(or, all, types, ",discntTypeCd,", d.discntTypeCd, pattern);
        or = orLike(or, all, types, ",dvcMappYn,", d.dvcMappYn, pattern);
        or = orLike(or, all, types, ",dvcMwebYn,", d.dvcMwebYn, pattern);
        or = orLike(or, all, types, ",dvcPcYn,", d.dvcPcYn, pattern);
        or = orLike(or, all, types, ",memGradeCd,", d.memGradeCd, pattern);
        or = orLike(or, all, types, ",siteId,", d.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", d.useYn, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, d.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, d.discntId));
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
                    orders.add(new OrderSpecifier(order, d.discntId));
                } else if ("discntNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.discntNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, d.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, d.discntId));
        }
        return orders;
    }

    /* 할인 수정 */
    @Override
    public int updateSelective(PmDiscnt entity) {
        if (entity.getDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(d);
        boolean hasAny = false;

        if (entity.getSiteId()               != null) { update.set(d.siteId,               entity.getSiteId());               hasAny = true; }
        if (entity.getDiscntNm()             != null) { update.set(d.discntNm,             entity.getDiscntNm());             hasAny = true; }
        if (entity.getDiscntTypeCd()         != null) { update.set(d.discntTypeCd,         entity.getDiscntTypeCd());         hasAny = true; }
        if (entity.getDiscntTargetCd()       != null) { update.set(d.discntTargetCd,       entity.getDiscntTargetCd());       hasAny = true; }
        if (entity.getDiscntValue()          != null) { update.set(d.discntValue,          entity.getDiscntValue());          hasAny = true; }
        if (entity.getMinOrderAmt()          != null) { update.set(d.minOrderAmt,          entity.getMinOrderAmt());          hasAny = true; }
        if (entity.getMinOrderQty()          != null) { update.set(d.minOrderQty,          entity.getMinOrderQty());          hasAny = true; }
        if (entity.getMaxDiscntAmt()         != null) { update.set(d.maxDiscntAmt,         entity.getMaxDiscntAmt());         hasAny = true; }
        if (entity.getStartDate()            != null) { update.set(d.startDate,            entity.getStartDate());            hasAny = true; }
        if (entity.getEndDate()              != null) { update.set(d.endDate,              entity.getEndDate());              hasAny = true; }
        if (entity.getDiscntStatusCd()       != null) { update.set(d.discntStatusCd,       entity.getDiscntStatusCd());       hasAny = true; }
        if (entity.getDiscntStatusCdBefore() != null) { update.set(d.discntStatusCdBefore, entity.getDiscntStatusCdBefore()); hasAny = true; }
        if (entity.getDiscntDesc()           != null) { update.set(d.discntDesc,           entity.getDiscntDesc());           hasAny = true; }
        if (entity.getMemGradeCd()           != null) { update.set(d.memGradeCd,           entity.getMemGradeCd());           hasAny = true; }
        if (entity.getSelfCdivRate()         != null) { update.set(d.selfCdivRate,         entity.getSelfCdivRate());         hasAny = true; }
        if (entity.getSellerCdivRate()       != null) { update.set(d.sellerCdivRate,       entity.getSellerCdivRate());       hasAny = true; }
        if (entity.getDvcPcYn()              != null) { update.set(d.dvcPcYn,              entity.getDvcPcYn());              hasAny = true; }
        if (entity.getDvcMwebYn()            != null) { update.set(d.dvcMwebYn,            entity.getDvcMwebYn());            hasAny = true; }
        if (entity.getDvcMappYn()            != null) { update.set(d.dvcMappYn,            entity.getDvcMappYn());            hasAny = true; }
        if (entity.getUseYn()                != null) { update.set(d.useYn,                entity.getUseYn());                hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(d.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(d.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(d.discntId.eq(entity.getDiscntId())).execute();
        return (int) affected;
    }
}
