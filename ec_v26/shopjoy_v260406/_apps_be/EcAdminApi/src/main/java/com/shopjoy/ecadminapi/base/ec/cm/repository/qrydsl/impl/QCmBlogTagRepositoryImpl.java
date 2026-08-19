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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogTagRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmBlogTag QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogTagRepositoryImpl implements QCmBlogTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogTagRepositoryImpl";
    private static final QCmBlogTag cmBlogTag = QCmBlogTag.cmBlogTag;    /*
     * baseSelColumnQuery — 코드성 필드 없음 (cm_blog_tag 는 블로그-태그명 매핑 테이블)
     */
    private JPAQuery<CmBlogTagDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogTagDto.Item.class,
                        cmBlogTag.blogTagId,  // 태그ID (PK)
                        cmBlogTag.blogId,     // 블로그ID (cm_blog.blog_id)
                        cmBlogTag.tagNm,      // 태그명
                        cmBlogTag.sortOrd,    // 정렬순서
                        cmBlogTag.regBy,      // 등록자
                        cmBlogTag.regDate,    // 등록일시
                        cmBlogTag.updBy,      // 수정자
                        cmBlogTag.updDate     // 수정일시
                ))
                .from(cmBlogTag);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogTagDto.Item> selectById(String blogTagId) {
        CmBlogTagDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogTag.blogTagId.eq(blogTagId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogTagDto.Item> selectList(CmBlogTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(cmBlogTag.blogId, search.getBlogIds()));
        whereList.add(QdslUtil.strEq(cmBlogTag.blogId, search.getBlogId()));
        whereList.add(QdslUtil.strEq(cmBlogTag.blogTagId, search.getBlogTagId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmBlogTagDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<CmBlogTagDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<CmBlogTagDto.Item> selectPageData(CmBlogTagDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(cmBlogTag.blogId, search.getBlogIds()));
        whereList.add(QdslUtil.strEq(cmBlogTag.blogId, search.getBlogId()));
        whereList.add(QdslUtil.strEq(cmBlogTag.blogTagId, search.getBlogTagId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<CmBlogTagDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmBlogTagDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogTag.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmBlogTagDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("blogId", cmBlogTag.blogId),
            QdslUtil.FieldDef.like("blogTagId", cmBlogTag.blogTagId),
            QdslUtil.FieldDef.like("tagNm", cmBlogTag.tagNm)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("blogTagId", cmBlogTag.blogTagId,
                   "tagNm", cmBlogTag.tagNm,
                   "regDate", cmBlogTag.regDate,
                   "sortOrd", cmBlogTag.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmBlogTag.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmBlogTag.regDate),
        new OrderSpecifier<>(Order.ASC, cmBlogTag.blogTagId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogTag entity) {
        if (entity.getBlogTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogTag);
        boolean hasAny = false;

        if (entity.getBlogId()  != null) { update.set(cmBlogTag.blogId,  entity.getBlogId());  hasAny = true; }
        if (entity.getTagNm()   != null) { update.set(cmBlogTag.tagNm,   entity.getTagNm());   hasAny = true; }
        if (entity.getSortOrd() != null) { update.set(cmBlogTag.sortOrd, entity.getSortOrd()); hasAny = true; }
        if (entity.getUpdBy()   != null) { update.set(cmBlogTag.updBy,   entity.getUpdBy());   hasAny = true; }
        update.set(cmBlogTag.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlogTag.blogTagId.eq(entity.getBlogTagId())).execute();
        return (int) affected;
    }
}
