package com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.QCmBlogFile;
import com.shopjoy.ecBeBo.base.ec.cm.repository.qrydsl.QCmBlogFileRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** CmBlogFile(블로그 이미지) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogFileRepositoryImpl implements QCmBlogFileRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogFileRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QCmBlogFile cmBlogFile = QCmBlogFile.cmBlogFile;    /*
     * baseSelColumnQuery — 코드성 필드 없음 (cm_blog_file 은 이미지 URL/정렬순서 중심 테이블)
     */
    private JPAQuery<CmBlogFileDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogFileDto.Item.class,
                        cmBlogFile.blogFileId,   // 블로그이미지ID (PK)
                        cmBlogFile.blogId,      // 블로그ID (cm_blog.blog_id)
                        cmBlogFile.imgUrl,      // 원본 이미지 URL
                        cmBlogFile.thumbUrl,    // 썸네일 이미지 URL
                        cmBlogFile.imgAltText,  // 이미지 대체텍스트
                        cmBlogFile.sortOrd,     // 정렬순서
                        cmBlogFile.regBy,       // 등록자
                        cmBlogFile.regDate,      // 등록일시
                        cmBlogFile.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(cmBlogFile)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(cmBlogFile.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(cmBlogFile.regBy)) // 등록자
                ;
    }

    /* 게시물 첨부파일 키조회 */
    @Override
    public Optional<CmBlogFileDto.Item> selectById(String blogFileId) {
        CmBlogFileDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogFile.blogFileId.eq(blogFileId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 게시물 첨부파일 목록조회 */
    @Override
    public List<CmBlogFileDto.Item> selectList(CmBlogFileDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(cmBlogFile.blogId, search.getBlogIds())); // 상위 FK 다건 IN
        whereList.add(QdslUtil.strEq(cmBlogFile.blogId, search.getBlogId())); // 상위 FK 필터
        whereList.add(QdslUtil.strEq(cmBlogFile.blogFileId, search.getBlogFileId())); // 블로그이미지ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogFile.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogFile.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmBlogFileDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<CmBlogFileDto.Item> list = query.fetch();
        return list;
    }

    /* 게시물 첨부파일 페이지조회 */
    @Override
    public BasePage<CmBlogFileDto.Item> selectPageData(CmBlogFileDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(cmBlogFile.blogId, search.getBlogIds())); // 상위 FK 다건 IN
        whereList.add(QdslUtil.strEq(cmBlogFile.blogId, search.getBlogId())); // 상위 FK 필터
        whereList.add(QdslUtil.strEq(cmBlogFile.blogFileId, search.getBlogFileId())); // 블로그이미지ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogFile.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogFile.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<CmBlogFileDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmBlogFileDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogFile.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmBlogFileDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "blogId,blogFileId,imgAltText,imgUrl,thumbUrl" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("blogId", cmBlogFile.blogId), // 상위 FK 필터
            QdslUtil.FieldDef.like("blogFileId", cmBlogFile.blogFileId), // 블로그이미지ID 필터
            QdslUtil.FieldDef.like("imgAltText", cmBlogFile.imgAltText), // 이미지 대체텍스트
            QdslUtil.FieldDef.like("imgUrl", cmBlogFile.imgUrl), // 원본 이미지 URL
            QdslUtil.FieldDef.like("thumbUrl", cmBlogFile.thumbUrl) // 썸네일 이미지 URL
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("blogFileId", cmBlogFile.blogFileId,
                   "regDate", cmBlogFile.regDate,
                   "sortOrd", cmBlogFile.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmBlogFile.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmBlogFile.regDate),
        new OrderSpecifier<>(Order.ASC, cmBlogFile.blogFileId));
    }

    /* 게시물 첨부파일 수정 */
    @Override
    public int updateSelective(CmBlogFile entity) {
        if (entity.getBlogFileId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogFile);
        boolean hasAny = false;

        if (entity.getBlogId()     != null) { update.set(cmBlogFile.blogId,     entity.getBlogId());     hasAny = true; }
        if (entity.getImgUrl()     != null) { update.set(cmBlogFile.imgUrl,     entity.getImgUrl());     hasAny = true; }
        if (entity.getThumbUrl()   != null) { update.set(cmBlogFile.thumbUrl,   entity.getThumbUrl());   hasAny = true; }
        if (entity.getImgAltText() != null) { update.set(cmBlogFile.imgAltText, entity.getImgAltText()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(cmBlogFile.sortOrd,    entity.getSortOrd());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(cmBlogFile.blogFileId.eq(entity.getBlogFileId())).execute();
        return (int) affected;
    }
}
