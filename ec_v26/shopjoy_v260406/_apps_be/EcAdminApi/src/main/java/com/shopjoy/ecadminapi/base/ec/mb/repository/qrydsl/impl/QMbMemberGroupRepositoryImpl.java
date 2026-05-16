package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGroupRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QMbMemberGroupRepositoryImpl implements QMbMemberGroupRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbMemberGroup g   = QMbMemberGroup.mbMemberGroup;
    private static final QSySite        ste = QSySite.sySite;

    /* 회원 그룹 키조회 */
    @Override
    public Optional<MbMemberGroupDto.Item> selectById(String memberGroupId) {
        return Optional.ofNullable(baseQuery().where(g.memberGroupId.eq(memberGroupId)).fetchOne());
    }

    /* 회원 그룹 목록조회 */
    @Override
    public List<MbMemberGroupDto.Item> selectList(MbMemberGroupDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberGroupDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 회원 그룹 페이지조회 */
    @Override
    public MbMemberGroupDto.PageResponse selectPageList(MbMemberGroupDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberGroupDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberGroupDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(g.count()).from(g).where(where).fetchOne();

        MbMemberGroupDto.PageResponse res = new MbMemberGroupDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 회원 그룹 baseQuery */
    private JPAQuery<MbMemberGroupDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberGroupDto.Item.class,
                        g.memberGroupId, g.siteId, g.groupNm, g.groupMemo, g.useYn,
                        g.regBy, g.regDate, g.updBy, g.updDate
                ))
                .from(g)
                .leftJoin(ste).on(ste.siteId.eq(g.siteId));
    }

    /* searchType 사용 예  searchType = "groupNm" (Entity 필드명) */
    private BooleanBuilder buildCondition(MbMemberGroupDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getSiteId()))        w.and(g.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getMemberGroupId())) w.and(g.memberGroupId.eq(s.getMemberGroupId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",groupNm,")) or.or(g.groupNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(g.regDate.goe(start)).and(g.regDate.lt(endExcl)); break;
                case "upd_date": w.and(g.updDate.goe(start)).and(g.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberGroupDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, g.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberGroupId".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.memberGroupId));
                } else if ("groupNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.groupNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.regDate));
                }
            }
        }
        return orders;
    }

    /* 회원 그룹 수정 */
    @Override
    public int updateSelective(MbMemberGroup entity) {
        if (entity.getMemberGroupId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;
        if (entity.getSiteId()    != null) { update.set(g.siteId,    entity.getSiteId());    hasAny = true; }
        if (entity.getGroupNm()   != null) { update.set(g.groupNm,   entity.getGroupNm());   hasAny = true; }
        if (entity.getGroupMemo() != null) { update.set(g.groupMemo, entity.getGroupMemo()); hasAny = true; }
        if (entity.getUseYn()     != null) { update.set(g.useYn,     entity.getUseYn());     hasAny = true; }
        if (entity.getUpdBy()     != null) { update.set(g.updBy,     entity.getUpdBy());     hasAny = true; }
        if (entity.getUpdDate()   != null) { update.set(g.updDate,   entity.getUpdDate());   hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(g.memberGroupId.eq(entity.getMemberGroupId())).execute();
    }
}
