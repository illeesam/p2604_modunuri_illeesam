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
    private static final QPdProdQna q = QPdProdQna.pdProdQna;

    /** 단건 조회 */
    @Override
    public Optional<PdProdQnaDto.Item> selectById(String qnaId) {
        PdProdQnaDto.Item dto = baseQuery()
                .where(q.qnaId.eq(qnaId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<PdProdQnaDto.Item> selectList(PdProdQnaDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdQnaDto.Item> query = baseQuery().where(
                andSiteId(search),
                andQnaId(search),
                andProdId(search),
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

    /** 페이지 목록 */
    @Override
    public PdProdQnaDto.PageResponse selectPageList(PdProdQnaDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdQnaDto.Item> query = baseQuery().where(
                andSiteId(search),
                andQnaId(search),
                andProdId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdQnaDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(q.count()).from(q).where(
                andSiteId(search),
                andQnaId(search),
                andProdId(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        PdProdQnaDto.PageResponse res = new PdProdQnaDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    private JPAQuery<PdProdQnaDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdQnaDto.Item.class,
                        q.qnaId, q.siteId, q.prodId, q.skuId, q.memberId, q.orderId,
                        q.qnaTypeCd, q.qnaTitle, q.qnaContent,
                        q.scrtYn, q.answYn, q.answContent, q.answDate, q.answUserId,
                        q.dispYn, q.useYn,
                        q.regBy, q.regDate, q.updBy, q.updDate
                ))
                .from(q);
    }

    /** 검색조건 빌드 — Mapper XML pdProdQnaCond 와 동일 동작 (DTO Request 필드 한정) */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PdProdQnaDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? q.siteId.eq(search.getSiteId()) : null;
    }

    /* qnaId 정확 일치 */
    private BooleanExpression andQnaId(PdProdQnaDto.Request search) {
        return search != null && StringUtils.hasText(search.getQnaId())
                ? q.qnaId.eq(search.getQnaId()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression andProdId(PdProdQnaDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? q.prodId.eq(search.getProdId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(PdProdQnaDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? q.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PdProdQnaDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return q.regDate.goe(start).and(q.regDate.lt(endExcl));
            case "upd_date": return q.updDate.goe(start).and(q.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PdProdQnaDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",answContent,", q.answContent, pattern);
        or = orLike(or, all, types, ",answUserId,", q.answUserId, pattern);
        or = orLike(or, all, types, ",answYn,", q.answYn, pattern);
        or = orLike(or, all, types, ",dispYn,", q.dispYn, pattern);
        or = orLike(or, all, types, ",memberId,", q.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", q.orderId, pattern);
        or = orLike(or, all, types, ",prodId,", q.prodId, pattern);
        or = orLike(or, all, types, ",qnaContent,", q.qnaContent, pattern);
        or = orLike(or, all, types, ",qnaId,", q.qnaId, pattern);
        or = orLike(or, all, types, ",qnaTitle,", q.qnaTitle, pattern);
        or = orLike(or, all, types, ",qnaTypeCd,", q.qnaTypeCd, pattern);
        or = orLike(or, all, types, ",scrtYn,", q.scrtYn, pattern);
        or = orLike(or, all, types, ",siteId,", q.siteId, pattern);
        or = orLike(or, all, types, ",skuId,", q.skuId, pattern);
        or = orLike(or, all, types, ",useYn,", q.useYn, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, q.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, q.qnaId));
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
                    orders.add(new OrderSpecifier(order, q.qnaId));
                } else if ("qnaTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, q.qnaTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, q.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, q.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, q.qnaId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdProdQna entity) {
        if (entity.getQnaId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(q);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(q.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getProdId()      != null) { update.set(q.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getSkuId()       != null) { update.set(q.skuId,       entity.getSkuId());       hasAny = true; }
        if (entity.getMemberId()    != null) { update.set(q.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getOrderId()     != null) { update.set(q.orderId,     entity.getOrderId());     hasAny = true; }
        if (entity.getQnaTypeCd()   != null) { update.set(q.qnaTypeCd,   entity.getQnaTypeCd());   hasAny = true; }
        if (entity.getQnaTitle()    != null) { update.set(q.qnaTitle,    entity.getQnaTitle());    hasAny = true; }
        if (entity.getQnaContent()  != null) { update.set(q.qnaContent,  entity.getQnaContent());  hasAny = true; }
        if (entity.getScrtYn()      != null) { update.set(q.scrtYn,      entity.getScrtYn());      hasAny = true; }
        if (entity.getAnswYn()      != null) { update.set(q.answYn,      entity.getAnswYn());      hasAny = true; }
        if (entity.getAnswContent() != null) { update.set(q.answContent, entity.getAnswContent()); hasAny = true; }
        if (entity.getAnswDate()    != null) { update.set(q.answDate,    entity.getAnswDate());    hasAny = true; }
        if (entity.getAnswUserId()  != null) { update.set(q.answUserId,  entity.getAnswUserId());  hasAny = true; }
        if (entity.getDispYn()      != null) { update.set(q.dispYn,      entity.getDispYn());      hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(q.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(q.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(q.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(q.qnaId.eq(entity.getQnaId())).execute();
        return (int) affected;
    }
}
