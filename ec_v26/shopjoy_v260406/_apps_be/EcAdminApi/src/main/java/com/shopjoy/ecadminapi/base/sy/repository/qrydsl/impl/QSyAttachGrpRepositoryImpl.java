package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachGrpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyAttachGrp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAttachGrpRepositoryImpl implements QSyAttachGrpRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyAttachGrp g = QSyAttachGrp.syAttachGrp;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyAttachGrpDto.Item> selectById(String attachGrpId) {
        SyAttachGrpDto.Item dto = baseQuery().where(g.attachGrpId.eq(attachGrpId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyAttachGrpDto.Item> selectList(SyAttachGrpDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyAttachGrpDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyAttachGrpDto.PageResponse selectPageList(SyAttachGrpDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyAttachGrpDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyAttachGrpDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(g.count()).from(g).where(where).fetchOne();

        SyAttachGrpDto.PageResponse res = new SyAttachGrpDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyAttachGrpDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyAttachGrpDto.Item.class,
                        g.attachGrpId, g.attachGrpCode, g.attachGrpNm, g.fileExtAllow,
                        g.maxFileSize, g.maxFileCount, g.storagePath, g.useYn, g.sortOrd,
                        g.attachGrpRemark, g.regBy, g.regDate, g.updBy, g.updDate
                ))
                .from(g);
    }

    // searchTypes 사용 예 (콤마 경계 매칭):
    //   - 단일 조건  : searchTypes = "def_blog_title"
    //   - 복합 조건  : searchTypes = "def_blog_title,def_blog_author"   (UI 에서 aaa,bbb 형태로 전달)
    //   - 미지정     : searchTypes = null/"" 이면 all=true 로 전체 컬럼 OR 검색
    //
    //   buildCondition 내부에서는
    //     String types = "," + searchTypes + ",";   // 예: ",def_blog_title,def_blog_author,"
    //     types.contains(",def_blog_title,")         // 토큰 경계 정확 매칭 (부분문자열 오매칭 방지)
    //   형태로 비교한다.
    private BooleanBuilder buildCondition(SyAttachGrpDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getAttachGrpId())) w.and(g.attachGrpId.eq(s.getAttachGrpId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_attach_grp_nm,")) or.or(g.attachGrpNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(g.regDate.goe(ds.atStartOfDay())).and(g.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(g.updDate.goe(ds.atStartOfDay())).and(g.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                default: break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyAttachGrpDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, g.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("attachGrpId".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.attachGrpId));
                } else if ("attachGrpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.attachGrpNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(SyAttachGrp entity) {
        if (entity.getAttachGrpId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;

        if (entity.getAttachGrpCode()   != null) { update.set(g.attachGrpCode,   entity.getAttachGrpCode());   hasAny = true; }
        if (entity.getAttachGrpNm()     != null) { update.set(g.attachGrpNm,     entity.getAttachGrpNm());     hasAny = true; }
        if (entity.getFileExtAllow()    != null) { update.set(g.fileExtAllow,    entity.getFileExtAllow());    hasAny = true; }
        if (entity.getMaxFileSize()     != null) { update.set(g.maxFileSize,     entity.getMaxFileSize());     hasAny = true; }
        if (entity.getMaxFileCount()    != null) { update.set(g.maxFileCount,    entity.getMaxFileCount());    hasAny = true; }
        if (entity.getStoragePath()     != null) { update.set(g.storagePath,     entity.getStoragePath());     hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(g.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(g.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getAttachGrpRemark() != null) { update.set(g.attachGrpRemark, entity.getAttachGrpRemark()); hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(g.updBy,           entity.getUpdBy());           hasAny = true; }
        if (entity.getUpdDate()         != null) { update.set(g.updDate,         entity.getUpdDate());         hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(g.attachGrpId.eq(entity.getAttachGrpId())).execute();
        return (int) affected;
    }
}
