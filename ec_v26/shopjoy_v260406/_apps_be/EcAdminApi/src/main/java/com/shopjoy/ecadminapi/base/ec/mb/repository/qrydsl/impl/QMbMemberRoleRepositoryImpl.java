package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRoleRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QMbMemberRoleRepositoryImpl implements QMbMemberRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbMemberRole r   = QMbMemberRole.mbMemberRole;
    private static final QMbMember     mem = QMbMember.mbMember;
    private static final QSyRole       rol = QSyRole.syRole;
    private static final QSyUser       gu  = new QSyUser("gu");

    /* 회원 역할 연결 키조회 */
    @Override
    public Optional<MbMemberRoleDto.Item> selectById(String memberRoleId) {
        return Optional.ofNullable(baseQuery().where(r.memberRoleId.eq(memberRoleId)).fetchOne());
    }

    /* 회원 역할 연결 목록조회 */
    @Override
    public List<MbMemberRoleDto.Item> selectList(MbMemberRoleDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberRoleDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 회원 역할 연결 페이지조회 */
    @Override
    public MbMemberRoleDto.PageResponse selectPageList(MbMemberRoleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberRoleDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberRoleDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(where).fetchOne();

        MbMemberRoleDto.PageResponse res = new MbMemberRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 회원 역할 연결 baseQuery */
    private JPAQuery<MbMemberRoleDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberRoleDto.Item.class,
                        r.memberRoleId, r.memberId, r.roleId, r.grantUserId,
                        r.grantDate, r.validFrom, r.validTo, r.memberRoleRemark,
                        r.regBy, r.regDate, r.updBy, r.updDate,
                        mem.memberNm.as("memberNm"),
                        rol.roleNm.as("roleNm"),
                        gu.userNm.as("grantUserNm")
                ))
                .from(r)
                .leftJoin(mem).on(mem.memberId.eq(r.memberId))
                .leftJoin(rol).on(rol.roleId.eq(r.roleId))
                .leftJoin(gu).on(gu.userId.eq(r.grantUserId));
    }

    /* 회원 역할 연결 buildCondition */
    private BooleanBuilder buildCondition(MbMemberRoleDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getMemberRoleId())) w.and(r.memberRoleId.eq(s.getMemberRoleId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl)); break;
                case "upd_date": w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberRoleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.memberRoleId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        return orders;
    }

    /* 회원 역할 연결 수정 */
    @Override
    public int updateSelective(MbMemberRole entity) {
        if (entity.getMemberRoleId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;
        if (entity.getMemberId()         != null) { update.set(r.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getRoleId()           != null) { update.set(r.roleId,           entity.getRoleId());           hasAny = true; }
        if (entity.getGrantUserId()      != null) { update.set(r.grantUserId,      entity.getGrantUserId());      hasAny = true; }
        if (entity.getGrantDate()        != null) { update.set(r.grantDate,        entity.getGrantDate());        hasAny = true; }
        if (entity.getValidFrom()        != null) { update.set(r.validFrom,        entity.getValidFrom());        hasAny = true; }
        if (entity.getValidTo()          != null) { update.set(r.validTo,          entity.getValidTo());          hasAny = true; }
        if (entity.getMemberRoleRemark() != null) { update.set(r.memberRoleRemark, entity.getMemberRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(r.updBy,            entity.getUpdBy());            hasAny = true; }
        if (entity.getUpdDate()          != null) { update.set(r.updDate,          entity.getUpdDate());          hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(r.memberRoleId.eq(entity.getMemberRoleId())).execute();
    }
}
