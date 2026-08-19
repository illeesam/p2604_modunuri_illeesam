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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogGoodRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** CmBlogGood QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogGoodRepositoryImpl implements QCmBlogGoodRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogGoodRepositoryImpl";
    private static final QCmBlogGood cmBlogGood = QCmBlogGood.cmBlogGood;
    private static final QCmBlog cmBlog = QCmBlog.cmBlog;    /*
     * baseSelColumnQuery — 코드성 필드 없음 (cm_blog_good 은 회원-블로그 좋아요 매핑 테이블)
     */
    private JPAQuery<CmBlogGoodDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogGoodDto.Item.class,
                        cmBlogGood.blogGoodId,   // 좋아요ID (PK)
                        cmBlogGood.blogId,   // 블로그ID (cm_blog.blog_id)
                        cmBlogGood.userId,   // 사용자ID (mb_member.member_id)
                        cmBlogGood.regDate   // 등록일시
                ))
                .from(cmBlogGood)
                .leftJoin(cmBlog).on(cmBlog.blogId.eq(cmBlogGood.blogId));
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogGoodDto.Item> selectById(String blogGoodId) {
        CmBlogGoodDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogGood.blogGoodId.eq(blogGoodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogGoodDto.Item> selectList(CmBlogGoodDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(cmBlogGood.blogGoodId, search.getBlogGoodId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(cmBlogGood.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(cmBlogGood.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<CmBlogGoodDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres.toArray(BooleanExpression[]::new))
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

    /** 페이지 목록 */
    @Override
    public BasePage<CmBlogGoodDto.Item> selectPageData(CmBlogGoodDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmBlogGood.blogGoodId, search.getBlogGoodId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(cmBlogGood.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(cmBlogGood.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmBlogGoodDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmBlogGoodDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogGood.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmBlogGoodDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("blogId", cmBlogGood.blogId),
            QdslUtil.FieldDef.like("blogGoodId", cmBlogGood.blogGoodId),
            QdslUtil.FieldDef.like("userId", cmBlogGood.userId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("blogGoodId", cmBlogGood.blogGoodId,
                   "regDate", cmBlogGood.regDate),
        new OrderSpecifier<>(Order.DESC, cmBlogGood.regDate),
        new OrderSpecifier<>(Order.ASC, cmBlogGood.blogGoodId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogGood entity) {
        if (entity.getBlogGoodId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogGood);
        boolean hasAny = false;

        if (entity.getBlogId() != null) { update.set(cmBlogGood.blogId, entity.getBlogId()); hasAny = true; }
        if (entity.getUserId() != null) { update.set(cmBlogGood.userId, entity.getUserId()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(cmBlogGood.blogGoodId.eq(entity.getBlogGoodId())).execute();
        return (int) affected;
    }
}
