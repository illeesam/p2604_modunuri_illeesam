package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMemberDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMember;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChattMember;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattMemberRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmChattMember QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattMemberRepositoryImpl implements QCmChattMemberRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmChattMemberRepositoryImpl";
    private static final QCmChattMember cmChattMember = QCmChattMember.cmChattMember;

    private JPAQuery<CmChattMemberDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmChattMemberDto.Item.class,
                        cmChattMember.chattMemberId, cmChattMember.siteId, cmChattMember.chattId,
                        cmChattMember.memberTypeCd, cmChattMember.refId, cmChattMember.refNm,
                        cmChattMember.unreadCnt, cmChattMember.joinDate, cmChattMember.leaveDate,
                        cmChattMember.regBy, cmChattMember.regDate, cmChattMember.updBy, cmChattMember.updDate
                ))
                .from(cmChattMember);
    }

    @Override
    public Optional<CmChattMemberDto.Item> selectById(String chattMemberId) {
        CmChattMemberDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmChattMember.chattMemberId.eq(chattMemberId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<CmChattMemberDto.Item> selectList(CmChattMemberDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmChattMemberDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                        QdslUtil.strEq(cmChattMember.siteId, search.getSiteId()),
                        QdslUtil.strEq(cmChattMember.chattId, search.getChattId()),
                        QdslUtil.strEq(cmChattMember.memberTypeCd, search.getMemberTypeCd()),
                        QdslUtil.strEq(cmChattMember.refId, search.getRefId())
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long) (pageNo - 1) * pageSize).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public CmChattMemberDto.PageResponse selectPageData(CmChattMemberDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(cmChattMember.siteId, search.getSiteId()),
                QdslUtil.strEq(cmChattMember.chattId, search.getChattId()),
                QdslUtil.strEq(cmChattMember.memberTypeCd, search.getMemberTypeCd()),
                QdslUtil.strEq(cmChattMember.refId, search.getRefId())
        };

        JPAQuery<CmChattMemberDto.Item> base = baseSelColumnQuery();

        List<CmChattMemberDto.Item> content = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset((long) (pageNo - 1) * pageSize).limit(pageSize)
                .fetch();

        Long total = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmChattMember.count())
                .where(wheres)
                .fetchOne();

        CmChattMemberDto.PageResponse res = new CmChattMemberDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmChattMemberDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        orders.add(new OrderSpecifier(Order.ASC, cmChattMember.joinDate));
        orders.add(new OrderSpecifier<>(Order.ASC, cmChattMember.chattMemberId));
        return orders;
    }

    @Override
    public int updateSelective(CmChattMember entity) {
        if (entity.getChattMemberId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmChattMember);
        boolean hasAny = false;

        if (entity.getRefNm()       != null) { update.set(cmChattMember.refNm,       entity.getRefNm());       hasAny = true; }
        if (entity.getUnreadCnt()   != null) { update.set(cmChattMember.unreadCnt,   entity.getUnreadCnt());   hasAny = true; }
        if (entity.getLeaveDate()   != null) { update.set(cmChattMember.leaveDate,   entity.getLeaveDate());   hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(cmChattMember.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(cmChattMember.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmChattMember.chattMemberId.eq(entity.getChattMemberId())).execute();
        return (int) affected;
    }
}
