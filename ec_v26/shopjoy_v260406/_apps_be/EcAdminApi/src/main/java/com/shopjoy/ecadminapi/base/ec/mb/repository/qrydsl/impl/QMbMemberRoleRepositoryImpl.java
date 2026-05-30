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
    private static final QMbMemberRole r   = QMbMemberRole.mbMemberRole;
    private static final QMbMember     mem = QMbMember.mbMember;
    private static final QSyRole       rol = QSyRole.syRole;
    private static final QSyUser       gu  = new QSyUser("gu");

    /* 회원 역할 연결 키조회 */
    @Override
    public Optional<MbMemberRoleDto.Item> selectById(String memberRoleId) {
        return Optional.ofNullable(baseQuery().where(r.memberRoleId.eq(memberRoleId)).fetchOne());
    }

    /* 회원 역할 연결 목록조회 */
    @Override
    public List<MbMemberRoleDto.Item> selectList(MbMemberRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberRoleDto.Item> query = baseQuery().where(
                andMemberRoleId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 회원 역할 연결 페이지조회 */
    @Override
    public MbMemberRoleDto.PageResponse selectPageList(MbMemberRoleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberRoleDto.Item> query = baseQuery().where(
                andMemberRoleId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberRoleDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(r.count()).from(r).where(
                andMemberRoleId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        MbMemberRoleDto.PageResponse res = new MbMemberRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 회원 역할 연결 baseQuery */
    private JPAQuery<MbMemberRoleDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberRoleDto.Item.class,
                        r.memberRoleId, r.memberId, r.roleId, r.grantUserId,
                        r.grantDate, r.validFrom, r.validTo, r.memberRoleRemark,
                        r.regBy, r.regDate, r.updBy, r.updDate,
                        mem.memberNm.as("memberNm"),
                        rol.roleNm.as("roleNm"),
                        gu.userNm.as("grantUserNm")
                ))
                .from(r)
                .leftJoin(mem).on(mem.memberId.eq(r.memberId))
                .leftJoin(rol).on(rol.roleId.eq(r.roleId))
                .leftJoin(gu).on(gu.userId.eq(r.grantUserId));
    }

    /* 회원 역할 연결 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* memberRoleId 정확 일치 */
    private BooleanExpression andMemberRoleId(MbMemberRoleDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberRoleId())
                ? r.memberRoleId.eq(search.getMemberRoleId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(MbMemberRoleDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return r.regDate.goe(start).and(r.regDate.lt(endExcl));
            case "upd_date": return r.updDate.goe(start).and(r.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(MbMemberRoleDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",grantUserId,", r.grantUserId, pattern);
        or = orLike(or, all, types, ",memberId,", r.memberId, pattern);
        or = orLike(or, all, types, ",memberRoleId,", r.memberRoleId, pattern);
        or = orLike(or, all, types, ",memberRoleRemark,", r.memberRoleRemark, pattern);
        or = orLike(or, all, types, ",roleId,", r.roleId, pattern);
        or = orLike(or, all, types, ",siteId,", r.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.memberRoleId));
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
                    orders.add(new OrderSpecifier(order, r.memberRoleId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, r.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, r.memberRoleId));
        }
        return orders;
    }

    /* 회원 역할 연결 수정 */
    @Override
    public int updateSelective(MbMemberRole entity) {
        if (entity.getMemberRoleId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;
        if (entity.getMemberId()         != null) { update.set(r.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getRoleId()           != null) { update.set(r.roleId,           entity.getRoleId());           hasAny = true; }
        if (entity.getGrantUserId()      != null) { update.set(r.grantUserId,      entity.getGrantUserId());      hasAny = true; }
        if (entity.getGrantDate()        != null) { update.set(r.grantDate,        entity.getGrantDate());        hasAny = true; }
        if (entity.getValidFrom()        != null) { update.set(r.validFrom,        entity.getValidFrom());        hasAny = true; }
        if (entity.getValidTo()          != null) { update.set(r.validTo,          entity.getValidTo());          hasAny = true; }
        if (entity.getMemberRoleRemark() != null) { update.set(r.memberRoleRemark, entity.getMemberRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(r.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(r.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(r.memberRoleId.eq(entity.getMemberRoleId())).execute();
    }
}
