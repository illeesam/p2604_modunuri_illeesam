package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QMbDeviceTokenRepositoryImpl implements QMbDeviceTokenRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbDeviceToken t   = QMbDeviceToken.mbDeviceToken;
    private static final QMbMember      mem = QMbMember.mbMember;

    @Override
    public Optional<MbDeviceTokenDto.Item> selectById(String deviceTokenId) {
        return Optional.ofNullable(baseQuery().where(t.deviceTokenId.eq(deviceTokenId)).fetchOne());
    }

    @Override
    public List<MbDeviceTokenDto.Item> selectList(MbDeviceTokenDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbDeviceTokenDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    @Override
    public MbDeviceTokenDto.PageResponse selectPageList(MbDeviceTokenDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbDeviceTokenDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbDeviceTokenDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(t.count()).from(t).where(where).fetchOne();

        MbDeviceTokenDto.PageResponse res = new MbDeviceTokenDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<MbDeviceTokenDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbDeviceTokenDto.Item.class,
                        t.deviceTokenId, t.deviceToken, t.siteId, t.memberId,
                        t.osType, t.benefitNotiYn, t.alimReadDate,
                        t.regBy, t.regDate, t.updBy, t.updDate,
                        mem.memberNm.as("memberNm")
                ))
                .from(t)
                .leftJoin(mem).on(mem.memberId.eq(t.memberId));
    }

    private BooleanBuilder buildCondition(MbDeviceTokenDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getSiteId()))        w.and(t.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDeviceTokenId())) w.and(t.deviceTokenId.eq(s.getDeviceTokenId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(t.regDate.goe(start)).and(t.regDate.lt(endExcl)); break;
                case "upd_date": w.and(t.updDate.goe(start)).and(t.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(MbDeviceTokenDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, t.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("deviceTokenId".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.deviceTokenId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, t.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(MbDeviceToken entity) {
        if (entity.getDeviceTokenId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(t);
        boolean hasAny = false;
        if (entity.getDeviceToken()   != null) { update.set(t.deviceToken,   entity.getDeviceToken());   hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(t.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOsType()        != null) { update.set(t.osType,        entity.getOsType());        hasAny = true; }
        if (entity.getBenefitNotiYn() != null) { update.set(t.benefitNotiYn, entity.getBenefitNotiYn()); hasAny = true; }
        if (entity.getAlimReadDate()  != null) { update.set(t.alimReadDate,  entity.getAlimReadDate());  hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(t.updBy,         entity.getUpdBy());         hasAny = true; }
        if (entity.getUpdDate()       != null) { update.set(t.updDate,       entity.getUpdDate());       hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(t.deviceTokenId.eq(entity.getDeviceTokenId())).execute();
    }
}
