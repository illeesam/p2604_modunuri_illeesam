package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyDeptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyDept QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyDeptRepositoryImpl implements QSyDeptRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyDept d = QSyDept.syDept;
    private static final QSySite ste = QSySite.sySite;
    private static final QSyUser usr = QSyUser.syUser;
    private static final QSyCode cdDt = new QSyCode("cd_dt");

    private JPAQuery<SyDeptDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyDeptDto.Item.class,
                        d.deptId, d.siteId, d.deptCode, d.deptNm, d.parentDeptId,
                        d.deptTypeCd, d.managerId, d.sortOrd, d.useYn, d.deptRemark,
                        d.regBy, d.regDate, d.updBy, d.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(d)
                .leftJoin(ste).on(ste.siteId.eq(d.siteId))
                .leftJoin(usr).on(usr.userId.eq(d.managerId))
                .leftJoin(cdDt).on(cdDt.codeGrp.eq("DEPT_TYPE").and(cdDt.codeValue.eq(d.deptTypeCd)));
    }

    @Override
    public Optional<SyDeptDto.Item> selectById(String deptId) {
        SyDeptDto.Item dto = buildBaseQuery()
                .where(d.deptId.eq(deptId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyDeptDto.Item> selectList(SyDeptDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyDeptDto.Item> query = buildBaseQuery().where(where);
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

    @Override
    public SyDeptDto.PageResponse selectPageList(SyDeptDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyDeptDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyDeptDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(d.count()).from(d).where(where).fetchOne();

        SyDeptDto.PageResponse res = new SyDeptDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
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
    private BooleanBuilder buildCondition(SyDeptDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(d.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getParentDeptId())) w.and(d.parentDeptId.eq(s.getParentDeptId()));
        if (StringUtils.hasText(s.getTypeCd()))       w.and(d.deptTypeCd.eq(s.getTypeCd()));
        if (StringUtils.hasText(s.getUseYn()))        w.and(d.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_name,")) or.or(d.deptNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_code,")) or.or(d.deptCode.likeIgnoreCase(pattern));
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
                    w.and(d.regDate.goe(start)).and(d.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(d.updDate.goe(start)).and(d.updDate.lt(endExcl));
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
    private List<OrderSpecifier<?>> buildOrder(SyDeptDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, d.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("deptId".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.deptId));
                } else if ("deptNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.deptNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, d.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(SyDept entity) {
        if (entity.getDeptId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(d);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(d.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getDeptCode()     != null) { update.set(d.deptCode,     entity.getDeptCode());     hasAny = true; }
        if (entity.getDeptNm()       != null) { update.set(d.deptNm,       entity.getDeptNm());       hasAny = true; }
        if (entity.getParentDeptId() != null) { update.set(d.parentDeptId, entity.getParentDeptId()); hasAny = true; }
        if (entity.getDeptTypeCd()   != null) { update.set(d.deptTypeCd,   entity.getDeptTypeCd());   hasAny = true; }
        if (entity.getManagerId()    != null) { update.set(d.managerId,    entity.getManagerId());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(d.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(d.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getDeptRemark()   != null) { update.set(d.deptRemark,   entity.getDeptRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(d.updBy,        entity.getUpdBy());        hasAny = true; }
        if (entity.getUpdDate()      != null) { update.set(d.updDate,      entity.getUpdDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(d.deptId.eq(entity.getDeptId())).execute();
        return (int) affected;
    }
}
