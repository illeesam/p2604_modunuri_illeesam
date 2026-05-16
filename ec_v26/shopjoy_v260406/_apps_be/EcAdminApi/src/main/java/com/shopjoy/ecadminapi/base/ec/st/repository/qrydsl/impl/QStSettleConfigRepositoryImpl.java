package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleConfigRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** StSettleConfig QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleConfigRepositoryImpl implements QStSettleConfigRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStSettleConfig c    = QStSettleConfig.stSettleConfig;
    private static final QSySite        ste  = QSySite.sySite;
    private static final QSyVendor      vnd  = QSyVendor.syVendor;
    private static final QPdCategory    cat  = QPdCategory.pdCategory;
    private static final QSyCode        cdSc = new QSyCode("cd_sc");

    /* 정산 설정 키조회 */
    @Override
    public Optional<StSettleConfigDto.Item> selectById(String id) {
        StSettleConfigDto.Item dto = baseListQuery()
                .where(c.settleConfigId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 설정 목록조회 */
    @Override
    public List<StSettleConfigDto.Item> selectList(StSettleConfigDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleConfigDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 정산 설정 페이지조회 */
    @Override
    public StSettleConfigDto.PageResponse selectPageList(StSettleConfigDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleConfigDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleConfigDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(where)
                .fetchOne();

        StSettleConfigDto.PageResponse res = new StSettleConfigDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 설정 baseListQuery */
    private JPAQuery<StSettleConfigDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleConfigDto.Item.class,
                        c.settleConfigId, c.siteId, c.vendorId, c.categoryId,
                        c.settleCycleCd, c.settleDay, c.commissionRate, c.minSettleAmt,
                        c.settleConfigRemark, c.useYn,
                        c.regBy, c.regDate, c.updBy, c.updDate,
                        ste.siteNm.as("siteNm"),
                        vnd.vendorNm.as("vendorNm"),
                        cat.categoryNm.as("categoryNm"),
                        cdSc.codeLabel.as("settleCycleCdNm")
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId))
                .leftJoin(vnd).on(vnd.vendorId.eq(c.vendorId))
                .leftJoin(cat).on(cat.categoryId.eq(c.categoryId))
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SETTLE_CYCLE").and(cdSc.codeValue.eq(c.settleCycleCd)));
    }

    /* 정산 설정 buildCondition */
    private BooleanBuilder buildCondition(StSettleConfigDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))         w.and(c.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getSettleConfigId())) w.and(c.settleConfigId.eq(s.getSettleConfigId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(c.regDate.goe(start)).and(c.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(c.updDate.goe(start)).and(c.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleConfigDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleConfigId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.settleConfigId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        return orders;
    }

    /* 정산 설정 수정 */
    @Override
    public int updateSelective(StSettleConfig entity) {
        if (entity.getSettleConfigId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSiteId()             != null) { update.set(c.siteId,             entity.getSiteId());             hasAny = true; }
        if (entity.getVendorId()           != null) { update.set(c.vendorId,           entity.getVendorId());           hasAny = true; }
        if (entity.getCategoryId()         != null) { update.set(c.categoryId,         entity.getCategoryId());         hasAny = true; }
        if (entity.getSettleCycleCd()      != null) { update.set(c.settleCycleCd,      entity.getSettleCycleCd());      hasAny = true; }
        if (entity.getSettleDay()          != null) { update.set(c.settleDay,          entity.getSettleDay());          hasAny = true; }
        if (entity.getCommissionRate()     != null) { update.set(c.commissionRate,     entity.getCommissionRate());     hasAny = true; }
        if (entity.getMinSettleAmt()       != null) { update.set(c.minSettleAmt,       entity.getMinSettleAmt());       hasAny = true; }
        if (entity.getSettleConfigRemark() != null) { update.set(c.settleConfigRemark, entity.getSettleConfigRemark()); hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(c.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(c.updBy,              entity.getUpdBy());              hasAny = true; }
        if (entity.getUpdDate()            != null) { update.set(c.updDate,            entity.getUpdDate());            hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.settleConfigId.eq(entity.getSettleConfigId())).execute();
        return (int) affected;
    }
}
