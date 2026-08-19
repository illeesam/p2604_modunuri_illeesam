package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRoleRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbMemberRoleRepositoryImpl implements QMbMemberRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberRoleRepositoryImpl";
    private static final QMbMemberRole mbMemberRole   = QMbMemberRole.mbMemberRole;
    private static final QMbMember     mbMember = QMbMember.mbMember;
    private static final QSyRole       syRole = QSyRole.syRole;
    private static final QSyUser       gu  = new QSyUser("gu");    /* 회원 역할 연결 baseSelColumnQuery — 코드성 필드 없음 (역할/일자 위주) */
    private JPAQuery<MbMemberRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberRoleDto.Item.class,
                        mbMemberRole.memberRoleId,      // PK
                        mbMemberRole.memberId,          // 회원 ID (mb_member.member_id)
                        mbMemberRole.roleId,            // 역할 ID (sy_role.role_id)
                        mbMemberRole.grantUserId,       // 권한 부여 관리자 ID
                        mbMemberRole.grantDate,         // 권한 부여 일시
                        mbMemberRole.validFrom,         // 유효 시작일
                        mbMemberRole.validTo,           // 유효 종료일
                        mbMemberRole.memberRoleRemark,  // 비고
                        mbMemberRole.regBy,             // 등록자
                        mbMemberRole.regDate,           // 등록일
                        mbMemberRole.updBy,             // 수정자
                        mbMemberRole.updDate,           // 수정일
                        mbMember.memberNm.as("memberNm"),     // 회원명 (mb_member 조인)
                        syRole.roleNm.as("roleNm"),           // 역할명 (sy_role 조인)
                        gu.userNm.as("grantUserNm")           // 권한 부여 관리자명 (sy_user 조인, 별칭 gu)
                ))
                .from(mbMemberRole)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbMemberRole.memberId)) // 회원
                .leftJoin(syRole).on(syRole.roleId.eq(mbMemberRole.roleId)) // 역할
                .leftJoin(gu).on(gu.userId.eq(mbMemberRole.grantUserId)) // 사용자
                ;
    }

    /* 회원 역할 연결 키조회 */
    @Override
    public Optional<MbMemberRoleDto.Item> selectById(String memberRoleId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberRole.memberRoleId.eq(memberRoleId)).fetchOne());
    }

    /* 회원 역할 연결 목록조회 */
    @Override
    public List<MbMemberRoleDto.Item> selectList(MbMemberRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbMemberRole.memberRoleId, search.getMemberRoleId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MbMemberRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<MbMemberRoleDto.Item> list = query.fetch();
        return list;
    }

    /* 회원 역할 연결 페이지조회 */
    @Override
    public BasePage<MbMemberRoleDto.Item> selectPageData(MbMemberRoleDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbMemberRole.memberRoleId, search.getMemberRoleId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberRole.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberRole.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<MbMemberRoleDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MbMemberRoleDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberRole.count())
                .where(wheres)
                .fetchOne();

        BasePage<MbMemberRoleDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("grantUserId", mbMemberRole.grantUserId),
            QdslUtil.FieldDef.like("memberId", mbMemberRole.memberId),
            QdslUtil.FieldDef.like("memberRoleId", mbMemberRole.memberRoleId),
            QdslUtil.FieldDef.like("memberRoleRemark", mbMemberRole.memberRoleRemark),
            QdslUtil.FieldDef.like("roleId", mbMemberRole.roleId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("memberRoleId", mbMemberRole.memberRoleId,
                   "regDate", mbMemberRole.regDate),
        new OrderSpecifier<>(Order.DESC, mbMemberRole.regDate),
        new OrderSpecifier<>(Order.ASC, mbMemberRole.memberRoleId));
    }

    /* 회원 역할 연결 수정 */
    @Override
    public int updateSelective(MbMemberRole entity) {
        if (entity.getMemberRoleId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberRole);
        boolean hasAny = false;
        if (entity.getMemberId()         != null) { update.set(mbMemberRole.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getRoleId()           != null) { update.set(mbMemberRole.roleId,           entity.getRoleId());           hasAny = true; }
        if (entity.getGrantUserId()      != null) { update.set(mbMemberRole.grantUserId,      entity.getGrantUserId());      hasAny = true; }
        if (entity.getGrantDate()        != null) { update.set(mbMemberRole.grantDate,        entity.getGrantDate());        hasAny = true; }
        if (entity.getValidFrom()        != null) { update.set(mbMemberRole.validFrom,        entity.getValidFrom());        hasAny = true; }
        if (entity.getValidTo()          != null) { update.set(mbMemberRole.validTo,          entity.getValidTo());          hasAny = true; }
        if (entity.getMemberRoleRemark() != null) { update.set(mbMemberRole.memberRoleRemark, entity.getMemberRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(mbMemberRole.updBy,            entity.getUpdBy());            hasAny = true; }
        update.set(mbMemberRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberRole.memberRoleId.eq(entity.getMemberRoleId())).execute();
    }
}
