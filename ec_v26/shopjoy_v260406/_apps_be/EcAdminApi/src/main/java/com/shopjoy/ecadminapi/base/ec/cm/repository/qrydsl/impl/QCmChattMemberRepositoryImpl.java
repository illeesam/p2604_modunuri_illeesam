package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
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
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmChattMember(채팅 참여자) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattMemberRepositoryImpl implements QCmChattMemberRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmChattMemberRepositoryImpl";
    private static final QCmChattMember cmChattMember = QCmChattMember.cmChattMember;

    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값 (DDL 컬럼 코멘트 기준, sy_code 미등록)
     * MEMBER_TYPE_CD  {MEMBER: '고객회원', ADMIN: '관리자'}
     */
    private JPAQuery<CmChattMemberDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmChattMemberDto.Item.class,
                        cmChattMember.chattMemberId, // 참여자ID (PK, YYMMDDhhmmss+rand4)
                        cmChattMember.chattId,       // 채팅방ID (cm_chatt.chatt_id)
                        cmChattMember.memberTypeCd,  // 참여자유형 — MEMBER_TYPE_CD {MEMBER: '고객회원', ADMIN: '관리자'}
                        cmChattMember.refId,         // 참조ID (mb_member.member_id 또는 sy_user.user_id)
                        cmChattMember.refNm,         // 참여자명 (비정규화 캐시)
                        cmChattMember.unreadCnt,     // 미읽음 메시지 수
                        cmChattMember.joinDate,      // 참여일시
                        cmChattMember.leaveDate,     // 퇴장일시 (NULL=현재 참여중)
                        cmChattMember.regBy,         // 등록자
                        cmChattMember.regDate,       // 등록일시
                        cmChattMember.updBy,         // 수정자
                        cmChattMember.updDate        // 수정일시
                ))
                .from(cmChattMember);
    }

    @Override
    public Optional<CmChattMemberDto.Item> selectById(String chattMemberId) {
        CmChattMemberDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmChattMember.chattMemberId.eq(chattMemberId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    @Override
    public List<CmChattMemberDto.Item> selectList(CmChattMemberDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmChattMember.chattId, search.getChattId()));
        whereList.add(QdslUtil.strEq(cmChattMember.memberTypeCd, search.getMemberTypeCd()));
        whereList.add(QdslUtil.strEq(cmChattMember.refId, search.getRefId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmChattMemberDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long) (pageNo - 1) * pageSize).limit(pageSize);
        }
        List<CmChattMemberDto.Item> list = query.fetch();
        return list;
    }

    @Override
    public BasePage<CmChattMemberDto.Item> selectPageData(CmChattMemberDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmChattMember.chattId, search.getChattId()));
        whereList.add(QdslUtil.strEq(cmChattMember.memberTypeCd, search.getMemberTypeCd()));
        whereList.add(QdslUtil.strEq(cmChattMember.refId, search.getRefId()));

        JPAQuery<CmChattMemberDto.Item> base = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmChattMemberDto.Item> pageList = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset((long) (pageNo - 1) * pageSize).limit(pageSize)
                .fetch();

        Long pageTotalCount = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmChattMember.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmChattMemberDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of(),
        new OrderSpecifier<>(Order.ASC, cmChattMember.chattMemberId));
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
