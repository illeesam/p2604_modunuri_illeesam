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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogCateRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** CmBlogCate(블로그 카테고리) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogCateRepositoryImpl implements QCmBlogCateRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogCateRepositoryImpl";
    private static final QCmBlogCate cmBlogCate = QCmBlogCate.cmBlogCate;
    private static final QSySite sySite = QSySite.sySite;    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값
     * USE_YN  {Y: '사용', N: '미사용'} — sy_code 미등록, use_yn 전역 공통 규약
     */
    private JPAQuery<CmBlogCateDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogCateDto.Item.class,
                        cmBlogCate.blogCateId,       // 블로그카테고리ID (PK)
                        cmBlogCate.blogCateNm,       // 카테고리명
                        cmBlogCate.parentBlogCateId, // 상위 카테고리ID (NULL이면 최상위)
                        cmBlogCate.sortOrd,          // 정렬순서
                        cmBlogCate.useYn,            // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        cmBlogCate.regBy,            // 등록자
                        cmBlogCate.regDate,          // 등록일시
                        cmBlogCate.updBy,            // 수정자
                        cmBlogCate.updDate          // 수정일시
                ))
                .from(cmBlogCate);
    }

    /* 게시판 카테고리 키조회 */
    @Override
    public Optional<CmBlogCateDto.Item> selectById(String blogCateId) {
        CmBlogCateDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogCate.blogCateId.eq(blogCateId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 게시판 카테고리 목록조회 */
    @Override
    public List<CmBlogCateDto.Item> selectList(CmBlogCateDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmBlogCate.blogCateId, search.getBlogCateId()));
        whereList.add(QdslUtil.strEq(cmBlogCate.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogCate.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogCate.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmBlogCateDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<CmBlogCateDto.Item> list = query.fetch();
        return list;
    }

    /* 게시판 카테고리 페이지조회 */
    @Override
    public BasePage<CmBlogCateDto.Item> selectPageData(CmBlogCateDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmBlogCate.blogCateId, search.getBlogCateId()));
        whereList.add(QdslUtil.strEq(cmBlogCate.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogCate.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmBlogCate.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<CmBlogCateDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmBlogCateDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogCate.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmBlogCateDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("blogCateId", cmBlogCate.blogCateId),
            QdslUtil.FieldDef.like("blogCateNm", cmBlogCate.blogCateNm),
            QdslUtil.FieldDef.like("parentBlogCateId", cmBlogCate.parentBlogCateId),
            QdslUtil.FieldDef.like("useYn", cmBlogCate.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("blogCateId", cmBlogCate.blogCateId,
                   "blogCateNm", cmBlogCate.blogCateNm,
                   "regDate", cmBlogCate.regDate,
                   "sortOrd", cmBlogCate.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmBlogCate.sortOrd),
        new OrderSpecifier<>(Order.ASC, cmBlogCate.regDate),
        new OrderSpecifier<>(Order.ASC, cmBlogCate.blogCateId));
    }

    /* 게시판 카테고리 수정 */
    @Override
    public int updateSelective(CmBlogCate entity) {
        if (entity.getBlogCateId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogCate);
        boolean hasAny = false;

        if (entity.getBlogCateNm()       != null) { update.set(cmBlogCate.blogCateNm,       entity.getBlogCateNm());       hasAny = true; }
        if (entity.getParentBlogCateId() != null) { update.set(cmBlogCate.parentBlogCateId, entity.getParentBlogCateId()); hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(cmBlogCate.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(cmBlogCate.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(cmBlogCate.updBy,            entity.getUpdBy());            hasAny = true; }
        update.set(cmBlogCate.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlogCate.blogCateId.eq(entity.getBlogCateId())).execute();
        return (int) affected;
    }
}
