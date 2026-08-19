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
        CmBlogTagDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogTag.blogTagId.eq(blogTagId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogTagDto.Item> selectList(CmBlogTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strIn(cmBlogTag.blogId, search.getBlogIds()));
        wheres.add(QdslUtil.strEq(cmBlogTag.blogId, search.getBlogId()));
        wheres.add(QdslUtil.strEq(cmBlogTag.blogTagId, search.getBlogTagId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(cmBlogTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(cmBlogTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<CmBlogTagDto.Item> query = baseSelColumnQuery()
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
    public BasePage<CmBlogTagDto.Item> selectPageData(CmBlogTagDto.Request search) {
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
        whereList.add(QdslUtil.strIn(cmBlogTag.blogId, search.getBlogIds()));
        whereList.add(QdslUtil.strEq(cmBlogTag.blogId, search.getBlogId()));
        whereList.add(QdslUtil.strEq(cmBlogTag.blogTagId, search.getBlogTagId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(cmBlogTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(cmBlogTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmBlogTagDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmBlogTagDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmBlogTag.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmBlogTagDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmBlogTag.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlogTag.blogTagId.eq(entity.getBlogTagId())).execute();
        return (int) affected;
    }
}
