package com.shopjoy.ecadminapi.base.ec.pm.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.repository.QPmGiftRepository;
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
    private static final QPmGift  g    = QPmGift.pmGift;
    private static final QPdProd  prd  = QPdProd.pdProd;
    private static final QSySite  ste  = QSySite.sySite;
    private static final QSyCode  cdGt = new QSyCode("cd_gt");
    private static final QSyCode  cdGs = new QSyCode("cd_gs");
    private static final QSyCode  cdMg = new QSyCode("cd_mg");

    /** 공통 base query — JOIN 일치, Item 필드만 projection */
    private JPAQuery<PmGiftDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftDto.Item.class,
                        g.giftId, g.siteId, g.giftNm, g.giftTypeCd, g.prodId,
                        g.giftStock, g.giftDesc, g.startDate, g.endDate,
                        g.giftStatusCd, g.giftStatusCdBefore, g.memGradeCd,
                        g.minOrderAmt, g.minOrderQty, g.selfCdivRate, g.sellerCdivRate,
                        g.useYn, g.regBy, g.regDate, g.updBy, g.updDate
                ))
                .from(g)
                .leftJoin(prd).on(prd.prodId.eq(g.prodId))
                .leftJoin(ste).on(ste.siteId.eq(g.siteId))
                .leftJoin(cdGt).on(cdGt.codeGrp.eq("GIFT_TYPE").and(cdGt.codeValue.eq(g.giftTypeCd)))
                .leftJoin(cdGs).on(cdGs.codeGrp.eq("GIFT_STATUS").and(cdGs.codeValue.eq(g.giftStatusCd)))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(g.memGradeCd)));
    }

    /** 단건 조회 */
    @Override
    public Optional<PmGiftDto.Item> selectById(String giftId) {
        PmGiftDto.Item dto = baseQuery()
                .where(g.giftId.eq(giftId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PmGiftDto.Item> selectList(PmGiftDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftDto.Item> query = baseQuery().where(where);
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

    /** 페이지 목록 */
    @Override
    public PmGiftDto.PageResponse selectPageList(PmGiftDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmGiftDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(g.count())
                .from(g)
                .where(where)
                .fetchOne();

        PmGiftDto.PageResponse res = new PmGiftDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pmGiftCond 와 동일 */
    private BooleanBuilder buildCondition(PmGiftDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))   w.and(g.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getGiftId()))   w.and(g.giftId.eq(s.getGiftId()));
        if (StringUtils.hasText(s.getUseYn()))    w.and(g.useYn.eq(s.getUseYn()));

        // searchValue + searchTypes (def_gift_nm)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all  = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_gift_nm")) or.or(g.giftNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(g.regDate.goe(start)).and(g.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(g.updDate.goe(start)).and(g.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /** 정렬조건 빌드 — Mapper XML pmGiftSort 와 동일 토큰 */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmGiftDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, g.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  g.giftId));  break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, g.giftId));  break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  g.giftNm));  break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, g.giftNm));  break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  g.regDate)); break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, g.regDate)); break;
            default:         orders.add(new OrderSpecifier(Order.DESC, g.regDate)); break;
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PmGift entity) {
        if (entity.getGiftId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(g.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getGiftNm()             != null) { update.set(g.giftNm,             entity.getGiftNm());             hasAny = true; }
        if (entity.getGiftTypeCd()         != null) { update.set(g.giftTypeCd,         entity.getGiftTypeCd());         hasAny = true; }
        if (entity.getProdId()             != null) { update.set(g.prodId,             entity.getProdId());             hasAny = true; }
        if (entity.getGiftStock()          != null) { update.set(g.giftStock,          entity.getGiftStock());          hasAny = true; }
        if (entity.getGiftDesc()           != null) { update.set(g.giftDesc,           entity.getGiftDesc());           hasAny = true; }
        if (entity.getStartDate()          != null) { update.set(g.startDate,          entity.getStartDate());          hasAny = true; }
        if (entity.getEndDate()            != null) { update.set(g.endDate,            entity.getEndDate());            hasAny = true; }
        if (entity.getGiftStatusCd()       != null) { update.set(g.giftStatusCd,       entity.getGiftStatusCd());       hasAny = true; }
        if (entity.getGiftStatusCdBefore() != null) { update.set(g.giftStatusCdBefore, entity.getGiftStatusCdBefore()); hasAny = true; }
        if (entity.getMemGradeCd()         != null) { update.set(g.memGradeCd,         entity.getMemGradeCd());         hasAny = true; }
        if (entity.getMinOrderAmt()        != null) { update.set(g.minOrderAmt,        entity.getMinOrderAmt());        hasAny = true; }
        if (entity.getMinOrderQty()        != null) { update.set(g.minOrderQty,        entity.getMinOrderQty());        hasAny = true; }
        if (entity.getSelfCdivRate()       != null) { update.set(g.selfCdivRate,       entity.getSelfCdivRate());       hasAny = true; }
        if (entity.getSellerCdivRate()     != null) { update.set(g.sellerCdivRate,     entity.getSellerCdivRate());     hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(g.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(g.updBy,              entity.getUpdBy());              hasAny = true; }
        if (entity.getUpdDate()            != null) { update.set(g.updDate,            entity.getUpdDate());            hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(g.giftId.eq(entity.getGiftId())).execute();
        return (int) affected;
    }
}
