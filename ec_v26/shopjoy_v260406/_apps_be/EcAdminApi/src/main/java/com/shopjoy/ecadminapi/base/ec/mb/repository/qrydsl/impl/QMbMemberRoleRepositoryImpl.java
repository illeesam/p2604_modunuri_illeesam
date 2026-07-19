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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRoleRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QMbMemberRoleRepositoryImpl implements QMbMemberRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberRoleRepositoryImpl";
    private static final QMbMemberRole mbMemberRole   = QMbMemberRole.mbMemberRole;
    private static final QMbMember     mbMember = QMbMember.mbMember;
    private static final QSyRole       syRole = QSyRole.syRole;
    private static final QSyUser       gu  = new QSyUser("gu");

    /* 회원 역할 연결 baseSelColumnQuery */
    private JPAQuery<MbMemberRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberRoleDto.Item.class,
                        mbMemberRole.memberRoleId, mbMemberRole.memberId, mbMemberRole.roleId, mbMemberRole.grantUserId,
                        mbMemberRole.grantDate, mbMemberRole.validFrom, mbMemberRole.validTo, mbMemberRole.memberRoleRemark,
                        mbMemberRole.regBy, mbMemberRole.regDate, mbMemberRole.updBy, mbMemberRole.updDate,
                        mbMember.memberNm.as("memberNm"),
                        syRole.roleNm.as("roleNm"),
                        gu.userNm.as("grantUserNm")
                ))
                .from(mbMemberRole)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbMemberRole.memberId))
                .leftJoin(syRole).on(syRole.roleId.eq(mbMemberRole.roleId))
                .leftJoin(gu).on(gu.userId.eq(mbMemberRole.grantUserId));
    }

    /* 회원 역할 연결 키조회 */
    @Override
    public Optional<MbMemberRoleDto.Item> selectById(String memberRoleId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberRole.memberRoleId.eq(memberRoleId)).fetchOne());
    }

    /* 회원 역할 연결 목록조회 */
    @Override
    public List<MbMemberRoleDto.Item> selectList(MbMemberRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    andMemberRoleIdEq(search),
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

    /* 회원 역할 연결 페이지조회 */
    @Override
    public MbMemberRoleDto.PageResponse selectPageData(MbMemberRoleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andMemberRoleIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberRoleDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberRoleDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberRole.count())
                .where(wheres)
                .fetchOne();

        MbMemberRoleDto.PageResponse res = new MbMemberRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* 회원 역할 연결 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* memberRoleId 정확 일치 */
    private BooleanExpression andMemberRoleIdEq(MbMemberRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberRoleId())
                ? mbMemberRole.memberRoleId.eq(search.getMemberRoleId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(MbMemberRoleDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return mbMemberRole.regDate.goe(start).and(mbMemberRole.regDate.lt(endExcl));
            case "upd_date": return mbMemberRole.updDate.goe(start).and(mbMemberRole.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(MbMemberRoleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",grantUserId,", mbMemberRole.grantUserId, pattern);
        or = orLike(or, all, types, ",memberId,", mbMemberRole.memberId, pattern);
        or = orLike(or, all, types, ",memberRoleId,", mbMemberRole.memberRoleId, pattern);
        or = orLike(or, all, types, ",memberRoleRemark,", mbMemberRole.memberRoleRemark, pattern);
        or = orLike(or, all, types, ",roleId,", mbMemberRole.roleId, pattern);
        or = orLike(or, all, types, ",siteId,", mbMemberRole.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbMemberRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberRole.memberRoleId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberRoleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberRole.memberRoleId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberRole.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMemberRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberRole.memberRoleId));
        }
        return orders;
    }

    /* 회원 역할 연결 수정 */


    @Override
    public int updateSelective(MbMemberRole entity) {
        if (entity.getMemberRoleId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberRole);
        boolean hasAny = false;
        if (entity.getMemberId()         != null) { update.set(mbMemberRole.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getRoleId()           != null) { update.set(mbMemberRole.roleId,           entity.getRoleId());           hasAny = true; }
        if (entity.getGrantUserId()      != null) { update.set(mbMemberRole.grantUserId,      entity.getGrantUserId());      hasAny = true; }
        if (entity.getGrantDate()        != null) { update.set(mbMemberRole.grantDate,        entity.getGrantDate());        hasAny = true; }
        if (entity.getValidFrom()        != null) { update.set(mbMemberRole.validFrom,        entity.getValidFrom());        hasAny = true; }
        if (entity.getValidTo()          != null) { update.set(mbMemberRole.validTo,          entity.getValidTo());          hasAny = true; }
        if (entity.getMemberRoleRemark() != null) { update.set(mbMemberRole.memberRoleRemark, entity.getMemberRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(mbMemberRole.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbMemberRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberRole.memberRoleId.eq(entity.getMemberRoleId())).execute();
    }
}
