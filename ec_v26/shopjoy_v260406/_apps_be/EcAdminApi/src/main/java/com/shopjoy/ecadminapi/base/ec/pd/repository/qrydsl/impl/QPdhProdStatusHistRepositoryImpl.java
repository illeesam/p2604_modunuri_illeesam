package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdStatusHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdhProdStatusHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdStatusHistRepositoryImpl implements QPdhProdStatusHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPdhProdStatusHist h     = QPdhProdStatusHist.pdhProdStatusHist;
    private static final QSySite            ste   = QSySite.sySite;
    private static final QSyUser            usr   = QSyUser.syUser;
    private static final QSyCode            cd_ps = new QSyCode("cd_ps");

    private JPAQuery<PdhProdStatusHistDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdStatusHistDto.Item.class,
                        h.prodStatusHistId,
                        h.siteId,
                        h.prodId,
                        h.beforeStatusCd,
                        h.afterStatusCd,
                        h.memo,
                        h.procUserId,
                        h.procDate,
                        h.regBy, h.regDate, h.updBy, h.updDate
                ))
                .from(h)
                .leftJoin(ste).on(ste.siteId.eq(h.siteId))
                .leftJoin(usr).on(usr.userId.eq(h.procUserId))
                .leftJoin(cd_ps).on(cd_ps.codeGrp.eq("PRODUCT_STATUS").and(cd_ps.codeValue.eq(h.beforeStatusCd)));
    }

    @Override
    public Optional<PdhProdStatusHistDto.Item> selectById(String id) {
        PdhProdStatusHistDto.Item dto = buildBaseQuery()
                .where(h.prodStatusHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PdhProdStatusHistDto.Item> selectList(PdhProdStatusHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdStatusHistDto.Item> query = buildBaseQuery().where(where);
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

    @Override
    public PdhProdStatusHistDto.PageResponse selectPageList(PdhProdStatusHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdStatusHistDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdStatusHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(h.count())
                .from(h)
                .where(where)
                .fetchOne();

        PdhProdStatusHistDto.PageResponse res = new PdhProdStatusHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PdhProdStatusHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))           w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getProdStatusHistId())) w.and(h.prodStatusHistId.eq(s.getProdStatusHistId()));
        // procUserId / status 는 Request DTO 에 정의되어 있지 않음 → 조건 없음

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(h.regDate.goe(start)).and(h.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(h.updDate.goe(start)).and(h.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(PdhProdStatusHistDto.Request s) {
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
                if ("prodStatusHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.prodStatusHistId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PdhProdStatusHist entity) {
        if (entity.getProdStatusHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(h.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getProdId()         != null) { update.set(h.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getBeforeStatusCd() != null) { update.set(h.beforeStatusCd, entity.getBeforeStatusCd()); hasAny = true; }
        if (entity.getAfterStatusCd()  != null) { update.set(h.afterStatusCd,  entity.getAfterStatusCd());  hasAny = true; }
        if (entity.getMemo()           != null) { update.set(h.memo,           entity.getMemo());           hasAny = true; }
        if (entity.getProcUserId()     != null) { update.set(h.procUserId,     entity.getProcUserId());     hasAny = true; }
        if (entity.getProcDate()       != null) { update.set(h.procDate,       entity.getProcDate());       hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(h.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(h.updDate,        entity.getUpdDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.prodStatusHistId.eq(entity.getProdStatusHistId())).execute();
        return (int) affected;
    }
}
