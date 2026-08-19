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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbs;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyBbs(게시물) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBbsRepositoryImpl implements QSyBbsRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyBbsRepositoryImpl";
    private static final QSyBbs syBbs = QSyBbs.syBbs;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * BBS_STATUS_CD (sy_code 미등록, DDL 주석 기준) {ACTIVE: '정상', DELETED: '삭제됨', HIDDEN: '숨김'}
     * IS_FIXED {Y: '상단고정', N: '일반'}
     */
    private JPAQuery<SyBbsDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyBbsDto.Item.class,
                        syBbs.bbsId,          // 게시물ID (YYMMDDhhmmss+rand4)
                        syBbs.bbmId,          // 게시판ID
                        syBbs.parentBbsId,    // 부모게시물ID (답글)
                        syBbs.memberId,       // 작성자 회원ID
                        syBbs.authorNm,       // 작성자명
                        syBbs.bbsTitle,       // 제목
                        syBbs.contentHtml,    // 내용 (HTML)
                        syBbs.viewCount,      // 조회수
                        syBbs.likeCount,      // 좋아요수
                        syBbs.commentCount,   // 댓글수
                        syBbs.isFixed,        // 상단고정 — IS_FIXED {Y: '상단고정', N: '일반'}
                        syBbs.bbsStatusCd,    // 상태 — BBS_STATUS_CD {ACTIVE: '정상', DELETED: '삭제됨', HIDDEN: '숨김'}
                        syBbs.pathId,         // 점(.) 구분 표시경로 (트리 빌드용)
                        syBbs.regBy,          // 등록자
                        syBbs.regDate,        // 등록일시
                        syBbs.updBy,          // 수정자
                        syBbs.updDate        // 수정일시
                ))
                .from(syBbs);
    }

    /* 게시판 게시물 키조회 */
    @Override
    public Optional<SyBbsDto.Item> selectById(String bbsId) {
        SyBbsDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syBbs.bbsId.eq(bbsId)).fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 게시판 게시물 목록조회 */
    @Override
    public List<SyBbsDto.Item> selectList(SyBbsDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syBbs.bbsId, search.getBbsId()));
        whereList.add(QdslUtil.strEq(syBbs.bbmId, search.getBbmId()));
        whereList.add(QdslUtil.strEq(syBbs.bbsStatusCd, search.getStatus()));
        whereList.add(andDateRangeBetween(search));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyBbsDto.Item> query = baseSelColumnQuery()
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
        List<SyBbsDto.Item> list = query.fetch();
        return list;
    }

    /* 게시판 게시물 페이지조회 */
    @Override
    public BasePage<SyBbsDto.Item> selectPageData(SyBbsDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syBbs.bbsId, search.getBbsId()));
        whereList.add(QdslUtil.strEq(syBbs.bbmId, search.getBbmId()));
        whereList.add(QdslUtil.strEq(syBbs.bbsStatusCd, search.getStatus()));
        whereList.add(andDateRangeBetween(search));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyBbsDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyBbsDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syBbs.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyBbsDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    /* 등록일(regDate) 기간 검색 — dateRangeStart/dateRangeEnd (yyyy-MM-dd) 포함 범위 */
    private BooleanExpression andDateRangeBetween(SyBbsDto.Request search) {
        if (search == null) return null;
        BooleanExpression expr = null;
        if (StringUtils.hasText(search.getDateRangeStart())) {
            LocalDateTime from = LocalDate.parse(search.getDateRangeStart(), DF).atTime(0, 0, 0, 0);
            expr = syBbs.regDate.goe(from);
        }
        if (StringUtils.hasText(search.getDateRangeEnd())) {
            /* 23:59:59.999999(나노초까지) — SQL 로그에 검색한 날짜 그대로 찍히면서도(QdslUtil.dateBetween 과 동일 패턴)
             * 리터럴 23:59:59(초 단위)처럼 서브초 데이터를 놓치지 않는다 */
            LocalDateTime to = LocalDate.parse(search.getDateRangeEnd(), DF).atTime(23, 59, 59, 999_999_999);
            BooleanExpression toExpr = syBbs.regDate.loe(to);
            expr = expr == null ? toExpr : expr.and(toExpr);
        }
        return expr;
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("authorNm", syBbs.authorNm),
            QdslUtil.FieldDef.like("bbmId", syBbs.bbmId),
            QdslUtil.FieldDef.like("bbsId", syBbs.bbsId),
            QdslUtil.FieldDef.like("bbsStatusCd", syBbs.bbsStatusCd),
            QdslUtil.FieldDef.like("bbsTitle", syBbs.bbsTitle),
            QdslUtil.FieldDef.like("contentHtml", syBbs.contentHtml),
            QdslUtil.FieldDef.like("isFixed", syBbs.isFixed),
            QdslUtil.FieldDef.like("memberId", syBbs.memberId),
            QdslUtil.FieldDef.like("parentBbsId", syBbs.parentBbsId),
            QdslUtil.FieldDef.like("pathId", syBbs.pathId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("bbsId", syBbs.bbsId,
                   "authorNm", syBbs.authorNm,
                   "regDate", syBbs.regDate),
        new OrderSpecifier<>(Order.DESC, syBbs.regDate),
        new OrderSpecifier<>(Order.ASC, syBbs.bbsId));
    }

    /* 게시판 게시물 수정 */
    @Override
    public int updateSelective(SyBbs entity) {
        if (entity.getBbsId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syBbs);
        boolean hasAny = false;

        if (entity.getBbmId()        != null) { update.set(syBbs.bbmId,        entity.getBbmId());        hasAny = true; }
        if (entity.getParentBbsId()  != null) { update.set(syBbs.parentBbsId,  entity.getParentBbsId());  hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(syBbs.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getAuthorNm()     != null) { update.set(syBbs.authorNm,     entity.getAuthorNm());     hasAny = true; }
        if (entity.getBbsTitle()     != null) { update.set(syBbs.bbsTitle,     entity.getBbsTitle());     hasAny = true; }
        if (entity.getContentHtml()  != null) { update.set(syBbs.contentHtml,  entity.getContentHtml());  hasAny = true; }
        if (entity.getViewCount()    != null) { update.set(syBbs.viewCount,    entity.getViewCount());    hasAny = true; }
        if (entity.getLikeCount()    != null) { update.set(syBbs.likeCount,    entity.getLikeCount());    hasAny = true; }
        if (entity.getCommentCount() != null) { update.set(syBbs.commentCount, entity.getCommentCount()); hasAny = true; }
        if (entity.getIsFixed()      != null) { update.set(syBbs.isFixed,      entity.getIsFixed());      hasAny = true; }
        if (entity.getBbsStatusCd()  != null) { update.set(syBbs.bbsStatusCd,  entity.getBbsStatusCd());  hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syBbs.updBy,        entity.getUpdBy());        hasAny = true; }
        update.set(syBbs.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()       != null) { update.set(syBbs.pathId,       entity.getPathId());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(syBbs.bbsId.eq(entity.getBbsId())).execute();
        return (int) affected;
    }
}
