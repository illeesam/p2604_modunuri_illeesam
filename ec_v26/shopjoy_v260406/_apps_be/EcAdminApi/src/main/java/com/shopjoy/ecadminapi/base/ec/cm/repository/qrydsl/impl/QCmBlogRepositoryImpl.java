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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmBlog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogRepositoryImpl implements QCmBlogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogRepositoryImpl";
    private static final QCmBlog cmBlog = QCmBlog.cmBlog;    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값 (DDL 컬럼 코멘트 기준, sy_code 미등록)
     * BLOG_TYPE_CD  {NEWS: '뉴스', BLOG: '블로그'}
     * USE_YN        {Y: '공개', N: '비공개'}
     * IS_NOTICE     {Y: '공지(상단고정)', N: '일반'}
     */
    private JPAQuery<CmBlogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogDto.Item.class,
                        cmBlog.blogId,       // 블로그ID (PK)
                        cmBlog.blogCateId,   // 블로그카테고리ID (cm_blog_cate.blog_cate_id)
                        cmBlog.blogTypeCd,   // 게시글 구분 — BLOG_TYPE_CD {NEWS: '뉴스', BLOG: '블로그'}
                        cmBlog.blogTitle,    // 제목
                        cmBlog.blogSummary,  // 요약 (미리보기, 검색결과용)
                        cmBlog.blogContent,  // 본문 (HTML 에디터)
                        cmBlog.blogAuthor,   // 작성자 이름
                        cmBlog.prodId,       // 상품ID (pd_prod.prod_id, 상품 관련 글일 때만)
                        cmBlog.viewCount,    // 조회수
                        cmBlog.useYn,        // 공개여부 — USE_YN {Y: '공개', N: '비공개'}
                        cmBlog.isNotice,     // 공지글 여부(상단 고정) — IS_NOTICE {Y: '공지', N: '일반'}
                        cmBlog.regBy,        // 등록자
                        cmBlog.regDate,      // 등록일시
                        cmBlog.updBy,        // 수정자
                        cmBlog.updDate       // 수정일시
                ))
                .from(cmBlog);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogDto.Item> selectById(String blogId) {
        CmBlogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlog.blogId.eq(blogId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<CmBlogDto.Item> selectList(CmBlogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(cmBlog.blogId, search.getBlogId()));
        wheres.add(QdslUtil.strEq(cmBlog.blogTypeCd, search.getBlogTypeCd()));
        wheres.add(QdslUtil.strEq(cmBlog.blogCateId, search.getBlogCateId()));
        wheres.add(QdslUtil.strEq(cmBlog.useYn, search.getUseYn()));
        wheres.add(QdslUtil.strEq(cmBlog.isNotice, search.getIsNotice()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmBlogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres2)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public BasePage<CmBlogDto.Item> selectPageData(CmBlogDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(cmBlog.blogId, search.getBlogId()));
        wheres.add(QdslUtil.strEq(cmBlog.blogTypeCd, search.getBlogTypeCd()));
        wheres.add(QdslUtil.strEq(cmBlog.blogCateId, search.getBlogCateId()));
        wheres.add(QdslUtil.strEq(cmBlog.useYn, search.getUseYn()));
        wheres.add(QdslUtil.strEq(cmBlog.isNotice, search.getIsNotice()));
        wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres2 = wheres.toArray(BooleanExpression[]::new);

        JPAQuery<CmBlogDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmBlogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres2)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlog.count())
                .where(wheres2)
                .fetchOne();

        BasePage<CmBlogDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("blogAuthor", cmBlog.blogAuthor),
            QdslUtil.FieldDef.like("blogCateId", cmBlog.blogCateId),
            QdslUtil.FieldDef.like("blogContent", cmBlog.blogContent),
            QdslUtil.FieldDef.like("blogId", cmBlog.blogId),
            QdslUtil.FieldDef.like("blogSummary", cmBlog.blogSummary),
            QdslUtil.FieldDef.like("blogTitle", cmBlog.blogTitle),
            QdslUtil.FieldDef.like("isNotice", cmBlog.isNotice),
            QdslUtil.FieldDef.like("prodId", cmBlog.prodId),
            QdslUtil.FieldDef.like("useYn", cmBlog.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("blogId", cmBlog.blogId,
                   "blogTitle", cmBlog.blogTitle,
                   "regDate", cmBlog.regDate),
        new OrderSpecifier<>(Order.DESC, cmBlog.regDate),
        new OrderSpecifier<>(Order.ASC, cmBlog.blogId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlog entity) {
        if (entity.getBlogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlog);
        boolean hasAny = false;

        if (entity.getBlogCateId()  != null) { update.set(cmBlog.blogCateId,  entity.getBlogCateId());  hasAny = true; }
        if (entity.getBlogTypeCd()  != null) { update.set(cmBlog.blogTypeCd,  entity.getBlogTypeCd());  hasAny = true; }
        if (entity.getBlogTitle()   != null) { update.set(cmBlog.blogTitle,   entity.getBlogTitle());   hasAny = true; }
        if (entity.getBlogSummary() != null) { update.set(cmBlog.blogSummary, entity.getBlogSummary()); hasAny = true; }
        if (entity.getBlogContent() != null) { update.set(cmBlog.blogContent, entity.getBlogContent()); hasAny = true; }
        if (entity.getBlogAuthor()  != null) { update.set(cmBlog.blogAuthor,  entity.getBlogAuthor());  hasAny = true; }
        if (entity.getProdId()      != null) { update.set(cmBlog.prodId,      entity.getProdId());      hasAny = true; }
        if (entity.getViewCount()   != null) { update.set(cmBlog.viewCount,   entity.getViewCount());   hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(cmBlog.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getIsNotice()    != null) { update.set(cmBlog.isNotice,    entity.getIsNotice());    hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(cmBlog.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(cmBlog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlog.blogId.eq(entity.getBlogId())).execute();
        return (int) affected;
    }
}
