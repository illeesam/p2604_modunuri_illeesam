package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
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
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberGradeRepositoryImpl";
    private static final QMbMemberGrade mbMemberGrade    = QMbMemberGrade.mbMemberGrade;
    private static final QSySite        sySite  = QSySite.sySite;
    private static final QSyCode        cdMg = new QSyCode("cd_mg");

    /* 회원 등급 baseSelColumnQuery */
    private JPAQuery<MbMemberGradeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberGradeDto.Item.class,
                        mbMemberGrade.memberGradeId, mbMemberGrade.siteId, mbMemberGrade.gradeCd, mbMemberGrade.gradeNm, mbMemberGrade.gradeRank,
                        mbMemberGrade.minPurchaseAmt, mbMemberGrade.saveRate, mbMemberGrade.useYn,
                        mbMemberGrade.regBy, mbMemberGrade.regDate, mbMemberGrade.updBy, mbMemberGrade.updDate
                ))
                .from(mbMemberGrade)
                .leftJoin(sySite).on(sySite.siteId.eq(mbMemberGrade.siteId))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(mbMemberGrade.gradeCd)));
    }

    /* 회원 등급 키조회 */
    @Override
    public Optional<MbMemberGradeDto.Item> selectById(String memberGradeId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberGrade.memberGradeId.eq(memberGradeId)).fetchOne());
    }

    /* 회원 등급 목록조회 */
    @Override
    public List<MbMemberGradeDto.Item> selectList(MbMemberGradeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberGradeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andSiteIdEq(search),
                    andMemberGradeIdEq(search),
                    andUseYnEq(search),
                    andDateRangeBetween(search),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 회원 등급 페이지조회 */
    @Override
    public MbMemberGradeDto.PageResponse selectPageData(MbMemberGradeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andMemberGradeIdEq(search),
                andUseYnEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberGradeDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberGradeDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberGrade.count())
                .where(wheres)
                .fetchOne();

        MbMemberGradeDto.PageResponse res = new MbMemberGradeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "gradeNm,gradeCd" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(MbMemberGradeDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? mbMemberGrade.siteId.eq(search.getSiteId()) : null;
    }

    /* memberGradeId 정확 일치 */
    private BooleanExpression andMemberGradeIdEq(MbMemberGradeDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberGradeId())
                ? mbMemberGrade.memberGradeId.eq(search.getMemberGradeId()) : null;
    }

    /* useYn 정확 일치 (사용여부 드롭다운) */
    private BooleanExpression andUseYnEq(MbMemberGradeDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? mbMemberGrade.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(MbMemberGradeDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return mbMemberGrade.regDate.goe(start).and(mbMemberGrade.regDate.lt(endExcl));
            case "upd_date": return mbMemberGrade.updDate.goe(start).and(mbMemberGrade.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(MbMemberGradeDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",gradeCd,", mbMemberGrade.gradeCd, pattern);
        or = orLike(or, all, types, ",gradeNm,", mbMemberGrade.gradeNm, pattern);
        or = orLike(or, all, types, ",memberGradeId,", mbMemberGrade.memberGradeId, pattern);
        or = orLike(or, all, types, ",siteId,", mbMemberGrade.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", mbMemberGrade.useYn, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
            orders.add(new OrderSpecifier(Order.DESC, mbMemberGrade.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberGrade.memberGradeId));
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
                    orders.add(new OrderSpecifier(order, mbMemberGrade.memberGradeId));
                } else if ("gradeNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberGrade.gradeNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberGrade.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMemberGrade.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberGrade.memberGradeId));
        }
        return orders;
    }

    /* 회원 등급 수정 */


    @Override
    public int updateSelective(MbMemberGrade entity) {
        if (entity.getMemberGradeId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberGrade);
        boolean hasAny = false;
        if (entity.getSiteId()         != null) { update.set(mbMemberGrade.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getGradeCd()        != null) { update.set(mbMemberGrade.gradeCd,        entity.getGradeCd());        hasAny = true; }
        if (entity.getGradeNm()        != null) { update.set(mbMemberGrade.gradeNm,        entity.getGradeNm());        hasAny = true; }
        if (entity.getGradeRank()      != null) { update.set(mbMemberGrade.gradeRank,      entity.getGradeRank());      hasAny = true; }
        if (entity.getMinPurchaseAmt() != null) { update.set(mbMemberGrade.minPurchaseAmt, entity.getMinPurchaseAmt()); hasAny = true; }
        if (entity.getSaveRate()       != null) { update.set(mbMemberGrade.saveRate,       entity.getSaveRate());       hasAny = true; }
        if (entity.getUseYn()          != null) { update.set(mbMemberGrade.useYn,          entity.getUseYn());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(mbMemberGrade.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbMemberGrade.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberGrade.memberGradeId.eq(entity.getMemberGradeId())).execute();
    }
}
