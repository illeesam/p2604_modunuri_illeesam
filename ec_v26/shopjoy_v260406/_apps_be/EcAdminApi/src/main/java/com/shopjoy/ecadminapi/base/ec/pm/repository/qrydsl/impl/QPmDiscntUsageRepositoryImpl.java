package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PmDiscntUsage QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntUsageRepositoryImpl implements QPmDiscntUsageRepository {

    private final JPAQueryFactory queryFactory;
    private static final QPmDiscntUsage u = QPmDiscntUsage.pmDiscntUsage;

    @Override
    public Optional<PmDiscntUsageDto.Item> selectById(String discntUsageId) {
        PmDiscntUsageDto.Item dto = baseQuery()
                .where(u.discntUsageId.eq(discntUsageId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<PmDiscntUsageDto.Item> selectList(PmDiscntUsageDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntUsageDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public PmDiscntUsageDto.PageResponse selectPageList(PmDiscntUsageDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmDiscntUsageDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmDiscntUsageDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(u.count())
                .from(u)
                .where(where)
                .fetchOne();

        PmDiscntUsageDto.PageResponse res = new PmDiscntUsageDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<PmDiscntUsageDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntUsageDto.Item.class,
                        u.discntUsageId, u.siteId, u.discntId, u.discntNm,
                        u.memberId, u.orderId, u.orderItemId, u.prodId,
                        u.discntTypeCd, u.discntValue, u.discntAmt, u.usedDate,
                        u.regBy, u.regDate
                ))
                .from(u);
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
    private BooleanBuilder buildCondition(PmDiscntUsageDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))        w.and(u.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getDiscntUsageId())) w.and(u.discntUsageId.eq(s.getDiscntUsageId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_discnt_nm,")) or.or(u.discntNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(s.getDateStart(), fmt);
            LocalDate endDate   = LocalDate.parse(s.getDateEnd(),   fmt);
            LocalDateTime start   = startDate.atStartOfDay();
            LocalDateTime endExcl = endDate.plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(u.regDate.goe(start)).and(u.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(u.updDate.goe(start)).and(u.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(PmDiscntUsageDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, u.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("discntUsageId".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.discntUsageId));
                } else if ("discntNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.discntNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, u.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(PmDiscntUsage entity) {
        if (entity.getDiscntUsageId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(u);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(u.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getDiscntId()      != null) { update.set(u.discntId,      entity.getDiscntId());      hasAny = true; }
        if (entity.getDiscntNm()      != null) { update.set(u.discntNm,      entity.getDiscntNm());      hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(u.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOrderId()       != null) { update.set(u.orderId,       entity.getOrderId());       hasAny = true; }
        if (entity.getOrderItemId()   != null) { update.set(u.orderItemId,   entity.getOrderItemId());   hasAny = true; }
        if (entity.getProdId()        != null) { update.set(u.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getDiscntTypeCd()  != null) { update.set(u.discntTypeCd,  entity.getDiscntTypeCd());  hasAny = true; }
        if (entity.getDiscntValue()   != null) { update.set(u.discntValue,   entity.getDiscntValue());   hasAny = true; }
        if (entity.getDiscntAmt()     != null) { update.set(u.discntAmt,     entity.getDiscntAmt());     hasAny = true; }
        if (entity.getUsedDate()      != null) { update.set(u.usedDate,      entity.getUsedDate());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(u.discntUsageId.eq(entity.getDiscntUsageId())).execute();
        return (int) affected;
    }
}
