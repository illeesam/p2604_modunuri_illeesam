package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** MbMember QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMbMemberRepositoryImpl implements QMbMemberRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberRepositoryImpl";
    private static final QMbMember mbMember     = QMbMember.mbMember;
    private static final QSySite   sySite     = QSySite.sySite;
    private static final QSyCode   cdGr  = new QSyCode("cd_gr");
    private static final QSyCode   cdMs  = new QSyCode("cd_ms");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "join_date", mbMember.joinDate,
        "reg_date", mbMember.regDate,
        "upd_date", mbMember.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("gradeCd", mbMember.gradeCd),
        Map.entry("loginId", mbMember.loginId),
        Map.entry("loginPwdHash", mbMember.loginPwdHash),
        Map.entry("memberAddr", mbMember.memberAddr),
        Map.entry("memberAddrDetail", mbMember.memberAddrDetail),
        Map.entry("memberGender", mbMember.memberGender),
        Map.entry("memberId", mbMember.memberId),
        Map.entry("memberMemo", mbMember.memberMemo),
        Map.entry("memberNm", mbMember.memberNm),
        Map.entry("memberPhone", mbMember.memberPhone),
        Map.entry("memberStatusCd", mbMember.memberStatusCd),
        Map.entry("memberStatusCdBefore", mbMember.memberStatusCdBefore),
        Map.entry("memberZipCode", mbMember.memberZipCode),
        Map.entry("siteId", mbMember.siteId)
    );

    private JPAQuery<MbMemberDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberDto.Item.class,
                        mbMember.memberId, mbMember.siteId, mbMember.loginId, mbMember.memberNm, mbMember.memberPhone,
                        mbMember.memberGender, mbMember.birthDate,
                        mbMember.gradeCd, mbMember.memberStatusCd, mbMember.memberStatusCdBefore,
                        mbMember.joinDate, mbMember.lastLogin,
                        mbMember.orderCount, mbMember.totalPurchaseAmt, mbMember.cacheBalanceAmt,
                        mbMember.memberZipCode, mbMember.memberAddr, mbMember.memberAddrDetail, mbMember.memberMemo,
                        mbMember.regBy, mbMember.regDate, mbMember.updBy, mbMember.updDate,
                        sySite.siteNm.as("siteNm"),
                        cdGr.codeLabel.as("gradeCdNm"),
                        cdMs.codeLabel.as("memberStatusCdNm")
                ))
                .from(mbMember)
                .leftJoin(sySite).on(sySite.siteId.eq(mbMember.siteId))
                .leftJoin(cdGr).on(cdGr.codeGrp.eq("MEMBER_GRADE").and(cdGr.codeValue.eq(mbMember.gradeCd)))
                .leftJoin(cdMs).on(cdMs.codeGrp.eq("MEMBER_STATUS").and(cdMs.codeValue.eq(mbMember.memberStatusCd)));
    }

    /* 회원 키조회 */
    @Override
    public Optional<MbMemberDto.Item> selectById(String memberId) {
        MbMemberDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(mbMember.memberId.eq(memberId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 회원 목록조회 */
    @Override
    public List<MbMemberDto.Item> selectList(MbMemberDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<MbMemberDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(mbMember.siteId, search.getSiteId()),
                    QdslUtil.strEq(mbMember.memberId, search.getMemberId()),
                    QdslUtil.strEq(mbMember.gradeCd, search.getGradeCd()),
                    QdslUtil.strEq(mbMember.memberStatusCd, search.getMemberStatusCd()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 회원 페이지조회 */
    @Override
    public MbMemberDto.PageResponse selectPageData(MbMemberDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(mbMember.siteId, search.getSiteId()),
                QdslUtil.strEq(mbMember.memberId, search.getMemberId()),
                QdslUtil.strEq(mbMember.gradeCd, search.getGradeCd()),
                QdslUtil.strEq(mbMember.memberStatusCd, search.getMemberStatusCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMember.count())
                .where(wheres)
                .fetchOne();

        MbMemberDto.PageResponse res = new MbMemberDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 공용 base query */
    /* searchType 사용 예  searchType = "memberId,memberNm,loginId,memberPhone" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(MbMemberDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(MbMemberDto.Request sySite) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = sySite == null ? null : sySite.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbMember.joinDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMember.memberId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMember.memberId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMember.memberNm));
                } else if ("joinDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMember.joinDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMember.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMember.memberId));
        }
        return orders;
    }

    /* 회원 수정 */

    @Override
    public int updateSelective(MbMember entity) {
        if (entity.getMemberId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(mbMember);
        boolean hasAny = false;

        if (entity.getMemberStatusCd()       != null) { update.set(mbMember.memberStatusCd,       entity.getMemberStatusCd());       hasAny = true; }
        if (entity.getMemberStatusCdBefore() != null) { update.set(mbMember.memberStatusCdBefore, entity.getMemberStatusCdBefore()); hasAny = true; }
        if (entity.getGradeCd()              != null) { update.set(mbMember.gradeCd,              entity.getGradeCd());              hasAny = true; }
        if (entity.getMemberNm()             != null) { update.set(mbMember.memberNm,             entity.getMemberNm());             hasAny = true; }
        if (entity.getMemberPhone()          != null) { update.set(mbMember.memberPhone,          entity.getMemberPhone());          hasAny = true; }
        if (entity.getMemberMemo()           != null) { update.set(mbMember.memberMemo,           entity.getMemberMemo());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(mbMember.updBy,                entity.getUpdBy());                hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbMember.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(mbMember.memberId.eq(entity.getMemberId())).execute();
        return (int) affected;
    }
}
