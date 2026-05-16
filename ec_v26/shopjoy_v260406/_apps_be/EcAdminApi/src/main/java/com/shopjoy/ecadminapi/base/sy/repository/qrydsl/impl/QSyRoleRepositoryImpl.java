package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyRole QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyRoleRepositoryImpl implements QSyRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyRole r = QSyRole.syRole;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyCode cdRt = new QSyCode("cd_rt");

    /* 역할(권한) buildBaseQuery */
    private JPAQuery<SyRoleDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyRoleDto.Item.class,
                        r.roleId, r.siteId, r.roleCode, r.roleNm, r.parentRoleId,
                        r.roleTypeCd, r.sortOrd, r.useYn, r.restrictPerm, r.roleRemark,
                        r.regBy, r.regDate, r.updBy, r.updDate, r.pathId,
                        ste.siteNm.as("siteNm")
                ))
                .from(r)
                .leftJoin(ste).on(ste.siteId.eq(r.siteId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("ROLE_TYPE").and(cdRt.codeValue.eq(r.roleTypeCd)));
    }

    /* 역할(권한) 키조회 */
    @Override
    public Optional<SyRoleDto.Item> selectById(String roleId) {
        SyRoleDto.Item dto = buildBaseQuery()
                .where(r.roleId.eq(roleId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 역할(권한) 목록조회 */
    @Override
    public List<SyRoleDto.Item> selectList(SyRoleDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyRoleDto.Item> query = buildBaseQuery().where(where);
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

    /* 역할(권한) 페이지조회 */
    @Override
    public SyRoleDto.PageResponse selectPageList(SyRoleDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyRoleDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyRoleDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(where).fetchOne();

        SyRoleDto.PageResponse res = new SyRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanBuilder buildCondition(SyRoleDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(r.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getRoleId()))       w.and(r.roleId.eq(s.getRoleId()));
        // pathId 는 sy_path 재귀 조회가 필요한 조건이므로 단순 비교만 적용
        if (StringUtils.hasText(s.getPathId()))       w.and(r.pathId.eq(s.getPathId()));
        if (StringUtils.hasText(s.getRoleTypeCd()))   w.and(r.roleTypeCd.eq(s.getRoleTypeCd()));
        if (StringUtils.hasText(s.getParentRoleId())) w.and(r.parentRoleId.eq(s.getParentRoleId()));
        if (StringUtils.hasText(s.getUseYn()))        w.and(r.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",roleNm,"))   or.or(r.roleNm.likeIgnoreCase(pattern));
            if (all || types.contains(",roleCode,")) or.or(r.roleCode.likeIgnoreCase(pattern));
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
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(SyRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("roleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.roleId));
                } else if ("roleNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.roleNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        return orders;
    }

    /* 역할(권한) 수정 */
    @Override
    public int updateSelective(SyRole entity) {
        if (entity.getRoleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(r.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getRoleCode()     != null) { update.set(r.roleCode,     entity.getRoleCode());     hasAny = true; }
        if (entity.getRoleNm()       != null) { update.set(r.roleNm,       entity.getRoleNm());       hasAny = true; }
        if (entity.getParentRoleId() != null) { update.set(r.parentRoleId, entity.getParentRoleId()); hasAny = true; }
        if (entity.getRoleTypeCd()   != null) { update.set(r.roleTypeCd,   entity.getRoleTypeCd());   hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(r.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(r.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getRestrictPerm() != null) { update.set(r.restrictPerm, entity.getRestrictPerm()); hasAny = true; }
        if (entity.getRoleRemark()   != null) { update.set(r.roleRemark,   entity.getRoleRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(r.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(r.updDate,      entity.getUpdDate());      hasAny = true; }
        if (entity.getPathId()       != null) { update.set(r.pathId,       entity.getPathId());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.roleId.eq(entity.getRoleId())).execute();
        return (int) affected;
    }
}
