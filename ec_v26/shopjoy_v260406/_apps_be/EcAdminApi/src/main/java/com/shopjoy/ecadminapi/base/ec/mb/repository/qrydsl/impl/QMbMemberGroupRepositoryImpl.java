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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGroupRepository;
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
public class QMbMemberGroupRepositoryImpl implements QMbMemberGroupRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberGroupRepositoryImpl";
    private static final QMbMemberGroup mbMemberGroup   = QMbMemberGroup.mbMemberGroup;
    private static final QSySite        sySite = QSySite.sySite;

    /* 회원 그룹 baseSelColumnQuery */
    private JPAQuery<MbMemberGroupDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberGroupDto.Item.class,
                        mbMemberGroup.memberGroupId, mbMemberGroup.siteId, mbMemberGroup.groupNm, mbMemberGroup.groupMemo, mbMemberGroup.useYn,
                        mbMemberGroup.regBy, mbMemberGroup.regDate, mbMemberGroup.updBy, mbMemberGroup.updDate
                ))
                .from(mbMemberGroup)
                .leftJoin(sySite).on(sySite.siteId.eq(mbMemberGroup.siteId));
    }

    /* 회원 그룹 키조회 */
    @Override
    public Optional<MbMemberGroupDto.Item> selectById(String memberGroupId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberGroup.memberGroupId.eq(memberGroupId)).fetchOne());
    }

    /* 회원 그룹 목록조회 */
    @Override
    public List<MbMemberGroupDto.Item> selectList(MbMemberGroupDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberGroupDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndMemberGroupId(search),
                    baseAndUseYn(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
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

    /* 회원 그룹 페이지조회 */
    @Override
    public MbMemberGroupDto.PageResponse selectPageData(MbMemberGroupDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndMemberGroupId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberGroupDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberGroupDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberGroup.count())
                .where(wheres)
                .fetchOne();

        MbMemberGroupDto.PageResponse res = new MbMemberGroupDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "groupNm" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(MbMemberGroupDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? mbMemberGroup.siteId.eq(search.getSiteId()) : null;
    }

    /* memberGroupId 정확 일치 */
    private BooleanExpression baseAndMemberGroupId(MbMemberGroupDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberGroupId())
                ? mbMemberGroup.memberGroupId.eq(search.getMemberGroupId()) : null;
    }

    /* useYn 정확 일치 (사용여부 드롭다운) */
    private BooleanExpression baseAndUseYn(MbMemberGroupDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? mbMemberGroup.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(MbMemberGroupDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return mbMemberGroup.regDate.goe(start).and(mbMemberGroup.regDate.lt(endExcl));
            case "upd_date": return mbMemberGroup.updDate.goe(start).and(mbMemberGroup.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(MbMemberGroupDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",groupMemo,", mbMemberGroup.groupMemo, pattern);
        or = orLike(or, all, types, ",groupNm,", mbMemberGroup.groupNm, pattern);
        or = orLike(or, all, types, ",memberGroupId,", mbMemberGroup.memberGroupId, pattern);
        or = orLike(or, all, types, ",siteId,", mbMemberGroup.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", mbMemberGroup.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberGroupDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbMemberGroup.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberGroup.memberGroupId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberGroupId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberGroup.memberGroupId));
                } else if ("groupNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberGroup.groupNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberGroup.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMemberGroup.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberGroup.memberGroupId));
        }
        return orders;
    }

    /* 회원 그룹 수정 */


    @Override
    public int updateSelective(MbMemberGroup entity) {
        if (entity.getMemberGroupId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberGroup);
        boolean hasAny = false;
        if (entity.getSiteId()    != null) { update.set(mbMemberGroup.siteId,    entity.getSiteId());    hasAny = true; }
        if (entity.getGroupNm()   != null) { update.set(mbMemberGroup.groupNm,   entity.getGroupNm());   hasAny = true; }
        if (entity.getGroupMemo() != null) { update.set(mbMemberGroup.groupMemo, entity.getGroupMemo()); hasAny = true; }
        if (entity.getUseYn()     != null) { update.set(mbMemberGroup.useYn,     entity.getUseYn());     hasAny = true; }
        if (entity.getUpdBy()     != null) { update.set(mbMemberGroup.updBy,     entity.getUpdBy());     hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbMemberGroup.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberGroup.memberGroupId.eq(entity.getMemberGroupId())).execute();
    }
}
