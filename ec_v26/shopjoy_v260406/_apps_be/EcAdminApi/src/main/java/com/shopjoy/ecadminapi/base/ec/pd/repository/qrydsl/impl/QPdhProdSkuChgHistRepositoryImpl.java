package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdSkuChgHistRepository;
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

/** PdhProdSkuChgHist QueryDSL Custom 구현체 — write-once 로그성 (updBy/updDate 없음) */
@RequiredArgsConstructor
public class QPdhProdSkuChgHistRepositoryImpl implements QPdhProdSkuChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdhProdSkuChgHist h      = QPdhProdSkuChgHist.pdhProdSkuChgHist;
    private static final QSySite            ste    = QSySite.sySite;
    private static final QPdProd            prd    = QPdProd.pdProd;
    private static final QSyCode            cd_sct = new QSyCode("cd_sct");

    /* 상품 SKU 변경 이력 buildBaseQuery */
    private JPAQuery<PdhProdSkuChgHistDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuChgHistDto.Item.class,
                        h.histId,
                        h.siteId,
                        h.skuId,
                        h.prodId,
                        h.chgTypeCd,
                        h.beforeVal,
                        h.afterVal,
                        h.chgReason,
                        h.chgBy,
                        h.chgDate,
                        h.regBy,
                        h.regDate
                ))
                .from(h)
                .leftJoin(ste).on(ste.siteId.eq(h.siteId))
                .leftJoin(prd).on(prd.prodId.eq(h.prodId))
                .leftJoin(cd_sct).on(cd_sct.codeGrp.eq("SKU_CHG_TYPE").and(cd_sct.codeValue.eq(h.chgTypeCd)));
    }

    /* 상품 SKU 변경 이력 키조회 */
    @Override
    public Optional<PdhProdSkuChgHistDto.Item> selectById(String id) {
        PdhProdSkuChgHistDto.Item dto = buildBaseQuery()
                .where(h.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 변경 이력 목록조회 */
    @Override
    public List<PdhProdSkuChgHistDto.Item> selectList(PdhProdSkuChgHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuChgHistDto.Item> query = buildBaseQuery().where(where);
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

    /* 상품 SKU 변경 이력 페이지조회 */
    @Override
    public PdhProdSkuChgHistDto.PageResponse selectPageList(PdhProdSkuChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuChgHistDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdSkuChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(h.count())
                .from(h)
                .where(where)
                .fetchOne();

        PdhProdSkuChgHistDto.PageResponse res = new PdhProdSkuChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 상품 SKU 변경 이력 buildCondition */
    private BooleanBuilder buildCondition(PdhProdSkuChgHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getHistId())) w.and(h.histId.eq(s.getHistId()));
        // prodId / typeCd 는 Request DTO 에 정의되어 있지 않음 → 조건 없음

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            // upd_date 미존재 (write-once) → reg_date 만 처리
            if ("reg_date".equals(s.getDateType())) {
                w.and(h.regDate.goe(start)).and(h.regDate.lt(endExcl));
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdhProdSkuChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("histId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.histId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        return orders;
    }

    /* 상품 SKU 변경 이력 수정 */
    @Override
    public int updateSelective(PdhProdSkuChgHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()    != null) { update.set(h.siteId,    entity.getSiteId());    hasAny = true; }
        if (entity.getSkuId()     != null) { update.set(h.skuId,     entity.getSkuId());     hasAny = true; }
        if (entity.getProdId()    != null) { update.set(h.prodId,    entity.getProdId());    hasAny = true; }
        if (entity.getChgTypeCd() != null) { update.set(h.chgTypeCd, entity.getChgTypeCd()); hasAny = true; }
        if (entity.getBeforeVal() != null) { update.set(h.beforeVal, entity.getBeforeVal()); hasAny = true; }
        if (entity.getAfterVal()  != null) { update.set(h.afterVal,  entity.getAfterVal());  hasAny = true; }
        if (entity.getChgReason() != null) { update.set(h.chgReason, entity.getChgReason()); hasAny = true; }
        if (entity.getChgBy()     != null) { update.set(h.chgBy,     entity.getChgBy());     hasAny = true; }
        if (entity.getChgDate()   != null) { update.set(h.chgDate,   entity.getChgDate());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
