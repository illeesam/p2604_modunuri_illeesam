package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdViewLogRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdhProdViewLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdViewLogRepositoryImpl implements QPdhProdViewLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdhProdViewLog l   = QPdhProdViewLog.pdhProdViewLog;
    private static final QSySite         ste = QSySite.sySite;

    /* 상품 조회 로그 buildBaseQuery */
    private JPAQuery<PdhProdViewLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdViewLogDto.Item.class,
                        l.logId,
                        l.siteId,
                        l.memberId,
                        l.sessionKey,
                        l.prodId,
                        l.refId,
                        l.refNm,
                        l.searchKw,
                        l.ip,
                        l.device,
                        l.referrer,
                        l.viewDate,
                        l.regBy, l.regDate, l.updBy, l.updDate
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId));
    }

    /* 상품 조회 로그 키조회 */
    @Override
    public Optional<PdhProdViewLogDto.Item> selectById(String id) {
        PdhProdViewLogDto.Item dto = buildBaseQuery()
                .where(l.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 조회 로그 목록조회 */
    @Override
    public List<PdhProdViewLogDto.Item> selectList(PdhProdViewLogDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdViewLogDto.Item> query = buildBaseQuery().where(where);
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

    /* 상품 조회 로그 페이지조회 */
    @Override
    public PdhProdViewLogDto.PageResponse selectPageList(PdhProdViewLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdViewLogDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdViewLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(where)
                .fetchOne();

        PdhProdViewLogDto.PageResponse res = new PdhProdViewLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(PdhProdViewLogDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId())) w.and(l.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getLogId()))  w.and(l.logId.eq(s.getLogId()));

        // searchValue + searchType (def_ref_nm)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_ref_nm,")) or.or(l.refNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(l.regDate.goe(start)).and(l.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(l.updDate.goe(start)).and(l.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(PdhProdViewLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("logId".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.logId));
                } else if ("refNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.refNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.regDate));
                }
            }
        }
        return orders;
    }

    /* 상품 조회 로그 수정 */
    @Override
    public int updateSelective(PdhProdViewLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(l.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getMemberId()   != null) { update.set(l.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getSessionKey() != null) { update.set(l.sessionKey, entity.getSessionKey()); hasAny = true; }
        if (entity.getProdId()     != null) { update.set(l.prodId,     entity.getProdId());     hasAny = true; }
        if (entity.getRefId()      != null) { update.set(l.refId,      entity.getRefId());      hasAny = true; }
        if (entity.getRefNm()      != null) { update.set(l.refNm,      entity.getRefNm());      hasAny = true; }
        if (entity.getSearchKw()   != null) { update.set(l.searchKw,   entity.getSearchKw());   hasAny = true; }
        if (entity.getIp()         != null) { update.set(l.ip,         entity.getIp());         hasAny = true; }
        if (entity.getDevice()     != null) { update.set(l.device,     entity.getDevice());     hasAny = true; }
        if (entity.getReferrer()   != null) { update.set(l.referrer,   entity.getReferrer());   hasAny = true; }
        if (entity.getViewDate()   != null) { update.set(l.viewDate,   entity.getViewDate());   hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(l.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(l.updDate,    entity.getUpdDate());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(l.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
