package com.shopjoy.ecadminapi.base.ec.cm.repository.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.repository.QCmBlogGoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmBlogGood QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogGoodRepositoryImpl implements QCmBlogGoodRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmBlogGood g = QCmBlogGood.cmBlogGood;
    private static final QCmBlog blt = QCmBlog.cmBlog;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmBlogGoodDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogGoodDto.Item.class,
                        g.likeId, g.blogId, g.userId, g.regDate
                ))
                .from(g)
                .leftJoin(blt).on(blt.blogId.eq(g.blogId));
    }

    /** 단건 조회 */
    @Override
    public Optional<CmBlogGoodDto.Item> selectById(String likeId) {
        CmBlogGoodDto.Item dto = buildBaseQuery()
                .where(g.likeId.eq(likeId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmBlogGoodDto.Item> selectList(CmBlogGoodDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogGoodDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmBlogGoodDto.PageResponse selectPageList(CmBlogGoodDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogGoodDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogGoodDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(g.count())
                .from(g)
                .where(where)
                .fetchOne();

        CmBlogGoodDto.PageResponse res = new CmBlogGoodDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    private BooleanBuilder buildCondition(CmBlogGoodDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getLikeId())) w.and(g.likeId.eq(s.getLikeId()));

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(g.regDate.goe(start)).and(g.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(g.updDate.goe(start)).and(g.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /** 정렬조건 빌드 */
    @SuppressWarnings({"rawtypes", "unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmBlogGoodDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, g.regDate));
            return orders;
        }
        switch (sort) {
            case "id_asc":   orders.add(new OrderSpecifier(Order.ASC,  g.likeId));   break;
            case "id_desc":  orders.add(new OrderSpecifier(Order.DESC, g.likeId));   break;
            case "reg_asc":  orders.add(new OrderSpecifier(Order.ASC,  g.regDate));  break;
            case "reg_desc": orders.add(new OrderSpecifier(Order.DESC, g.regDate));  break;
            default:         orders.add(new OrderSpecifier(Order.DESC, g.regDate));  break;
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmBlogGood entity) {
        if (entity.getLikeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;

        if (entity.getBlogId() != null) { update.set(g.blogId, entity.getBlogId()); hasAny = true; }
        if (entity.getUserId() != null) { update.set(g.userId, entity.getUserId()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(g.likeId.eq(entity.getLikeId())).execute();
        return (int) affected;
    }
}
