package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyCodeGrpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyCodeGrp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyCodeGrpRepositoryImpl implements QSyCodeGrpRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyCodeGrp g = QSyCodeGrp.syCodeGrp;
    private static final QSySite ste = QSySite.sySite;

    /* 공통 코드 그룹 buildBaseQuery */
    private JPAQuery<SyCodeGrpDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyCodeGrpDto.Item.class,
                        g.codeGrpId, g.siteId, g.codeGrp, g.grpNm, g.pathId,
                        g.codeGrpDesc, g.useYn,
                        g.regBy, g.regDate, g.updBy, g.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(g)
                .leftJoin(ste).on(ste.siteId.eq(g.siteId));
    }

    /* 공통 코드 그룹 키조회 */
    @Override
    public Optional<SyCodeGrpDto.Item> selectById(String codeGrpId) {
        SyCodeGrpDto.Item dto = buildBaseQuery()
                .where(g.codeGrpId.eq(codeGrpId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 공통 코드 그룹 목록조회 */
    @Override
    public List<SyCodeGrpDto.Item> selectList(SyCodeGrpDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyCodeGrpDto.Item> query = buildBaseQuery().where(where);
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

    /* 공통 코드 그룹 페이지조회 */
    @Override
    public SyCodeGrpDto.PageResponse selectPageList(SyCodeGrpDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyCodeGrpDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyCodeGrpDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(g.count()).from(g).where(where).fetchOne();

        SyCodeGrpDto.PageResponse res = new SyCodeGrpDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "def_blog_title,def_blog_author" */
    private BooleanBuilder buildCondition(SyCodeGrpDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))    w.and(g.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getCodeGrpId())) w.and(g.codeGrpId.eq(s.getCodeGrpId()));
        // pathId 는 sy_path 재귀 조회가 필요한 조건이므로 단순 비교만 적용
        if (StringUtils.hasText(s.getPathId()))    w.and(g.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getCodeGrp()))   w.and(g.codeGrp.eq(s.getCodeGrp()));
        if (StringUtils.hasText(s.getUseYn()))     w.and(g.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_nm,"))  or.or(g.grpNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_grp,")) or.or(g.codeGrp.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

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

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyCodeGrpDto.Request s) {
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
                if ("codeGrpId".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.codeGrpId));
                } else if ("grpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.grpNm));
                } else if ("codeGrp".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.codeGrp));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.regDate));
                }
            }
        }
        return orders;
    }

    /* 공통 코드 그룹 수정 */
    @Override
    public int updateSelective(SyCodeGrp entity) {
        if (entity.getCodeGrpId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(g.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getCodeGrp()     != null) { update.set(g.codeGrp,     entity.getCodeGrp());     hasAny = true; }
        if (entity.getGrpNm()       != null) { update.set(g.grpNm,       entity.getGrpNm());       hasAny = true; }
        if (entity.getPathId()      != null) { update.set(g.pathId,      entity.getPathId());      hasAny = true; }
        if (entity.getCodeGrpDesc() != null) { update.set(g.codeGrpDesc, entity.getCodeGrpDesc()); hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(g.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(g.updBy,       entity.getUpdBy());       hasAny = true; }
        if (entity.getUpdDate()     != null) { update.set(g.updDate,     entity.getUpdDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(g.codeGrpId.eq(entity.getCodeGrpId())).execute();
        return (int) affected;
    }
}
