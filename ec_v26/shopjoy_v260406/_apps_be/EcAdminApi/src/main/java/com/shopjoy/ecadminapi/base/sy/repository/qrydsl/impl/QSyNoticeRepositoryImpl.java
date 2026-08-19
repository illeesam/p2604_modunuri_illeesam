package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyNotice;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyNoticeRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyNotice QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyNoticeRepositoryImpl implements QSyNoticeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyNoticeRepositoryImpl";
    private static final QSyNotice syNotice = QSyNotice.syNotice;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * NOTICE_TYPE     {NORMAL: '일반', URGENT: '긴급'}
     * NOTICE_STATUS_CD (sy_code 미등록, DDL 주석 기준) {ACTIVE: '활성', INACTIVE: '비활성'}
     * IS_FIXED        {Y: '상단고정', N: '일반'}
     */
    private JPAQuery<SyNoticeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyNoticeDto.Item.class,
                        syNotice.noticeId,        // 공지ID (YYMMDDhhmmss+rand4)
                        syNotice.noticeTitle,     // 제목
                        syNotice.noticeTypeCd,    // 공지유형 — NOTICE_TYPE {NORMAL: '일반', URGENT: '긴급'}
                        syNotice.isFixed,         // 상단고정 — IS_FIXED {Y: '상단고정', N: '일반'}
                        syNotice.contentHtml,     // 내용 (HTML)
                        syNotice.startDate,       // 노출시작일
                        syNotice.endDate,         // 노출종료일
                        syNotice.noticeStatusCd,  // 상태 — NOTICE_STATUS_CD {ACTIVE: '활성', INACTIVE: '비활성'}
                        syNotice.viewCount,       // 조회수
                        syNotice.regBy,           // 등록자
                        syNotice.regDate,         // 등록일시
                        syNotice.updBy,           // 수정자
                        syNotice.updDate         // 수정일시
                ))
                .from(syNotice);
    }

    /* 공지사항 키조회 */
    @Override
    public Optional<SyNoticeDto.Item> selectById(String noticeId) {
        SyNoticeDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syNotice.noticeId.eq(noticeId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 공지사항 목록조회 */
    @Override
    public List<SyNoticeDto.Item> selectList(SyNoticeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syNotice.noticeId, search.getNoticeId()));
        whereList.add(QdslUtil.strEq(syNotice.noticeStatusCd, search.getStatus()));
        whereList.add(QdslUtil.strEq(syNotice.noticeTypeCd, search.getNoticeTypeCd()));
        whereList.add(QdslUtil.strEq(syNotice.isFixed, search.getIsFixed()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyNoticeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 공지사항 페이지조회 */
    @Override
    public BasePage<SyNoticeDto.Item> selectPageData(SyNoticeDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syNotice.noticeId, search.getNoticeId()));
        whereList.add(QdslUtil.strEq(syNotice.noticeStatusCd, search.getStatus()));
        whereList.add(QdslUtil.strEq(syNotice.noticeTypeCd, search.getNoticeTypeCd()));
        whereList.add(QdslUtil.strEq(syNotice.isFixed, search.getIsFixed()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyNoticeDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyNoticeDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syNotice.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyNoticeDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("contentHtml", syNotice.contentHtml),
            QdslUtil.FieldDef.like("isFixed", syNotice.isFixed),
            QdslUtil.FieldDef.like("noticeId", syNotice.noticeId),
            QdslUtil.FieldDef.like("noticeStatusCd", syNotice.noticeStatusCd),
            QdslUtil.FieldDef.like("noticeTitle", syNotice.noticeTitle),
            QdslUtil.FieldDef.like("noticeTypeCd", syNotice.noticeTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("noticeId", syNotice.noticeId,
                   "noticeTitle", syNotice.noticeTitle,
                   "regDate", syNotice.regDate),
        new OrderSpecifier<>(Order.DESC, syNotice.regDate),
        new OrderSpecifier<>(Order.ASC, syNotice.noticeId));
    }

    /* 공지사항 수정 */
    @Override
    public int updateSelective(SyNotice entity) {
        if (entity.getNoticeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syNotice);
        boolean hasAny = false;

        if (entity.getNoticeTitle()    != null) { update.set(syNotice.noticeTitle,    entity.getNoticeTitle());    hasAny = true; }
        if (entity.getNoticeTypeCd()   != null) { update.set(syNotice.noticeTypeCd,   entity.getNoticeTypeCd());   hasAny = true; }
        if (entity.getIsFixed()        != null) { update.set(syNotice.isFixed,        entity.getIsFixed());        hasAny = true; }
        if (entity.getContentHtml()    != null) { update.set(syNotice.contentHtml,    entity.getContentHtml());    hasAny = true; }
        if (entity.getStartDate()      != null) { update.set(syNotice.startDate,      entity.getStartDate());      hasAny = true; }
        if (entity.getEndDate()        != null) { update.set(syNotice.endDate,        entity.getEndDate());        hasAny = true; }
        if (entity.getNoticeStatusCd() != null) { update.set(syNotice.noticeStatusCd, entity.getNoticeStatusCd()); hasAny = true; }
        if (entity.getViewCount()      != null) { update.set(syNotice.viewCount,      entity.getViewCount());      hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(syNotice.updBy,          entity.getUpdBy());          hasAny = true; }
        update.set(syNotice.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syNotice.noticeId.eq(entity.getNoticeId())).execute();
        return (int) affected;
    }
}
