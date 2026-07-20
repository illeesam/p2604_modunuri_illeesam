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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberAddrRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbMemberAddrRepositoryImpl implements QMbMemberAddrRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberAddrRepositoryImpl";
    private static final QMbMemberAddr mbMemberAddr   = QMbMemberAddr.mbMemberAddr;
    private static final QMbMember     mbMember = QMbMember.mbMember;
    private static final QSySite       sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", mbMemberAddr.regDate,
        "upd_date", mbMemberAddr.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("addr", mbMemberAddr.addr),
        Map.entry("addrDetail", mbMemberAddr.addrDetail),
        Map.entry("addrNm", mbMemberAddr.addrNm),
        Map.entry("isDefault", mbMemberAddr.isDefault),
        Map.entry("memberAddrId", mbMemberAddr.memberAddrId),
        Map.entry("memberId", mbMemberAddr.memberId),
        Map.entry("recvNm", mbMemberAddr.recvNm),
        Map.entry("recvPhone", mbMemberAddr.recvPhone),
        Map.entry("siteId", mbMemberAddr.siteId),
        Map.entry("zipCd", mbMemberAddr.zipCd)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * IS_DEFAULT (defaultYn)  {Y: '기본배송지', N: '일반배송지'}
     */
    private JPAQuery<MbMemberAddrDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberAddrDto.Item.class,
                        mbMemberAddr.memberAddrId,             // 배송지ID (PK)
                        mbMemberAddr.memberId,                 // 회원ID (mb_member.member_id)
                        mbMemberAddr.addrNm,                   // 배송지명 (예: 집, 회사)
                        mbMemberAddr.recvNm,                   // 수령자명
                        mbMemberAddr.recvPhone,                // 수령자 연락처
                        mbMemberAddr.zipCd.as("zipCode"),       // 우편번호
                        mbMemberAddr.addr,                     // 기본주소
                        mbMemberAddr.addrDetail,                // 상세주소
                        mbMemberAddr.isDefault.as("defaultYn"), // 기본배송지여부 — IS_DEFAULT {Y: '기본배송지', N: '일반배송지'}
                        mbMemberAddr.regBy,                    // 등록자
                        mbMemberAddr.regDate,                  // 등록일
                        mbMemberAddr.updBy,                    // 수정자
                        mbMemberAddr.updDate                   // 수정일
                ))
                .from(mbMemberAddr)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbMemberAddr.memberId))
                .leftJoin(sySite).on(sySite.siteId.eq(mbMemberAddr.siteId));
    }

    /* 회원 주소 키조회 */
    @Override
    public Optional<MbMemberAddrDto.Item> selectById(String memberAddrId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberAddr.memberAddrId.eq(memberAddrId)).fetchOne());
    }

    /* 회원 주소 목록조회 */
    @Override
    public List<MbMemberAddrDto.Item> selectList(MbMemberAddrDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberAddrDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(mbMemberAddr.memberId, search.getMemberIds()),
                    QdslUtil.strEq(mbMemberAddr.memberAddrId, search.getMemberAddrId()),
                    QdslUtil.strEq(mbMemberAddr.memberId, search.getMemberId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
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

    /* 회원 주소 페이지조회 */
    @Override
    public MbMemberAddrDto.PageResponse selectPageData(MbMemberAddrDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(mbMemberAddr.memberId, search.getMemberIds()),
                QdslUtil.strEq(mbMemberAddr.memberAddrId, search.getMemberAddrId()),
                QdslUtil.strEq(mbMemberAddr.memberId, search.getMemberId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberAddrDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberAddrDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberAddr.count())
                .where(wheres)
                .fetchOne();

        MbMemberAddrDto.PageResponse res = new MbMemberAddrDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "addrNm,recvNm" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(MbMemberAddrDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
