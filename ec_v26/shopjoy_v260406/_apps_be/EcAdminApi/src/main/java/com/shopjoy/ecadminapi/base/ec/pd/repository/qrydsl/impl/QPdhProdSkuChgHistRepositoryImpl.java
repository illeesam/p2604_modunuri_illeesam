package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
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
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdSkuChgHistRepositoryImpl";
    private static final QPdhProdSkuChgHist a      = QPdhProdSkuChgHist.pdhProdSkuChgHist;
    private static final QSySite            ste    = QSySite.sySite;
    private static final QPdProd            prd    = QPdProd.pdProd;
    private static final QSyCode            cd_sct = new QSyCode("cd_sct");

    /* 상품 SKU 변경 이력 baseSelColumnQuery */
    private JPAQuery<PdhProdSkuChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuChgHistDto.Item.class,
                        a.histId,
                        a.siteId,
                        a.skuId,
                        a.prodId,
                        a.chgTypeCd,
                        a.beforeVal,
                        a.afterVal,
                        a.chgReason,
                        a.chgBy,
                        a.chgDate,
                        a.regBy,
                        a.regDate
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(prd).on(prd.prodId.eq(a.prodId))
                .leftJoin(cd_sct).on(cd_sct.codeGrp.eq("SKU_CHG_TYPE").and(cd_sct.codeValue.eq(a.chgTypeCd)));
    }

    /* 상품 SKU 변경 이력 키조회 */
    @Override
    public Optional<PdhProdSkuChgHistDto.Item> selectById(String id) {
        PdhProdSkuChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(a.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 변경 이력 목록조회 */
    @Override
    public List<PdhProdSkuChgHistDto.Item> selectList(PdhProdSkuChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndHistId(search),
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

    /* 상품 SKU 변경 이력 페이지조회 */
    @Override
    public PdhProdSkuChgHistDto.PageResponse selectPageData(PdhProdSkuChgHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndSiteId(search),
                baseAndHistId(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdSkuChgHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndHistId(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        PdhProdSkuChgHistDto.PageResponse res = new PdhProdSkuChgHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 상품 SKU 변경 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdhProdSkuChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* histId 정확 일치 */
    private BooleanExpression baseAndHistId(PdhProdSkuChgHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getHistId())
                ? a.histId.eq(search.getHistId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdhProdSkuChgHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",afterVal,", a.afterVal, pattern);
        or = orLike(or, all, types, ",beforeVal,", a.beforeVal, pattern);
        or = orLike(or, all, types, ",chgBy,", a.chgBy, pattern);
        or = orLike(or, all, types, ",chgReason,", a.chgReason, pattern);
        or = orLike(or, all, types, ",chgTypeCd,", a.chgTypeCd, pattern);
        or = orLike(or, all, types, ",histId,", a.histId, pattern);
        or = orLike(or, all, types, ",prodId,", a.prodId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", a.skuId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdhProdSkuChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.histId));
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
                    orders.add(new OrderSpecifier(order, a.histId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.histId));
        }
        return orders;
    }

    /* 상품 SKU 변경 이력 수정 */
    @Override
    public int updateSelective(PdhProdSkuChgHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()    != null) { update.set(a.siteId,    entity.getSiteId());    hasAny = true; }
        if (entity.getSkuId()     != null) { update.set(a.skuId,     entity.getSkuId());     hasAny = true; }
        if (entity.getProdId()    != null) { update.set(a.prodId,    entity.getProdId());    hasAny = true; }
        if (entity.getChgTypeCd() != null) { update.set(a.chgTypeCd, entity.getChgTypeCd()); hasAny = true; }
        if (entity.getBeforeVal() != null) { update.set(a.beforeVal, entity.getBeforeVal()); hasAny = true; }
        if (entity.getAfterVal()  != null) { update.set(a.afterVal,  entity.getAfterVal());  hasAny = true; }
        if (entity.getChgReason() != null) { update.set(a.chgReason, entity.getChgReason()); hasAny = true; }
        if (entity.getChgBy()     != null) { update.set(a.chgBy,     entity.getChgBy());     hasAny = true; }
        if (entity.getChgDate()   != null) { update.set(a.chgDate,   entity.getChgDate());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(a.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
