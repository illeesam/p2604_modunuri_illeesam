package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdProdOptItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdOptItemRepositoryImpl implements QPdProdOptItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdProdOptItem i = QPdProdOptItem.pdProdOptItem;
    private static final QPdProdOpt     opt = QPdProdOpt.pdProdOpt;

    /* 상품 옵션 아이템 키조회 */
    @Override
    public Optional<PdProdOptItemDto.Item> selectById(String optItemId) {
        PdProdOptItemDto.Item dto = baseQuery()
                .where(i.optItemId.eq(optItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 옵션 아이템 목록조회 */
    @Override
    public List<PdProdOptItemDto.Item> selectList(PdProdOptItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptItemDto.Item> query = baseQuery().where(where);
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

    /* 상품 옵션 아이템 페이지조회 */
    @Override
    public PdProdOptItemDto.PageResponse selectPageList(PdProdOptItemDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdOptItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(i.count()).from(i).where(where).fetchOne();

        PdProdOptItemDto.PageResponse res = new PdProdOptItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query — DTO 필드만 프로젝션 */
    private JPAQuery<PdProdOptItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PdProdOptItemDto.Item.class,
                        i.optItemId,
                        i.siteId,
                        i.optId,
                        i.optTypeCd,
                        i.optNm,
                        i.optVal,
                        i.optValCodeId,
                        i.parentOptItemId,
                        i.optStyle,
                        i.sortOrd,
                        i.useYn,
                        i.regBy,
                        i.regDate,
                        i.updBy,
                        i.updDate
                ))
                .from(i);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    private BooleanBuilder buildCondition(PdProdOptItemDto.Request req) {
        BooleanBuilder w = new BooleanBuilder();
        if (req == null) return w;

        if (StringUtils.hasText(req.getProdId())) {
            w.and(i.optId.in(JPAExpressions.select(opt.optId).from(opt).where(opt.prodId.eq(req.getProdId()))));
        }
        if (StringUtils.hasText(req.getOptId()))     w.and(i.optId.eq(req.getOptId()));
        if (StringUtils.hasText(req.getSiteId()))    w.and(i.siteId.eq(req.getSiteId()));
        if (StringUtils.hasText(req.getOptItemId())) w.and(i.optItemId.eq(req.getOptItemId()));

        if (StringUtils.hasText(req.getSearchValue())) {
            String types = "," + (req.getSearchType() == null ? "" : req.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(req.getSearchType());
            String pattern = "%" + req.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",optNm,")) or.or(i.optNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(req.getDateType())
                && StringUtils.hasText(req.getDateStart())
                && StringUtils.hasText(req.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(req.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(req.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (req.getDateType()) {
                case "reg_date":
                    w.and(i.regDate.goe(start)).and(i.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(i.updDate.goe(start)).and(i.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdOptItemDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("optItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.optItemId));
                } else if ("optNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.optNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
            }
        }
        return orders;
    }

    /* 상품 옵션 아이템 수정 */
    @Override
    public int updateSelective(PdProdOptItem entity) {
        if (entity.getOptItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(i.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getOptId()           != null) { update.set(i.optId,           entity.getOptId());           hasAny = true; }
        if (entity.getOptTypeCd()       != null) { update.set(i.optTypeCd,       entity.getOptTypeCd());       hasAny = true; }
        if (entity.getOptNm()           != null) { update.set(i.optNm,           entity.getOptNm());           hasAny = true; }
        if (entity.getOptVal()          != null) { update.set(i.optVal,          entity.getOptVal());          hasAny = true; }
        if (entity.getOptValCodeId()    != null) { update.set(i.optValCodeId,    entity.getOptValCodeId());    hasAny = true; }
        if (entity.getParentOptItemId() != null) { update.set(i.parentOptItemId, entity.getParentOptItemId()); hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(i.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(i.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(i.updBy,           entity.getUpdBy());           hasAny = true; }
        if (entity.getUpdDate()         != null) { update.set(i.updDate,         entity.getUpdDate());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.optItemId.eq(entity.getOptItemId())).execute();
        return (int) affected;
    }
}
