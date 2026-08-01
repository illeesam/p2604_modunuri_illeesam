package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogGoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QCmBlog cmBlog = QCmBlog.cmBlog;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of(
        "reg_date", cmBlogGood.regDate,
        "upd_date", cmBlogGood.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("blogId", cmBlogGood.blogId),
        Map.entry("likeId", cmBlogGood.likeId),
        Map.entry("siteId", cmBlogGood.siteId),
        Map.entry("userId", cmBlogGood.userId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 없음 (cm_blog_good 은 회원-블로그 좋아요 매핑 테이블)
     */
    private JPAQuery<CmBlogGoodDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogGoodDto.Item.class,
                        cmBlogGood.likeId,   // 좋아요ID (PK)
                        cmBlogGood.blogId,   // 블로그ID (cm_blog.blog_id)
                        cmBlogGood.userId,   // 사용자ID (mb_member.member_id)
                        cmBlogGood.regDate   // 등록일시
                ))
                .from(cmBlogGood)
                .leftJoin(cmBlog).on(cmBlog.blogId.eq(cmBlogGood.blogId));
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogGoodDto.Item> selectById(String likeId) {
        CmBlogGoodDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogGood.likeId.eq(likeId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogGoodDto.Item> selectList(CmBlogGoodDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogGoodDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(cmBlogGood.likeId, search.getLikeId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
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

    /** 페이지 목록 */
    @Override
    public BasePage<CmBlogGoodDto.Item> selectPageData(CmBlogGoodDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(cmBlogGood.likeId, search.getLikeId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS)
        };

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

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmBlogGoodDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = QdslUtil.sortOf(s);
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, cmBlogGood.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogGood.likeId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("likeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogGood.likeId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogGood.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, cmBlogGood.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogGood.likeId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogGood entity) {
        if (entity.getLikeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogGood);
        boolean hasAny = false;

        if (entity.getBlogId() != null) { update.set(cmBlogGood.blogId, entity.getBlogId()); hasAny = true; }
        if (entity.getUserId() != null) { update.set(cmBlogGood.userId, entity.getUserId()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(cmBlogGood.likeId.eq(entity.getLikeId())).execute();
        return (int) affected;
    }
}
