package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSave;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveItemRepository;
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

/** PmSaveItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveItemRepositoryImpl implements QPmSaveItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmSaveItem i    = QPmSaveItem.pmSaveItem;
    private static final QPmSave     sav  = QPmSave.pmSave;
    private static final QSySite     ste  = QSySite.sySite;
    private static final QSyCode     cdSit = new QSyCode("cd_sit");

    private JPAQuery<PmSaveItemDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveItemDto.Item.class,
                        i.saveItemId, i.saveId, i.siteId, i.targetTypeCd, i.targetId,
                        i.regBy, i.regDate,
                        ste.siteNm.as("siteNm"),
                        cdSit.codeLabel.as("targetTypeCdNm")
                ))
                .from(i)
                .leftJoin(sav).on(sav.saveId.eq(i.saveId))
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SAVE_ITEM_TARGET").and(cdSit.codeValue.eq(i.targetTypeCd)));
    }

    @Override
    public Optional<PmSaveItemDto.Item> selectById(String saveItemId) {
        PmSaveItemDto.Item dto = baseQuery()
                .where(i.saveItemId.eq(saveItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmSaveItemDto.Item> selectList(PmSaveItemDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveItemDto.Item> query = baseQuery().where(where);
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
    public PmSaveItemDto.PageResponse selectPageList(PmSaveItemDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveItemDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmSaveItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(where)
                .fetchOne();

        PmSaveItemDto.PageResponse res = new PmSaveItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanBuilder buildCondition(PmSaveItemDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(i.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getSaveItemId())) w.and(i.saveItemId.eq(s.getSaveItemId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
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
    private List<OrderSpecifier<?>> buildOrder(PmSaveItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
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
                if ("saveItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.saveItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PmSaveItem entity) {
        if (entity.getSaveItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getSaveId()       != null) { update.set(i.saveId,       entity.getSaveId());       hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(i.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(i.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(i.targetId,     entity.getTargetId());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(i.saveItemId.eq(entity.getSaveItemId())).execute();
        return (int) affected;
    }
}
