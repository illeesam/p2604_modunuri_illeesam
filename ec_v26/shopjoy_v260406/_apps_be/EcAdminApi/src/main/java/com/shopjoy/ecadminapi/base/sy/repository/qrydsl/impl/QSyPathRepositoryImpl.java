package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyPath;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyPathRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyPath QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyPathRepositoryImpl implements QSyPathRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyPath p = QSyPath.syPath;

    /* 키조회 */
    @Override
    public Optional<SyPathDto.Item> selectById(String pathId) {
        SyPathDto.Item dto = baseQuery().where(p.pathId.eq(pathId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<SyPathDto.Item> selectList(SyPathDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        JPAQuery<SyPathDto.Item> query = baseQuery().where(where);
        // default order: sort_ord ASC, path_id ASC
        query.orderBy(buildOrder().toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public SyPathDto.PageResponse selectPageList(SyPathDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        JPAQuery<SyPathDto.Item> query = baseQuery().where(where);
        query = query.orderBy(buildOrder().toArray(OrderSpecifier[]::new));
        List<SyPathDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(p.count()).from(p).where(where).fetchOne();

        SyPathDto.PageResponse res = new SyPathDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* baseQuery */
    private JPAQuery<SyPathDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyPathDto.Item.class,
                        p.pathId, p.bizCd, p.parentPathId, p.pathLabel, p.sortOrd,
                        p.useYn, p.pathRemark,
                        p.regBy, p.regDate, p.updBy, p.updDate
                ))
                .from(p);
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(SyPathDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getBizCd()))        w.and(p.bizCd.eq(s.getBizCd()));
        if (s.getParentPathId() != null)              w.and(p.parentPathId.eq(s.getParentPathId()));
        if (StringUtils.hasText(s.getUseYn()))        w.and(p.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_label,"))  or.or(p.pathLabel.likeIgnoreCase(pattern));
            if (all || types.contains(",def_remark,")) or.or(p.pathRemark.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder() {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        orders.add(new OrderSpecifier(Order.ASC, p.sortOrd));
        orders.add(new OrderSpecifier(Order.ASC, p.pathId));
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(SyPath entity) {
        if (entity.getPathId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(p);
        boolean hasAny = false;

        if (entity.getBizCd()        != null) { update.set(p.bizCd,        entity.getBizCd());        hasAny = true; }
        if (entity.getParentPathId() != null) { update.set(p.parentPathId, entity.getParentPathId()); hasAny = true; }
        if (entity.getPathLabel()    != null) { update.set(p.pathLabel,    entity.getPathLabel());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(p.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(p.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getPathRemark()   != null) { update.set(p.pathRemark,   entity.getPathRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(p.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(p.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(p.pathId.eq(entity.getPathId())).execute();
        return (int) affected;
    }
}
