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
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(mbMemberGroup.memberGroupId, search.getMemberGroupId()));
        wheres.add(QdslUtil.strEq(mbMemberGroup.useYn, search.getUseYn()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(mbMemberGroup.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(mbMemberGroup.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<MbMemberGroupDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres.toArray(BooleanExpression[]::new))
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
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
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbMemberGroup.memberGroupId, search.getMemberGroupId()));
        whereList.add(QdslUtil.strEq(mbMemberGroup.useYn, search.getUseYn()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(mbMemberGroup.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(mbMemberGroup.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberGroupDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberGroupDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberGroup.count())
                .where(wheres)
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbMemberGroup.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberGroup.memberGroupId.eq(entity.getMemberGroupId())).execute();
    }
}
