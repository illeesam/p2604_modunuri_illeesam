package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberSnsRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
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
public class QMbMemberSnsRepositoryImpl implements QMbMemberSnsRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberSnsRepositoryImpl";
    private static final QMbMemberSns mbMemberSns    = QMbMemberSns.mbMemberSns;
    private static final QMbMember    mbMember  = QMbMember.mbMember;
    private static final QSyCode      cdSc = new QSyCode("cd_sc");

    /* SNS 연동 회원 baseSelColumnQuery */
    private JPAQuery<MbMemberSnsDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberSnsDto.Item.class,
                        mbMemberSns.memberSnsId, mbMemberSns.memberId, mbMemberSns.snsChannelCd, mbMemberSns.snsUserId,
                        mbMemberSns.regBy, mbMemberSns.regDate
                ))
                .from(mbMemberSns)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbMemberSns.memberId))
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SNS_CHANNEL").and(cdSc.codeValue.eq(mbMemberSns.snsChannelCd)));
    }

    /* SNS 연동 회원 키조회 */
    @Override
    public Optional<MbMemberSnsDto.Item> selectById(String memberSnsId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberSns.memberSnsId.eq(memberSnsId)).fetchOne());
    }

    /* SNS 연동 회원 목록조회 */
    @Override
    public List<MbMemberSnsDto.Item> selectList(MbMemberSnsDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberSnsDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndMemberIds(search),
                    baseAndMemberId(search),
                    baseAndMemberSnsId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0)
            query.offset((long)(pageNo - 1) * pageSize).limit(pageSize);
        return query.fetch();
    }

    /* SNS 연동 회원 페이지조회 */
    @Override
    public MbMemberSnsDto.PageResponse selectPageData(MbMemberSnsDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndMemberIds(search),
                baseAndMemberId(search),
                baseAndMemberSnsId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<MbMemberSnsDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<MbMemberSnsDto.Item> content = query.offset((long)(pageNo - 1) * pageSize).limit(pageSize).fetch();

        Long total = queryFactory
                .select(mbMemberSns.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .from(mbMemberSns)
                .where(wheres)
                .fetchOne();

        MbMemberSnsDto.PageResponse res = new MbMemberSnsDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* SNS 연동 회원 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* memberId IN */
    private BooleanExpression baseAndMemberIds(MbMemberSnsDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getMemberIds())
                ? mbMemberSns.memberId.in(search.getMemberIds()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(MbMemberSnsDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? mbMemberSns.memberId.eq(search.getMemberId()) : null;
    }

    /* memberSnsId 정확 일치 */
    private BooleanExpression baseAndMemberSnsId(MbMemberSnsDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberSnsId())
                ? mbMemberSns.memberSnsId.eq(search.getMemberSnsId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(MbMemberSnsDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return mbMemberSns.regDate.goe(start).and(mbMemberSns.regDate.lt(endExcl));
            case "upd_date": return mbMemberSns.updDate.goe(start).and(mbMemberSns.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(MbMemberSnsDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",memberId,", mbMemberSns.memberId, pattern);
        or = orLike(or, all, types, ",memberSnsId,", mbMemberSns.memberSnsId, pattern);
        or = orLike(or, all, types, ",siteId,", mbMemberSns.siteId, pattern);
        or = orLike(or, all, types, ",snsChannelCd,", mbMemberSns.snsChannelCd, pattern);
        or = orLike(or, all, types, ",snsUserId,", mbMemberSns.snsUserId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(MbMemberSnsDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbMemberSns.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberSns.memberSnsId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberSnsId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberSns.memberSnsId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberSns.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMemberSns.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberSns.memberSnsId));
        }
        return orders;
    }

    /* SNS 연동 회원 수정 */


    @Override
    public int updateSelective(MbMemberSns entity) {
        if (entity.getMemberSnsId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberSns);
        boolean hasAny = false;
        if (entity.getMemberId()     != null) { update.set(mbMemberSns.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getSnsChannelCd() != null) { update.set(mbMemberSns.snsChannelCd, entity.getSnsChannelCd()); hasAny = true; }
        if (entity.getSnsUserId()    != null) { update.set(mbMemberSns.snsUserId,    entity.getSnsUserId());    hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(mbMemberSns.memberSnsId.eq(entity.getMemberSnsId())).execute();
    }
}
