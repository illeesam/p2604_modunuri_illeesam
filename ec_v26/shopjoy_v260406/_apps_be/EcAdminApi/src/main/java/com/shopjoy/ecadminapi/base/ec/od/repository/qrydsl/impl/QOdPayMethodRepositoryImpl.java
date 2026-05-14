package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdPayMethodRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdPayMethod QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdPayMethodRepositoryImpl implements QOdPayMethodRepository {

    private final JPAQueryFactory queryFactory;
    private static final QOdPayMethod m   = QOdPayMethod.odPayMethod;
    private static final QMbMember    mem = new QMbMember("mem");
    private static final QSyCode      cdPm = new QSyCode("cd_pm");

    @Override
    public Optional<OdPayMethodDto.Item> selectById(String payMethodId) {
        OdPayMethodDto.Item dto = baseListQuery()
                .where(m.payMethodId.eq(payMethodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<OdPayMethodDto.Item> selectList(OdPayMethodDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayMethodDto.Item> query = baseListQuery().where(where);
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

    @Override
    public OdPayMethodDto.PageResponse selectPageList(OdPayMethodDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayMethodDto.Item> query = baseListQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdPayMethodDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(m.count())
                .from(m)
                .where(where)
                .fetchOne();

        OdPayMethodDto.PageResponse res = new OdPayMethodDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지/단건 공용 base query (DTO Item에 별칭 컬럼 없음 - 기본 필드만 매핑) */
    private JPAQuery<OdPayMethodDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdPayMethodDto.Item.class,
                        m.payMethodId, m.memberId, m.payMethodTypeCd, m.payMethodNm,
                        m.payMethodAlias, m.payKeyNo, m.mainMethodYn,
                        m.regBy, m.regDate, m.updBy, m.updDate
                ))
                .from(m)
                .leftJoin(mem).on(mem.memberId.eq(m.memberId))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(m.payMethodTypeCd)));
    }

    private BooleanBuilder buildCondition(OdPayMethodDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getPayMethodId())) w.and(m.payMethodId.eq(s.getPayMethodId()));

        // searchValue + searchTypes
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = s.getSearchTypes();
            boolean all = !StringUtils.hasText(types);
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains("def_pay_method_nm")) or.or(m.payMethodNm.likeIgnoreCase(pattern));
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
                    w.and(m.regDate.goe(start)).and(m.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(m.updDate.goe(start)).and(m.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(OdPayMethodDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, m.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("payMethodId".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.payMethodId));
                } else if ("payMethodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.payMethodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(OdPayMethod entity) {
        if (entity.getPayMethodId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;

        if (entity.getMemberId()        != null) { update.set(m.memberId,        entity.getMemberId());        hasAny = true; }
        if (entity.getPayMethodTypeCd() != null) { update.set(m.payMethodTypeCd, entity.getPayMethodTypeCd()); hasAny = true; }
        if (entity.getPayMethodNm()     != null) { update.set(m.payMethodNm,     entity.getPayMethodNm());     hasAny = true; }
        if (entity.getPayMethodAlias()  != null) { update.set(m.payMethodAlias,  entity.getPayMethodAlias());  hasAny = true; }
        if (entity.getPayKeyNo()        != null) { update.set(m.payKeyNo,        entity.getPayKeyNo());        hasAny = true; }
        if (entity.getMainMethodYn()    != null) { update.set(m.mainMethodYn,    entity.getMainMethodYn());    hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(m.updBy,           entity.getUpdBy());           hasAny = true; }
        if (entity.getUpdDate()         != null) { update.set(m.updDate,         entity.getUpdDate());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(m.payMethodId.eq(entity.getPayMethodId())).execute();
        return (int) affected;
    }
}
