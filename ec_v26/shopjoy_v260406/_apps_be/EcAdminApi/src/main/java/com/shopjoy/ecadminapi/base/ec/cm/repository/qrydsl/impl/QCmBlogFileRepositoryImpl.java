package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmBlogFile QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogFileRepositoryImpl implements QCmBlogFileRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmBlogFile f = QCmBlogFile.cmBlogFile;

    /* 게시물 첨부파일 buildBaseQuery */
    private JPAQuery<CmBlogFileDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogFileDto.Item.class,
                        f.blogImgId, f.blogId, f.imgUrl, f.thumbUrl,
                        f.imgAltText, f.sortOrd,
                        f.regBy, f.regDate
                ))
                .from(f);
    }

    /* 게시물 첨부파일 키조회 */
    @Override
    public Optional<CmBlogFileDto.Item> selectById(String blogImgId) {
        CmBlogFileDto.Item dto = buildBaseQuery()
                .where(f.blogImgId.eq(blogImgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시물 첨부파일 목록조회 */
    @Override
    public List<CmBlogFileDto.Item> selectList(CmBlogFileDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogFileDto.Item> query = buildBaseQuery().where(where);
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

    /* 게시물 첨부파일 페이지조회 */
    @Override
    public CmBlogFileDto.PageResponse selectPageList(CmBlogFileDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogFileDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogFileDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(f.count())
                .from(f)
                .where(where)
                .fetchOne();

        CmBlogFileDto.PageResponse res = new CmBlogFileDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 게시물 첨부파일 buildCondition */
    private BooleanBuilder buildCondition(CmBlogFileDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (!CollectionUtils.isEmpty(s.getBlogIds())) w.and(f.blogId.in(s.getBlogIds()));
        if (StringUtils.hasText(s.getBlogId()))    w.and(f.blogId.eq(s.getBlogId()));

        if (StringUtils.hasText(s.getBlogImgId())) w.and(f.blogImgId.eq(s.getBlogImgId()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(f.regDate.goe(start)).and(f.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(f.updDate.goe(start)).and(f.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmBlogFileDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, f.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("blogImgId".equals(field)) {
                    orders.add(new OrderSpecifier(order, f.blogImgId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, f.regDate));
                }
            }
        }
        return orders;
    }

    /* 게시물 첨부파일 수정 */
    @Override
    public int updateSelective(CmBlogFile entity) {
        if (entity.getBlogImgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(f);
        boolean hasAny = false;

        if (entity.getBlogId()     != null) { update.set(f.blogId,     entity.getBlogId());     hasAny = true; }
        if (entity.getImgUrl()     != null) { update.set(f.imgUrl,     entity.getImgUrl());     hasAny = true; }
        if (entity.getThumbUrl()   != null) { update.set(f.thumbUrl,   entity.getThumbUrl());   hasAny = true; }
        if (entity.getImgAltText() != null) { update.set(f.imgAltText, entity.getImgAltText()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(f.sortOrd,    entity.getSortOrd());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(f.blogImgId.eq(entity.getBlogImgId())).execute();
        return (int) affected;
    }
}
