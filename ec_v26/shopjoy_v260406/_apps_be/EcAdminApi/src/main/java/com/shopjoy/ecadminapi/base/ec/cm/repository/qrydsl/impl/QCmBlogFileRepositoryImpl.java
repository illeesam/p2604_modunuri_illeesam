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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogFileRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** CmBlogFile QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogFileRepositoryImpl implements QCmBlogFileRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogFileRepositoryImpl";
    private static final QCmBlogFile cmBlogFile = QCmBlogFile.cmBlogFile;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", cmBlogFile.regDate,
        "upd_date", cmBlogFile.updDate
    );

    /*
     * baseSelColumnQuery — 코드성 필드 없음 (cm_blog_file 은 이미지 URL/정렬순서 중심 테이블)
     */
    private JPAQuery<CmBlogFileDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogFileDto.Item.class,
                        cmBlogFile.blogImgId,   // 블로그이미지ID (PK)
                        cmBlogFile.blogId,      // 블로그ID (cm_blog.blog_id)
                        cmBlogFile.imgUrl,      // 원본 이미지 URL
                        cmBlogFile.thumbUrl,    // 썸네일 이미지 URL
                        cmBlogFile.imgAltText,  // 이미지 대체텍스트
                        cmBlogFile.sortOrd,     // 정렬순서
                        cmBlogFile.regBy,       // 등록자
                        cmBlogFile.regDate      // 등록일시
                ))
                .from(cmBlogFile);
    }

    /* 게시물 첨부파일 키조회 */
    @Override
    public Optional<CmBlogFileDto.Item> selectById(String blogImgId) {
        CmBlogFileDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogFile.blogImgId.eq(blogImgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시물 첨부파일 목록조회 */
    @Override
    public List<CmBlogFileDto.Item> selectList(CmBlogFileDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        JPAQuery<CmBlogFileDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strIn(cmBlogFile.blogId, search.getBlogIds()),
                QdslUtil.strEq(cmBlogFile.blogId, search.getBlogId()),
                QdslUtil.strEq(cmBlogFile.blogImgId, search.getBlogImgId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 게시물 첨부파일 페이지조회 */
    @Override
    public BasePage<CmBlogFileDto.Item> selectPageData(CmBlogFileDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(cmBlogFile.blogId, search.getBlogIds()),
                QdslUtil.strEq(cmBlogFile.blogId, search.getBlogId()),
                QdslUtil.strEq(cmBlogFile.blogImgId, search.getBlogImgId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmBlogFileDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmBlogFileDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogFile.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmBlogFileDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("blogId", cmBlogFile.blogId),
            QdslUtil.FieldDef.like("blogImgId", cmBlogFile.blogImgId),
            QdslUtil.FieldDef.like("imgAltText", cmBlogFile.imgAltText),
            QdslUtil.FieldDef.like("imgUrl", cmBlogFile.imgUrl),
            QdslUtil.FieldDef.like("thumbUrl", cmBlogFile.thumbUrl)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("blogImgId", cmBlogFile.blogImgId,
                   "regDate", cmBlogFile.regDate,
                   "sortOrd", cmBlogFile.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmBlogFile.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmBlogFile.regDate),
        new OrderSpecifier<>(Order.ASC, cmBlogFile.blogImgId));
    }

    /* 게시물 첨부파일 수정 */
    @Override
    public int updateSelective(CmBlogFile entity) {
        if (entity.getBlogImgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogFile);
        boolean hasAny = false;

        if (entity.getBlogId()     != null) { update.set(cmBlogFile.blogId,     entity.getBlogId());     hasAny = true; }
        if (entity.getImgUrl()     != null) { update.set(cmBlogFile.imgUrl,     entity.getImgUrl());     hasAny = true; }
        if (entity.getThumbUrl()   != null) { update.set(cmBlogFile.thumbUrl,   entity.getThumbUrl());   hasAny = true; }
        if (entity.getImgAltText() != null) { update.set(cmBlogFile.imgAltText, entity.getImgAltText()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(cmBlogFile.sortOrd,    entity.getSortOrd());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(cmBlogFile.blogImgId.eq(entity.getBlogImgId())).execute();
        return (int) affected;
    }
}
