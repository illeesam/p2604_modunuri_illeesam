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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGroupRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbMemberGroupRepositoryImpl implements QMbMemberGroupRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberGroupRepositoryImpl";
    private static final QMbMemberGroup mbMemberGroup   = QMbMemberGroup.mbMemberGroup;
    private static final QSySite        sySite = QSySite.sySite;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN  {Y: '사용', N: '미사용'}
     */
    private JPAQuery<MbMemberGroupDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberGroupDto.Item.class,
                        mbMemberGroup.memberGroupId,   // 그룹ID (PK)
                        mbMemberGroup.groupNm,         // 그룹명
                        mbMemberGroup.groupMemo,       // 메모
                        mbMemberGroup.useYn,           // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        mbMemberGroup.regBy,           // 등록자ID
                        mbMemberGroup.regDate,         // 등록일시
                        mbMemberGroup.updBy,           // 수정자ID
                        mbMemberGroup.updDate          // 수정일시
                ))
                .from(mbMemberGroup);
    }

    /* 회원 그룹 키조회 */
    @Override
    public Optional<MbMemberGroupDto.Item> selectById(String memberGroupId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberGroup.memberGroupId.eq(memberGroupId)).fetchOne());
    }

    /* 회원 그룹 목록조회 */
    @Override
    public List<MbMemberGroupDto.Item> selectList(MbMemberGroupDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(mbMemberGroup.memberGroupId, search.getMemberGroupId()));
        wheres.add(QdslUtil.strEq(mbMemberGroup.useYn, search.getUseYn()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberGroup.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberGroup.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MbMemberGroupDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres2)
                .orderBy(orders);
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 회원 그룹 페이지조회 */
    @Override
    public BasePage<MbMemberGroupDto.Item> selectPageData(MbMemberGroupDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(mbMemberGroup.memberGroupId, search.getMemberGroupId()));
        wheres.add(QdslUtil.strEq(mbMemberGroup.useYn, search.getUseYn()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberGroup.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberGroup.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);

        JPAQuery<MbMemberGroupDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MbMemberGroupDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberGroup.count())
                .where(wheres2)
                .fetchOne();

        BasePage<MbMemberGroupDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "groupNm" (Entity 필드명) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("groupMemo", mbMemberGroup.groupMemo),
            QdslUtil.FieldDef.like("groupNm", mbMemberGroup.groupNm),
            QdslUtil.FieldDef.like("memberGroupId", mbMemberGroup.memberGroupId),
            QdslUtil.FieldDef.like("useYn", mbMemberGroup.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("memberGroupId", mbMemberGroup.memberGroupId,
                   "groupNm", mbMemberGroup.groupNm,
                   "regDate", mbMemberGroup.regDate),
        new OrderSpecifier<>(Order.DESC, mbMemberGroup.regDate),
        new OrderSpecifier<>(Order.ASC, mbMemberGroup.memberGroupId));
    }

    /* 회원 그룹 수정 */
    @Override
    public int updateSelective(MbMemberGroup entity) {
        if (entity.getMemberGroupId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberGroup);
        boolean hasAny = false;
        if (entity.getGroupNm()   != null) { update.set(mbMemberGroup.groupNm,   entity.getGroupNm());   hasAny = true; }
        if (entity.getGroupMemo() != null) { update.set(mbMemberGroup.groupMemo, entity.getGroupMemo()); hasAny = true; }
        if (entity.getUseYn()     != null) { update.set(mbMemberGroup.useYn,     entity.getUseYn());     hasAny = true; }
        if (entity.getUpdBy()     != null) { update.set(mbMemberGroup.updBy,     entity.getUpdBy());     hasAny = true; }
        update.set(mbMemberGroup.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberGroup.memberGroupId.eq(entity.getMemberGroupId())).execute();
    }
}
