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
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftRepository;
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

/** PmGift QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftRepositoryImpl implements QPmGiftRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmGiftRepositoryImpl";
    private static final QPmGift  pmGift    = QPmGift.pmGift;
    private static final QPdProd  pdProd  = QPdProd.pdProd;
    private static final QSySite  sySite  = QSySite.sySite;
    private static final QSyCode  cdGt = new QSyCode("cd_gt");
    private static final QSyCode  cdGs = new QSyCode("cd_gs");
    private static final QSyCode  cdMg = new QSyCode("cd_mg");

    /** 공통 base query — JOIN 일치, Item 필드만 projection */
    private JPAQuery<PmGiftDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftDto.Item.class,
                        pmGift.giftId, pmGift.siteId, pmGift.giftNm, pmGift.giftTypeCd, pmGift.prodId,
                        pmGift.giftStock, pmGift.giftDesc, pmGift.startDate, pmGift.endDate,
                        pmGift.giftStatusCd, pmGift.giftStatusCdBefore, pmGift.memGradeCd,
                        pmGift.minOrderAmt, pmGift.minOrderQty, pmGift.selfCdivRate, pmGift.sellerCdivRate,
                        pmGift.useYn, pmGift.regBy, pmGift.regDate, pmGift.updBy, pmGift.updDate
                ))
                .from(pmGift)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pmGift.prodId))
                .leftJoin(sySite).on(sySite.siteId.eq(pmGift.siteId))
                .leftJoin(cdGt).on(cdGt.codeGrp.eq("GIFT_TYPE").and(cdGt.codeValue.eq(pmGift.giftTypeCd)))
                .leftJoin(cdGs).on(cdGs.codeGrp.eq("GIFT_STATUS").and(cdGs.codeValue.eq(pmGift.giftStatusCd)))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(pmGift.memGradeCd)));
    }

    /** 단건 조회 */
    @Override
    public Optional<PmGiftDto.Item> selectById(String giftId) {
        PmGiftDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmGift.giftId.eq(giftId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PmGiftDto.Item> selectList(PmGiftDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andGiftIdEq(search),
                    andGiftTypeCdEq(search),
                    andGiftStatusCdEq(search),
                    andUseYnEq(search),
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

    /** 페이지 목록 */
    @Override
    public PmGiftDto.PageResponse selectPageData(PmGiftDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andGiftIdEq(search),
                andGiftTypeCdEq(search),
                andGiftStatusCdEq(search),
                andUseYnEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmGiftDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmGiftDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmGift.count())
                .where(wheres)
                .fetchOne();

        PmGiftDto.PageResponse res = new PmGiftDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pmGiftCond 와 동일 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(PmGiftDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmGift.siteId.eq(search.getSiteId()) : null;
    }

    /* giftId 정확 일치 */
    private BooleanExpression andGiftIdEq(PmGiftDto.Request search) {
        return search != null && StringUtils.hasText(search.getGiftId())
                ? pmGift.giftId.eq(search.getGiftId()) : null;
    }

    /* giftTypeCd 정확 일치 (조건유형 select) */
    private BooleanExpression andGiftTypeCdEq(PmGiftDto.Request search) {
        return search != null && StringUtils.hasText(search.getGiftTypeCd())
                ? pmGift.giftTypeCd.eq(search.getGiftTypeCd()) : null;
    }

    /* giftStatusCd 정확 일치 (상태 select) */
    private BooleanExpression andGiftStatusCdEq(PmGiftDto.Request search) {
        return search != null && StringUtils.hasText(search.getGiftStatusCd())
                ? pmGift.giftStatusCd.eq(search.getGiftStatusCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYnEq(PmGiftDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? pmGift.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(PmGiftDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmGift.regDate.goe(start).and(pmGift.regDate.lt(endExcl));
            case "upd_date": return pmGift.updDate.goe(start).and(pmGift.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(PmGiftDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",giftDesc,", pmGift.giftDesc, pattern);
        or = orLike(or, all, types, ",giftId,", pmGift.giftId, pattern);
        or = orLike(or, all, types, ",giftNm,", pmGift.giftNm, pattern);
        or = orLike(or, all, types, ",giftStatusCd,", pmGift.giftStatusCd, pattern);
        or = orLike(or, all, types, ",giftStatusCdBefore,", pmGift.giftStatusCdBefore, pattern);
        or = orLike(or, all, types, ",giftTypeCd,", pmGift.giftTypeCd, pattern);
        or = orLike(or, all, types, ",memGradeCd,", pmGift.memGradeCd, pattern);
        or = orLike(or, all, types, ",prodId,", pmGift.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", pmGift.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", pmGift.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmGiftDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmGift.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmGift.giftId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("giftId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGift.giftId));
                } else if ("giftNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGift.giftNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmGift.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmGift.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmGift.giftId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PmGift entity) {
        if (entity.getGiftId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmGift);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(pmGift.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getGiftNm()             != null) { update.set(pmGift.giftNm,             entity.getGiftNm());             hasAny = true; }
        if (entity.getGiftTypeCd()         != null) { update.set(pmGift.giftTypeCd,         entity.getGiftTypeCd());         hasAny = true; }
        if (entity.getProdId()             != null) { update.set(pmGift.prodId,             entity.getProdId());             hasAny = true; }
        if (entity.getGiftStock()          != null) { update.set(pmGift.giftStock,          entity.getGiftStock());          hasAny = true; }
        if (entity.getGiftDesc()           != null) { update.set(pmGift.giftDesc,           entity.getGiftDesc());           hasAny = true; }
        if (entity.getStartDate()          != null) { update.set(pmGift.startDate,          entity.getStartDate());          hasAny = true; }
        if (entity.getEndDate()            != null) { update.set(pmGift.endDate,            entity.getEndDate());            hasAny = true; }
        if (entity.getGiftStatusCd()       != null) { update.set(pmGift.giftStatusCd,       entity.getGiftStatusCd());       hasAny = true; }
        if (entity.getGiftStatusCdBefore() != null) { update.set(pmGift.giftStatusCdBefore, entity.getGiftStatusCdBefore()); hasAny = true; }
        if (entity.getMemGradeCd()         != null) { update.set(pmGift.memGradeCd,         entity.getMemGradeCd());         hasAny = true; }
        if (entity.getMinOrderAmt()        != null) { update.set(pmGift.minOrderAmt,        entity.getMinOrderAmt());        hasAny = true; }
        if (entity.getMinOrderQty()        != null) { update.set(pmGift.minOrderQty,        entity.getMinOrderQty());        hasAny = true; }
        if (entity.getSelfCdivRate()       != null) { update.set(pmGift.selfCdivRate,       entity.getSelfCdivRate());       hasAny = true; }
        if (entity.getSellerCdivRate()     != null) { update.set(pmGift.sellerCdivRate,     entity.getSellerCdivRate());     hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(pmGift.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(pmGift.updBy,              entity.getUpdBy());              hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmGift.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmGift.giftId.eq(entity.getGiftId())).execute();
        return (int) affected;
    }
}
