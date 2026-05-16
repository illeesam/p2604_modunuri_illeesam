package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGradeRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
public class QMbMemberGradeRepositoryImpl implements QMbMemberGradeRepository {

    private final JPAQueryFactory queryFactory;
    private static final QMbMemberGrade g    = QMbMemberGrade.mbMemberGrade;
    private static final QSySite        ste  = QSySite.sySite;
    private static final QSyCode        cdMg = new QSyCode("cd_mg");

    @Override
    public Optional<MbMemberGradeDto.Item> selectById(String memberGradeId) {
        return Optional.ofNullable(baseQuery().where(g.memberGradeId.eq(memberGradeId)).fetchOne());
    }

    @Override
    public List<MbMemberGradeDto.Item> selectList(MbMemberGradeDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberGradeDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    @Override
    public MbMemberGradeDto.PageResponse selectPageList(MbMemberGradeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberGradeDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberGradeDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(g.count()).from(g).where(where).fetchOne();

        MbMemberGradeDto.PageResponse res = new MbMemberGradeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<MbMemberGradeDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberGradeDto.Item.class,
                        g.memberGradeId, g.siteId, g.gradeCd, g.gradeNm, g.gradeRank,
                        g.minPurchaseAmt, g.saveRate, g.useYn,
                        g.regBy, g.regDate, g.updBy, g.updDate
                ))
                .from(g)
                .leftJoin(ste).on(ste.siteId.eq(g.siteId))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(g.gradeCd)));
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
    private BooleanBuilder buildCondition(MbMemberGradeDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;
        if (StringUtils.hasText(s.getSiteId()))        w.and(g.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getMemberGradeId())) w.and(g.memberGradeId.eq(s.getMemberGradeId()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_grade_nm,")) or.or(g.gradeNm.likeIgnoreCase(pattern));
            if (all || types.contains(",def_grade_cd,")) or.or(g.gradeCd.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date": w.and(g.regDate.goe(start)).and(g.regDate.lt(endExcl)); break;
                case "upd_date": w.and(g.updDate.goe(start)).and(g.updDate.lt(endExcl)); break;
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberGradeDto.Request s) {
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
                if ("memberGradeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.memberGradeId));
                } else if ("gradeNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.gradeNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(MbMemberGrade entity) {
        if (entity.getMemberGradeId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;
        if (entity.getSiteId()         != null) { update.set(g.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getGradeCd()        != null) { update.set(g.gradeCd,        entity.getGradeCd());        hasAny = true; }
        if (entity.getGradeNm()        != null) { update.set(g.gradeNm,        entity.getGradeNm());        hasAny = true; }
        if (entity.getGradeRank()      != null) { update.set(g.gradeRank,      entity.getGradeRank());      hasAny = true; }
        if (entity.getMinPurchaseAmt() != null) { update.set(g.minPurchaseAmt, entity.getMinPurchaseAmt()); hasAny = true; }
        if (entity.getSaveRate()       != null) { update.set(g.saveRate,       entity.getSaveRate());       hasAny = true; }
        if (entity.getUseYn()          != null) { update.set(g.useYn,          entity.getUseYn());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(g.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(g.updDate,        entity.getUpdDate());        hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(g.memberGradeId.eq(entity.getMemberGradeId())).execute();
    }
}
