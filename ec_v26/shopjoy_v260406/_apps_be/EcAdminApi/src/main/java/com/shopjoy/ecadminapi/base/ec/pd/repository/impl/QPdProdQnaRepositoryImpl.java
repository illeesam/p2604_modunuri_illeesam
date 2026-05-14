package com.shopjoy.ecadminapi.base.ec.pd.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.repository.QPdProdQnaRepository;
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
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdQnaDto.Item> query = baseQuery().where(where);
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

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdQnaDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdQnaDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(q.count()).from(q).where(where).fetchOne();

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
    private BooleanBuilder buildCondition(PdProdQnaDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(q.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getQnaId()))  w.and(q.qnaId.eq(s.getQnaId()));
        if (StringUtils.hasText(s.getProdId())) w.and(q.prodId.eq(s.getProdId()));
        if (StringUtils.hasText(s.getUseYn()))  w.and(q.useYn.eq(s.getUseYn()));

        // searchValue + searchTypes (def_qna_title)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all  = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_qna_title")) or.or(q.qnaTitle.likeIgnoreCase(pattern));
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
                    w.and(q.regDate.goe(start)).and(q.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(q.updDate.goe(start)).and(q.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /** 정렬조건 빌드 */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdQnaDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, q.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  q.qnaId));    break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, q.qnaId));    break;
            case "nm_asc":   orders.add(new OrderSpecifier(Order.ASC,  q.qnaTitle)); break;
            case "nm_desc":  orders.add(new OrderSpecifier(Order.DESC, q.qnaTitle)); break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  q.regDate));  break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, q.regDate));  break;
            default:         orders.add(new OrderSpecifier(Order.DESC, q.regDate));  break;
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
        if (entity.getUpdDate()     != null) { update.set(q.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(q.qnaId.eq(entity.getQnaId())).execute();
        return (int) affected;
    }
}
