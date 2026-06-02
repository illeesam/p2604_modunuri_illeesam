package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdQnaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdQna QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdQnaRepositoryImpl implements QPdProdQnaRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdQnaRepositoryImpl";
    private static final QPdProdQna pdProdQna = QPdProdQna.pdProdQna;

    /** 단건 조회 */
    private JPAQuery<PdProdQnaDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdQnaDto.Item.class,
                        pdProdQna.qnaId, pdProdQna.siteId, pdProdQna.prodId, pdProdQna.skuId, pdProdQna.memberId, pdProdQna.orderId,
                        pdProdQna.qnaTypeCd, pdProdQna.qnaTitle, pdProdQna.qnaContent,
                        pdProdQna.scrtYn, pdProdQna.answYn, pdProdQna.answContent, pdProdQna.answDate, pdProdQna.answUserId,
                        pdProdQna.dispYn, pdProdQna.useYn,
                        pdProdQna.regBy, pdProdQna.regDate, pdProdQna.updBy, pdProdQna.updDate
                ))
                .from(pdProdQna);
    }

    @Override
    public Optional<PdProdQnaDto.Item> selectById(String qnaId) {
        PdProdQnaDto.Item dto = baseSelColumnQuery()
                .where(pdProdQna.qnaId.eq(qnaId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdProdQnaDto.Item> selectList(PdProdQnaDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdQnaDto.Item> query = baseSelColumnQuery().where(
                baseAndSiteId(search),
                baseAndQnaId(search),
                baseAndProdId(search),
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

    /** 페이지 목록 */
    @Override
    public PdProdQnaDto.PageResponse selectPageData(PdProdQnaDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndQnaId(search),
                baseAndProdId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PdProdQnaDto.Item> query = baseSelColumnQuery().where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdQnaDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(pdProdQna.count()).from(pdProdQna).where(wheres).fetchOne();

        PdProdQnaDto.PageResponse res = new PdProdQnaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /** 검색조건 빌드 — Mapper XML pdProdQnaCond 와 동일 동작 (DTO Request 필드 한정) */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdProdQnaDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdProdQna.siteId.eq(search.getSiteId()) : null;
    }

    /* qnaId 정확 일치 */
    private BooleanExpression baseAndQnaId(PdProdQnaDto.Request search) {
        return search != null && StringUtils.hasText(search.getQnaId())
                ? pdProdQna.qnaId.eq(search.getQnaId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression baseAndProdId(PdProdQnaDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? pdProdQna.prodId.eq(search.getProdId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(PdProdQnaDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? pdProdQna.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdProdQnaDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdProdQna.regDate.goe(start).and(pdProdQna.regDate.lt(endExcl));
            case "upd_date": return pdProdQna.updDate.goe(start).and(pdProdQna.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdProdQnaDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",answContent,", pdProdQna.answContent, pattern);
        or = orLike(or, all, types, ",answUserId,", pdProdQna.answUserId, pattern);
        or = orLike(or, all, types, ",answYn,", pdProdQna.answYn, pattern);
        or = orLike(or, all, types, ",dispYn,", pdProdQna.dispYn, pattern);
        or = orLike(or, all, types, ",memberId,", pdProdQna.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", pdProdQna.orderId, pattern);
        or = orLike(or, all, types, ",prodId,", pdProdQna.prodId, pattern);
        or = orLike(or, all, types, ",qnaContent,", pdProdQna.qnaContent, pattern);
        or = orLike(or, all, types, ",qnaId,", pdProdQna.qnaId, pattern);
        or = orLike(or, all, types, ",qnaTitle,", pdProdQna.qnaTitle, pattern);
        or = orLike(or, all, types, ",qnaTypeCd,", pdProdQna.qnaTypeCd, pattern);
        or = orLike(or, all, types, ",scrtYn,", pdProdQna.scrtYn, pattern);
        or = orLike(or, all, types, ",siteId,", pdProdQna.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", pdProdQna.skuId, pattern);
        or = orLike(or, all, types, ",useYn,", pdProdQna.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdQnaDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdProdQna.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdQna.qnaId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("qnaId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdQna.qnaId));
                } else if ("qnaTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdQna.qnaTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdQna.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdProdQna.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdQna.qnaId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */

    @Override
    public int updateSelective(PdProdQna entity) {
        if (entity.getQnaId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdQna);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(pdProdQna.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdId()      != null) { update.set(pdProdQna.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getSkuId()       != null) { update.set(pdProdQna.skuId,       entity.getSkuId());       hasAny = true; }
        if (entity.getMemberId()    != null) { update.set(pdProdQna.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getOrderId()     != null) { update.set(pdProdQna.orderId,     entity.getOrderId());     hasAny = true; }
        if (entity.getQnaTypeCd()   != null) { update.set(pdProdQna.qnaTypeCd,   entity.getQnaTypeCd());   hasAny = true; }
        if (entity.getQnaTitle()    != null) { update.set(pdProdQna.qnaTitle,    entity.getQnaTitle());    hasAny = true; }
        if (entity.getQnaContent()  != null) { update.set(pdProdQna.qnaContent,  entity.getQnaContent());  hasAny = true; }
        if (entity.getScrtYn()      != null) { update.set(pdProdQna.scrtYn,      entity.getScrtYn());      hasAny = true; }
        if (entity.getAnswYn()      != null) { update.set(pdProdQna.answYn,      entity.getAnswYn());      hasAny = true; }
        if (entity.getAnswContent() != null) { update.set(pdProdQna.answContent, entity.getAnswContent()); hasAny = true; }
        if (entity.getAnswDate()    != null) { update.set(pdProdQna.answDate,    entity.getAnswDate());    hasAny = true; }
        if (entity.getAnswUserId()  != null) { update.set(pdProdQna.answUserId,  entity.getAnswUserId());  hasAny = true; }
        if (entity.getDispYn()      != null) { update.set(pdProdQna.dispYn,      entity.getDispYn());      hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(pdProdQna.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(pdProdQna.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdProdQna.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdQna.qnaId.eq(entity.getQnaId())).execute();
        return (int) affected;
    }
}
