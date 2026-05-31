package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftCondRepository;
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
/** PmGiftCond QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftCondRepositoryImpl implements QPmGiftCondRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmGiftCondRepositoryImpl";
    private static final QPmGiftCond c    = QPmGiftCond.pmGiftCond;
    private static final QPmGift     gif  = QPmGift.pmGift;
    private static final QSySite     ste  = QSySite.sySite;
    private static final QSyCode     cdGct = new QSyCode("cd_gct");

    /* 사은품 지급 조건 baseQuery */
    private JPAQuery<PmGiftCondDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftCondDto.Item.class,
                        c.giftCondId, c.giftId, c.siteId, c.condTypeCd,
                        c.minOrderAmt, c.targetTypeCd, c.targetId,
                        c.regBy, c.regDate
                ))
                .from(c)
                .leftJoin(gif).on(gif.giftId.eq(c.giftId))
                .leftJoin(ste).on(ste.siteId.eq(c.siteId))
                .leftJoin(cdGct).on(cdGct.codeGrp.eq("GIFT_COND_TYPE").and(cdGct.codeValue.eq(c.condTypeCd)));
    }

    /* 사은품 지급 조건 키조회 */
    @Override
    public Optional<PmGiftCondDto.Item> selectById(String giftCondId) {
        PmGiftCondDto.Item dto = baseQuery()
                .where(c.giftCondId.eq(giftCondId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사은품 지급 조건 목록조회 */
    @Override
    public List<PmGiftCondDto.Item> selectList(PmGiftCondDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftCondDto.Item> query = baseQuery().where(
                andSiteId(search),
                andGiftCondId(search),
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

    /* 사은품 지급 조건 페이지조회 */
    @Override
    public PmGiftCondDto.PageResponse selectPageList(PmGiftCondDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftCondDto.Item> query = baseQuery().where(
                andSiteId(search),
                andGiftCondId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmGiftCondDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(
                andSiteId(search),
                andGiftCondId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PmGiftCondDto.PageResponse res = new PmGiftCondDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 사은품 지급 조건 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PmGiftCondDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? c.siteId.eq(search.getSiteId()) : null;
    }

    /* giftCondId 정확 일치 */
    private BooleanExpression andGiftCondId(PmGiftCondDto.Request search) {
        return search != null && StringUtils.hasText(search.getGiftCondId())
                ? c.giftCondId.eq(search.getGiftCondId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PmGiftCondDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return c.regDate.goe(start).and(c.regDate.lt(endExcl));
            case "upd_date": return c.updDate.goe(start).and(c.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PmGiftCondDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",condTypeCd,", c.condTypeCd, pattern);
        or = orLike(or, all, types, ",giftCondId,", c.giftCondId, pattern);
        or = orLike(or, all, types, ",giftId,", c.giftId, pattern);
        or = orLike(or, all, types, ",siteId,", c.siteId, pattern);
        or = orLike(or, all, types, ",targetId,", c.targetId, pattern);
        or = orLike(or, all, types, ",targetTypeCd,", c.targetTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmGiftCondDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.giftCondId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("giftCondId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.giftCondId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.giftCondId));
        }
        return orders;
    }

    /* 사은품 지급 조건 수정 */
    @Override
    public int updateSelective(PmGiftCond entity) {
        if (entity.getGiftCondId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getGiftId()       != null) { update.set(c.giftId,       entity.getGiftId());       hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(c.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getCondTypeCd()   != null) { update.set(c.condTypeCd,   entity.getCondTypeCd());   hasAny = true; }
        if (entity.getMinOrderAmt()  != null) { update.set(c.minOrderAmt,  entity.getMinOrderAmt());  hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(c.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(c.targetId,     entity.getTargetId());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.giftCondId.eq(entity.getGiftCondId())).execute();
        return (int) affected;
    }
}
