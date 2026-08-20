package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogReplyRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmBlogReply(블로그 댓글) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogReplyRepositoryImpl implements QCmBlogReplyRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogReplyRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QCmBlogReply cmBlogReply = QCmBlogReply.cmBlogReply;    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값 (sy_code_grp COMMENT_STATUS)
     * COMMENT_STATUS  {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
     */
    private JPAQuery<CmBlogReplyDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogReplyDto.Item.class,
                        cmBlogReply.blogReplyId,             // 댓글ID (PK)
                        cmBlogReply.blogId,                 // 블로그ID
                        cmBlogReply.parentCommentId,         // 대댓글 부모ID
                        cmBlogReply.writerId,                // 작성자ID
                        cmBlogReply.writerNm,                // 작성자명
                        cmBlogReply.blogCommentContent,     // 댓글 내용
                        cmBlogReply.commentStatusCd,         // 상태 — COMMENT_STATUS {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
                        cmBlogReply.commentStatusCdBefore,  // 변경 전 댓글상태 — COMMENT_STATUS {ACTIVE: '정상', HIDDEN: '숨김', DELETED: '삭제'}
                        cmBlogReply.regBy,                   // 등록자
                        cmBlogReply.regDate,                 // 등록일시
                        cmBlogReply.updBy,                   // 수정자
                        cmBlogReply.updDate,                  // 수정일시
                        cmBlogReply.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(cmBlogReply)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(cmBlogReply.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(cmBlogReply.regBy)) // 등록자
                ;
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogReplyDto.Item> selectById(String blogReplyId) {
        CmBlogReplyDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogReply.blogReplyId.eq(blogReplyId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogReplyDto.Item> selectList(CmBlogReplyDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(cmBlogReply.blogId, search.getBlogIds()));
        whereList.add(QdslUtil.strEq(cmBlogReply.blogId, search.getBlogId()));
        whereList.add(QdslUtil.strEq(cmBlogReply.blogReplyId, search.getBlogReplyId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogReply.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogReply.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmBlogReplyDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<CmBlogReplyDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<CmBlogReplyDto.Item> selectPageData(CmBlogReplyDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(cmBlogReply.blogId, search.getBlogIds()));
        whereList.add(QdslUtil.strEq(cmBlogReply.blogId, search.getBlogId()));
        whereList.add(QdslUtil.strEq(cmBlogReply.blogReplyId, search.getBlogReplyId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogReply.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogReply.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<CmBlogReplyDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmBlogReplyDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogReply.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmBlogReplyDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("blogCommentContent", cmBlogReply.blogCommentContent),
            QdslUtil.FieldDef.like("blogId", cmBlogReply.blogId),
            QdslUtil.FieldDef.like("blogReplyId", cmBlogReply.blogReplyId),
            QdslUtil.FieldDef.like("commentStatusCd", cmBlogReply.commentStatusCd),
            QdslUtil.FieldDef.like("commentStatusCdBefore", cmBlogReply.commentStatusCdBefore),
            QdslUtil.FieldDef.like("parentCommentId", cmBlogReply.parentCommentId),
            QdslUtil.FieldDef.like("writerId", cmBlogReply.writerId),
            QdslUtil.FieldDef.like("writerNm", cmBlogReply.writerNm)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("blogReplyId", cmBlogReply.blogReplyId,
                   "writerNm",  cmBlogReply.writerNm,
                   "regDate",   cmBlogReply.regDate),
            new OrderSpecifier<>(Order.DESC, cmBlogReply.regDate),
            new OrderSpecifier<>(Order.ASC,  cmBlogReply.blogReplyId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogReply entity) {
        if (entity.getBlogReplyId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogReply);
        boolean hasAny = false;

        if (entity.getBlogId()                != null) { update.set(cmBlogReply.blogId,                entity.getBlogId());                hasAny = true; }
        if (entity.getParentCommentId()       != null) { update.set(cmBlogReply.parentCommentId,       entity.getParentCommentId());       hasAny = true; }
        if (entity.getWriterId()              != null) { update.set(cmBlogReply.writerId,              entity.getWriterId());              hasAny = true; }
        if (entity.getWriterNm()              != null) { update.set(cmBlogReply.writerNm,              entity.getWriterNm());              hasAny = true; }
        if (entity.getBlogCommentContent()    != null) { update.set(cmBlogReply.blogCommentContent,    entity.getBlogCommentContent());    hasAny = true; }
        if (entity.getCommentStatusCd()       != null) { update.set(cmBlogReply.commentStatusCd,       entity.getCommentStatusCd());       hasAny = true; }
        if (entity.getCommentStatusCdBefore() != null) { update.set(cmBlogReply.commentStatusCdBefore, entity.getCommentStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(cmBlogReply.updBy,                 entity.getUpdBy());                 hasAny = true; }
        update.set(cmBlogReply.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlogReply.blogReplyId.eq(entity.getBlogReplyId())).execute();
        return (int) affected;
    }
}
