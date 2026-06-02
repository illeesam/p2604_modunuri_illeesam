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
    private static final QMbMemberAddr mbMemberAddr   = QMbMemberAddr.mbMemberAddr;
    private static final QMbMember     mbMember = QMbMember.mbMember;
    private static final QSySite       sySite = QSySite.sySite;

    /* 회원 주소 baseSelColumnQuery */
    private JPAQuery<MbMemberAddrDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberAddrDto.Item.class,
                        mbMemberAddr.memberAddrId, mbMemberAddr.memberId,
                        mbMemberAddr.addrNm, mbMemberAddr.recvNm, mbMemberAddr.recvPhone,
                        mbMemberAddr.zipCd.as("zipCode"),
                        mbMemberAddr.addr, mbMemberAddr.addrDetail,
                        mbMemberAddr.isDefault.as("defaultYn"),
                        mbMemberAddr.regBy, mbMemberAddr.regDate, mbMemberAddr.updBy, mbMemberAddr.updDate
                ))
                .from(mbMemberAddr)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbMemberAddr.memberId))
                .leftJoin(sySite).on(sySite.siteId.eq(mbMemberAddr.siteId));
    }

    /* 회원 주소 키조회 */
    @Override
    public Optional<MbMemberAddrDto.Item> selectById(String memberAddrId) {
        return Optional.ofNullable(baseSelColumnQuery().where(mbMemberAddr.memberAddrId.eq(memberAddrId)).fetchOne());
    }

    /* 회원 주소 목록조회 */
    @Override
    public List<MbMemberAddrDto.Item> selectList(MbMemberAddrDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberAddrDto.Item> query = baseSelColumnQuery().where(
                baseAndMemberIds(search),
                baseAndMemberAddrId(search),
                baseAndMemberId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* 회원 주소 페이지조회 */
    @Override
    public MbMemberAddrDto.PageResponse selectPageData(MbMemberAddrDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndMemberIds(search),
                baseAndMemberAddrId(search),
                baseAndMemberId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<MbMemberAddrDto.Item> query = baseSelColumnQuery().where(wheres);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberAddrDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory.select(mbMemberAddr.count()).from(mbMemberAddr).where(wheres).fetchOne();

        MbMemberAddrDto.PageResponse res = new MbMemberAddrDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "addrNm,recvNm" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* memberId IN */
    private BooleanExpression baseAndMemberIds(MbMemberAddrDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getMemberIds())
                ? mbMemberAddr.memberId.in(search.getMemberIds()) : null;
    }

    /* memberAddrId 정확 일치 */
    private BooleanExpression baseAndMemberAddrId(MbMemberAddrDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberAddrId())
                ? mbMemberAddr.memberAddrId.eq(search.getMemberAddrId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(MbMemberAddrDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? mbMemberAddr.memberId.eq(search.getMemberId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(MbMemberAddrDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return mbMemberAddr.regDate.goe(start).and(mbMemberAddr.regDate.lt(endExcl));
            case "upd_date": return mbMemberAddr.updDate.goe(start).and(mbMemberAddr.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(MbMemberAddrDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",addr,", mbMemberAddr.addr, pattern);
        or = orLike(or, all, types, ",addrDetail,", mbMemberAddr.addrDetail, pattern);
        or = orLike(or, all, types, ",addrNm,", mbMemberAddr.addrNm, pattern);
        or = orLike(or, all, types, ",isDefault,", mbMemberAddr.isDefault, pattern);
        or = orLike(or, all, types, ",memberAddrId,", mbMemberAddr.memberAddrId, pattern);
        or = orLike(or, all, types, ",memberId,", mbMemberAddr.memberId, pattern);
        or = orLike(or, all, types, ",recvNm,", mbMemberAddr.recvNm, pattern);
        or = orLike(or, all, types, ",recvPhone,", mbMemberAddr.recvPhone, pattern);
        or = orLike(or, all, types, ",siteId,", mbMemberAddr.siteId, pattern);
        or = orLike(or, all, types, ",zipCd,", mbMemberAddr.zipCd, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, mbMemberAddr.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberAddr.memberAddrId));
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
                    orders.add(new OrderSpecifier(order, mbMemberAddr.memberAddrId));
                } else if ("addrNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberAddr.addrNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberAddr.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMemberAddr.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberAddr.memberAddrId));
        }
        return orders;
    }

    /* 회원 주소 수정 */


    @Override
    public int updateSelective(MbMemberAddr entity) {
        if (entity.getMemberAddrId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberAddr);
        boolean hasAny = false;
        if (entity.getSiteId()     != null) { update.set(mbMemberAddr.siteId,     entity.getSiteId());     hasAny = true; }
        if (entity.getMemberId()   != null) { update.set(mbMemberAddr.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getAddrNm()     != null) { update.set(mbMemberAddr.addrNm,     entity.getAddrNm());     hasAny = true; }
        if (entity.getRecvNm()     != null) { update.set(mbMemberAddr.recvNm,     entity.getRecvNm());     hasAny = true; }
        if (entity.getRecvPhone()  != null) { update.set(mbMemberAddr.recvPhone,  entity.getRecvPhone());  hasAny = true; }
        if (entity.getZipCd()      != null) { update.set(mbMemberAddr.zipCd,      entity.getZipCd());      hasAny = true; }
        if (entity.getAddr()       != null) { update.set(mbMemberAddr.addr,       entity.getAddr());       hasAny = true; }
        if (entity.getAddrDetail() != null) { update.set(mbMemberAddr.addrDetail, entity.getAddrDetail()); hasAny = true; }
        if (entity.getIsDefault()  != null) { update.set(mbMemberAddr.isDefault,  entity.getIsDefault());  hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(mbMemberAddr.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbMemberAddr.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberAddr.memberAddrId.eq(entity.getMemberAddrId())).execute();
    }
}
