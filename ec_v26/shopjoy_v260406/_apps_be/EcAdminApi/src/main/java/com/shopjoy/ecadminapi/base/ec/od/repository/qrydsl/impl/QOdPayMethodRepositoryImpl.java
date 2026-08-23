package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdPayMethodRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** OdPayMethod(마이페이지 등록 결제수단) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdPayMethodRepositoryImpl implements QOdPayMethodRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdPayMethodRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdPayMethod odPayMethod   = QOdPayMethod.odPayMethod;
    private static final QMbMember    mem = new QMbMember("mem");
    private static final QVwSyCode      codePayMethodTypeCd = new QVwSyCode("cd_pm");    /*
     * baseListQuery — 코드성 필드 예시 코드값 (DTO Item에 별칭 컬럼 없음 - 기본 필드만 매핑)
     * PAY_METHOD  {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
     */
    private JPAQuery<OdPayMethodDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdPayMethodDto.Item.class,
                        odPayMethod.payMethodId,      // 결제수단ID (YYMMDDhhmmss+rand4)
                        odPayMethod.memberId,         // 회원ID (mb_member.member_id)
                        odPayMethod.payMethodTypeCd,  // 결제수단유형코드 — PAY_METHOD {BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼츠, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제, SAVE:적립금결제, ZERO:0원결제}
                        codePayMethodTypeCd.codeLabel.as("payMethodTypeCdNm"), // 코드 라벨
                        odPayMethod.payMethodNm,      // 결제수단명 (카드사명, 은행명 등)
                        odPayMethod.payMethodAlias,   // 별칭 (사용자 설정)
                        odPayMethod.payKeyNo,         // 결제 게이트웨이 발급 키/토큰
                        odPayMethod.mainMethodYn,     // 기본결제수단여부 Y/N
                        odPayMethod.regBy,      // 등록자
                        odPayMethod.regDate,    // 등록일시
                        odPayMethod.updBy,      // 수정자
                        odPayMethod.updDate,    // 수정일시
                        odPayMethod.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(odPayMethod)
                .innerJoin(mem).on(mem.memberId.eq(odPayMethod.memberId)) // 회원
                .innerJoin(codePayMethodTypeCd).on(codePayMethodTypeCd.codeGrp.eq("PAY_METHOD").and(codePayMethodTypeCd.codeValue.eq(odPayMethod.payMethodTypeCd))) // 결제수단
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odPayMethod.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odPayMethod.regBy)) // 등록자
                ;
    }

    /* 결제수단 키조회 */
    @Override
    public Optional<OdPayMethodDto.Item> selectById(String payMethodId) {
        OdPayMethodDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odPayMethod.payMethodId.eq(payMethodId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 결제수단 목록조회 */
    @Override
    public List<OdPayMethodDto.Item> selectList(OdPayMethodDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odPayMethod.payMethodId, search.getPayMethodId())); // 결제수단ID (YYMMDDhhmmss+rand4)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPayMethod.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPayMethod.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdPayMethodDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<OdPayMethodDto.Item> list = query.fetch();
        return list;
    }

    /* 결제수단 페이지조회 */
    @Override
    public BasePage<OdPayMethodDto.Item> selectPageData(OdPayMethodDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odPayMethod.payMethodId, search.getPayMethodId())); // 결제수단ID (YYMMDDhhmmss+rand4)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPayMethod.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odPayMethod.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdPayMethodDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdPayMethodDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odPayMethod.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdPayMethodDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "mainMethodYn,memberId,payKeyNo,payMethodAlias,payMethodId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("mainMethodYn", odPayMethod.mainMethodYn), // 기본결제수단여부 Y/N
            QdslUtil.FieldDef.like("memberId", odPayMethod.memberId), // 회원ID (mb_member.member_id)
            QdslUtil.FieldDef.like("payKeyNo", odPayMethod.payKeyNo), // 결제 게이트웨이 발급 키/토큰
            QdslUtil.FieldDef.like("payMethodAlias", odPayMethod.payMethodAlias), // 별칭 (사용자 설정)
            QdslUtil.FieldDef.like("payMethodId", odPayMethod.payMethodId), // 결제수단ID (YYMMDDhhmmss+rand4)
            QdslUtil.FieldDef.like("payMethodNm", odPayMethod.payMethodNm), // 결제수단명 (카드사명, 은행명 등)
            QdslUtil.FieldDef.like("payMethodTypeCd", odPayMethod.payMethodTypeCd) // 결제수단유형코드 (코드: PAY_METHOD)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("payMethodId", odPayMethod.payMethodId,
                   "payMethodNm", odPayMethod.payMethodNm,
                   "regDate", odPayMethod.regDate),
        new OrderSpecifier<>(Order.DESC, odPayMethod.regDate),
        new OrderSpecifier<>(Order.ASC, odPayMethod.payMethodId));
    }

    /* 결제수단 수정 */
    @Override
    public int updateSelective(OdPayMethod entity) {
        if (entity.getPayMethodId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odPayMethod);
        boolean hasAny = false;

        if (entity.getMemberId()        != null) { update.set(odPayMethod.memberId,        entity.getMemberId());        hasAny = true; }
        if (entity.getPayMethodTypeCd() != null) { update.set(odPayMethod.payMethodTypeCd, entity.getPayMethodTypeCd()); hasAny = true; }
        if (entity.getPayMethodNm()     != null) { update.set(odPayMethod.payMethodNm,     entity.getPayMethodNm());     hasAny = true; }
        if (entity.getPayMethodAlias()  != null) { update.set(odPayMethod.payMethodAlias,  entity.getPayMethodAlias());  hasAny = true; }
        if (entity.getPayKeyNo()        != null) { update.set(odPayMethod.payKeyNo,        entity.getPayKeyNo());        hasAny = true; }
        if (entity.getMainMethodYn()    != null) { update.set(odPayMethod.mainMethodYn,    entity.getMainMethodYn());    hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(odPayMethod.updBy,           entity.getUpdBy());           hasAny = true; }
        update.set(odPayMethod.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odPayMethod.payMethodId.eq(entity.getPayMethodId())).execute();
        return (int) affected;
    }
}
