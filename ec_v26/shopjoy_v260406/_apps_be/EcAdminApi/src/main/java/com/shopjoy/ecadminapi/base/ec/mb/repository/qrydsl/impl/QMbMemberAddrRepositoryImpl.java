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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberAddrRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@RequiredArgsConstructor
public class QMbMemberAddrRepositoryImpl implements QMbMemberAddrRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberAddrRepositoryImpl";
    private static final QMbMemberAddr a   = QMbMemberAddr.mbMemberAddr;
    private static final QMbMember     mem = QMbMember.mbMember;
    private static final QSySite       ste = QSySite.sySite;

    /* 회원 주소 키조회 */
    @Override
    public Optional<MbMemberAddrDto.Item> selectById(String memberAddrId) {
        return Optional.ofNullable(baseQuery().where(a.memberAddrId.eq(memberAddrId)).fetchOne());
    }

    /* 회원 주소 목록조회 */
    @Override
    public List<MbMemberAddrDto.Item> selectList(MbMemberAddrDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberAddrDto.Item> query = baseQuery().where(
                andMemberIds(search),
                andMemberAddrId(search),
                andMemberId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 회원 주소 페이지조회 */
    @Override
    public MbMemberAddrDto.PageResponse selectPageList(MbMemberAddrDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberAddrDto.Item> query = baseQuery().where(
                andMemberIds(search),
                andMemberAddrId(search),
                andMemberId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberAddrDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                andMemberIds(search),
                andMemberAddrId(search),
                andMemberId(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        MbMemberAddrDto.PageResponse res = new MbMemberAddrDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 회원 주소 baseQuery */
    private JPAQuery<MbMemberAddrDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberAddrDto.Item.class,
                        a.memberAddrId, a.memberId,
                        a.addrNm, a.recvNm, a.recvPhone,
                        a.zipCd.as("zipCode"),
                        a.addr, a.addrDetail,
                        a.isDefault.as("defaultYn"),
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a)
                .leftJoin(mem).on(mem.memberId.eq(a.memberId))
                .leftJoin(ste).on(ste.siteId.eq(a.siteId));
    }

    /* searchType 사용 예  searchType = "addrNm,recvNm" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* memberId IN */
    private BooleanExpression andMemberIds(MbMemberAddrDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getMemberIds())
                ? a.memberId.in(search.getMemberIds()) : null;
    }

    /* memberAddrId 정확 일치 */
    private BooleanExpression andMemberAddrId(MbMemberAddrDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberAddrId())
                ? a.memberAddrId.eq(search.getMemberAddrId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression andMemberId(MbMemberAddrDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? a.memberId.eq(search.getMemberId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(MbMemberAddrDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(MbMemberAddrDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",addr,", a.addr, pattern);
        or = orLike(or, all, types, ",addrDetail,", a.addrDetail, pattern);
        or = orLike(or, all, types, ",addrNm,", a.addrNm, pattern);
        or = orLike(or, all, types, ",isDefault,", a.isDefault, pattern);
        or = orLike(or, all, types, ",memberAddrId,", a.memberAddrId, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",recvNm,", a.recvNm, pattern);
        or = orLike(or, all, types, ",recvPhone,", a.recvPhone, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",zipCd,", a.zipCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberAddrDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.memberAddrId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberAddrId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.memberAddrId));
                } else if ("addrNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.addrNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.memberAddrId));
        }
        return orders;
    }

    /* 회원 주소 수정 */
    @Override
    public int updateSelective(MbMemberAddr entity) {
        if (entity.getMemberAddrId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;
        if (entity.getSiteId()     != null) { update.set(a.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getMemberId()   != null) { update.set(a.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getAddrNm()     != null) { update.set(a.addrNm,     entity.getAddrNm());     hasAny = true; }
        if (entity.getRecvNm()     != null) { update.set(a.recvNm,     entity.getRecvNm());     hasAny = true; }
        if (entity.getRecvPhone()  != null) { update.set(a.recvPhone,  entity.getRecvPhone());  hasAny = true; }
        if (entity.getZipCd()      != null) { update.set(a.zipCd,      entity.getZipCd());      hasAny = true; }
        if (entity.getAddr()       != null) { update.set(a.addr,       entity.getAddr());       hasAny = true; }
        if (entity.getAddrDetail() != null) { update.set(a.addrDetail, entity.getAddrDetail()); hasAny = true; }
        if (entity.getIsDefault()  != null) { update.set(a.isDefault,  entity.getIsDefault());  hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(a.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(a.memberAddrId.eq(entity.getMemberAddrId())).execute();
    }
}
