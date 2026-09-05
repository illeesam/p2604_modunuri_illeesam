package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberAddrRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

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
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMbMemberAddr mbMemberAddr   = QMbMemberAddr.mbMemberAddr;
    private static final QMbMember     mbMember = QMbMember.mbMember;
    private static final QSySite       sySite = QSySite.sySite;    /*
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
                        mbMemberAddr.updDate,                   // 수정일
                        mbMemberAddr.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        mbMemberAddr.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(mbMemberAddr)
                .innerJoin(mbMember).on(mbMember.memberId.eq(mbMemberAddr.memberId)) // 회원
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mbMemberAddr.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mbMemberAddr.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(mbMemberAddr.siteId)) // 사이트

                ;
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(mbMemberAddr.memberId, search.getMemberIds())); // 상위 FK 다건 IN
        whereList.add(QdslUtil.strEq(mbMemberAddr.memberAddrId, search.getMemberAddrId())); // 배송지ID 필터
        whereList.add(QdslUtil.strEq(mbMemberAddr.memberId, search.getMemberId())); // 회원ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberAddr.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberAddr.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mbMemberAddr.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MbMemberAddrDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<MbMemberAddrDto.Item> list = query.fetch();
        return list;
    }

    /* 회원 주소 페이지조회 */
    @Override
    public BasePage<MbMemberAddrDto.Item> selectPageData(MbMemberAddrDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(mbMemberAddr.memberId, search.getMemberIds())); // 상위 FK 다건 IN
        whereList.add(QdslUtil.strEq(mbMemberAddr.memberAddrId, search.getMemberAddrId())); // 배송지ID 필터
        whereList.add(QdslUtil.strEq(mbMemberAddr.memberId, search.getMemberId())); // 회원ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberAddr.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberAddr.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mbMemberAddr.siteId, search.getSiteId())); // 사이트ID 필터
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<MbMemberAddrDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MbMemberAddrDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberAddr.count())
                .where(wheres)
                .fetchOne();

        BasePage<MbMemberAddrDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 예: "addr,addrDetail,addrNm,isDefault,memberAddrId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("addr", mbMemberAddr.addr), // 기본주소
            QdslUtil.FieldDef.like("addrDetail", mbMemberAddr.addrDetail), // 상세주소
            QdslUtil.FieldDef.like("addrNm", mbMemberAddr.addrNm), // 배송지명 (예: 집, 회사)
            QdslUtil.FieldDef.like("isDefault", mbMemberAddr.isDefault),
            QdslUtil.FieldDef.like("memberAddrId", mbMemberAddr.memberAddrId), // 배송지ID 필터
            QdslUtil.FieldDef.like("memberId", mbMemberAddr.memberId), // 회원ID 필터
            QdslUtil.FieldDef.like("recvNm", mbMemberAddr.recvNm), // 수령자명
            QdslUtil.FieldDef.like("recvPhone", mbMemberAddr.recvPhone), // 수령자 연락처
            QdslUtil.FieldDef.like("zipCd", mbMemberAddr.zipCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("memberAddrId", mbMemberAddr.memberAddrId,
                   "addrNm", mbMemberAddr.addrNm,
                   "regDate", mbMemberAddr.regDate),
        new OrderSpecifier<>(Order.DESC, mbMemberAddr.regDate),
        new OrderSpecifier<>(Order.ASC, mbMemberAddr.memberAddrId));
    }

    /* 회원 주소 수정 */
    @Override
    public int updateSelective(MbMemberAddr entity) {
        if (entity.getMemberAddrId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberAddr);
        boolean hasAny = false;
        if (entity.getMemberId()   != null) { update.set(mbMemberAddr.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getAddrNm()     != null) { update.set(mbMemberAddr.addrNm,     entity.getAddrNm());     hasAny = true; }
        if (entity.getRecvNm()     != null) { update.set(mbMemberAddr.recvNm,     entity.getRecvNm());     hasAny = true; }
        if (entity.getRecvPhone()  != null) { update.set(mbMemberAddr.recvPhone,  entity.getRecvPhone());  hasAny = true; }
        if (entity.getZipCd()      != null) { update.set(mbMemberAddr.zipCd,      entity.getZipCd());      hasAny = true; }
        if (entity.getAddr()       != null) { update.set(mbMemberAddr.addr,       entity.getAddr());       hasAny = true; }
        if (entity.getAddrDetail() != null) { update.set(mbMemberAddr.addrDetail, entity.getAddrDetail()); hasAny = true; }
        if (entity.getIsDefault()  != null) { update.set(mbMemberAddr.isDefault,  entity.getIsDefault());  hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(mbMemberAddr.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(mbMemberAddr.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberAddr.memberAddrId.eq(entity.getMemberAddrId())).execute();
    }
}
