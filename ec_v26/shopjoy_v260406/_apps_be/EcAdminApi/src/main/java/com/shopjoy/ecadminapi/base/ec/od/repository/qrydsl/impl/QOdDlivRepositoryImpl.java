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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.querydsl.jpa.JPAExpressions;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** OdDliv(배송 (1주문 N배송 가능 — 정상출고/반품반입/교환배송)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdDlivRepositoryImpl implements QOdDlivRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdDlivRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdDliv   odDliv     = QOdDliv.odDliv;
    private static final QOdOrder  odOrder    = QOdOrder.odOrder;
    private static final QSyVendor syVendor   = QSyVendor.syVendor;
    private static final QMbMember mbMemberEx = new QMbMember("mb_member_ex");
    private static final QSyVendor syVendorEx = new QSyVendor("sy_vendor_ex");
    private static final QVwSyCode   codeDlivStatusCd = new QVwSyCode("cd_ds");
    private static final QVwSyCode   codeDlivTypeCd = new QVwSyCode("cd_dt");
    private static final QVwSyCode   codeDlivDivCd = new QVwSyCode("cd_dd");
    private static final QVwSyCode   codeOutboundCourierCd = new QVwSyCode("cd_oc");
    private static final QVwSyCode   codeInboundCourierCd = new QVwSyCode("cd_ic");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * DLIV_TYPE  {NORMAL:정상배송, RETURN:반품, EXCHANGE:교환반품, EXCHANGE_OUT:교환출고}
     * DLIV_DIV   {OUTBOUND:출고(정상배송), INBOUND:입고(반품수거)}
     * DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
     * COURIER    {CJ:CJ대한통운, LOGEN:로젠택배, POST:우체국택배, HANJIN:한진택배, LOTTE:롯데택배, KYOUNGDONG:경동택배, DIRECT:직배송}
     */
    private JPAQuery<OdDlivDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdDlivDto.Item.class,
                        odDliv.dlivId,                // 배송ID (YYMMDDhhmmss+rand4)
                        odDliv.orderId,                // 주문ID (od_order.)
                        odDliv.vendorId,               // 출고 업체ID (벤더별 분리출고 시)
                        odDliv.dlivTypeCd,             // 배송유형 — DLIV_TYPE {NORMAL:정상배송, RETURN:반품, EXCHANGE:교환반품, EXCHANGE_OUT:교환출고}
                        odDliv.dlivDivCd,              // 입출고구분 — DLIV_DIV {OUTBOUND:출고(정상배송), INBOUND:입고(반품수거)}
                        odDliv.dlivStatusCd,           // 배송상태 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
                        odDliv.dlivStatusCdBefore,     // 변경 전 배송상태 — DLIV_STATUS (동일 코드그룹)
                        odDliv.outboundCourierCd,      // 출고(발송) 택배사 — COURIER {CJ:CJ대한통운, LOGEN:로젠택배, POST:우체국택배, HANJIN:한진택배, LOTTE:롯데택배, KYOUNGDONG:경동택배, DIRECT:직배송}
                        odDliv.outboundTrackingNo,     // 출고(발송) 송장번호
                        odDliv.dlivShipDate,           // 출고일시
                        odDliv.dlivDate,               // 배송완료일시
                        odDliv.shippingFee,            // 배송료 (현재값)
                        odDliv.inboundCourierCd,       // 반입 택배사 (반품일 때만) — COURIER (동일 코드그룹)
                        odDliv.inboundTrackingNo,      // 반입 송장번호
                        odDliv.recvNm,                 // 수령자명
                        odDliv.recvPhone,              // 수령자연락처
                        odDliv.recvZip,                // 우편번호
                        odDliv.recvAddr,               // 주소
                        odDliv.recvAddrDetail,         // 상세주소
                        odDliv.dlivMemo,               // 메모 (HTML 에디터)
                        odDliv.regBy,      // 등록자
                        odDliv.regDate,    // 등록일시
                        odDliv.updBy,      // 수정자
                        odDliv.updDate,    // 수정일시
                        odOrder.memberNm.as("memberNm"), // 회원명 LIKE 필터 (직접 입력 시)
                        odOrder.orderDate.as("orderDate"), // 주문일시 (od_order 조인)
                        odOrder.orderStatusCd.as("orderStatusCd"), // 주문상태 (od_order 조인) — ORDER_STATUS_CD
                        syVendor.vendorNm.as("vendorNm"), // 업체명 LIKE 필터 (직접 입력 시)
                        syVendor.vendorPhone.as("vendorTel"), // 업체 연락처 (sy_vendor 조인)
                        codeDlivStatusCd.codeLabel.as("dlivStatusCdNm"), // 배송상태 코드 라벨
                        codeDlivTypeCd.codeLabel.as("dlivTypeCdNm"), // 배송유형 코드 라벨
                        codeDlivDivCd.codeLabel.as("dlivDivCdNm"), // 입출고구분 코드 라벨
                        codeOutboundCourierCd.codeLabel.as("outboundCourierCdNm"), // 출고택배사 코드 라벨
                        codeInboundCourierCd.codeLabel.as("inboundCourierCdNm"), // 반입택배사 코드 라벨
                        odDliv.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        odDliv.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(odDliv)
                .innerJoin(odOrder).on(odOrder.orderId.eq(odDliv.orderId)) // 주문
                .leftJoin(syVendor).on(syVendor.vendorId.eq(odDliv.vendorId)) // 업체
                .leftJoin(codeDlivStatusCd).on(codeDlivStatusCd.codeGrp.eq("DLIV_STATUS").and(codeDlivStatusCd.codeValue.eq(odDliv.dlivStatusCd))) // 배송상태
                .leftJoin(codeDlivTypeCd).on(codeDlivTypeCd.codeGrp.eq("DLIV_TYPE_CD").and(codeDlivTypeCd.codeValue.eq(odDliv.dlivTypeCd))) // 배송유형
                .leftJoin(codeDlivDivCd).on(codeDlivDivCd.codeGrp.eq("DLIV_DIV_CD").and(codeDlivDivCd.codeValue.eq(odDliv.dlivDivCd))) // 입출고구분
                .leftJoin(codeOutboundCourierCd).on(codeOutboundCourierCd.codeGrp.eq("COURIER").and(codeOutboundCourierCd.codeValue.eq(odDliv.outboundCourierCd))) // 택배사
                .leftJoin(codeInboundCourierCd).on(codeInboundCourierCd.codeGrp.eq("COURIER").and(codeInboundCourierCd.codeValue.eq(odDliv.inboundCourierCd))) // 택배사
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odDliv.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odDliv.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(odDliv.siteId)) // 사이트

                ;
    }

    /* 배송 키조회 */
    @Override
    public Optional<OdDlivDto.Item> selectById(String dlivId) {
        OdDlivDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odDliv.dlivId.eq(dlivId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 배송 목록조회 */
    @Override
    public List<OdDlivDto.Item> selectList(OdDlivDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(odDliv.orderId, search.getOrderIds())); // 상위 FK 다건 IN
        whereList.add(QdslUtil.strEq(odDliv.orderId, search.getOrderId())); // 상위 FK 필터
        whereList.add(QdslUtil.strEq(odDliv.dlivId, search.getDlivId())); // 배송ID 필터
        whereList.add((StringUtils.hasText(search.getMemberId()) || StringUtils.hasText(search.getMemberNm())) // 회원명 LIKE 필터 (직접 입력 시)
                ? JPAExpressions.selectOne().from(mbMemberEx)
                      .where(mbMemberEx.memberId.eq(odDliv.memberId),
                             QdslUtil.strEq(mbMemberEx.memberId, search.getMemberId()),
                             StringUtils.hasText(search.getMemberId()) ? null : QdslUtil.strLike(mbMemberEx.memberNm, search.getMemberNm())).exists()
                : null);
        whereList.add((StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm())) // 업체명 LIKE 필터 (직접 입력 시)
                ? JPAExpressions.selectOne().from(syVendorEx)
                      .where(syVendorEx.vendorId.eq(odDliv.vendorId),
                             QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                             StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm())).exists()
                : null);
        whereList.add(QdslUtil.strEq(odDliv.dlivStatusCd, search.getDlivStatusCd())); // 배송상태 필터
        whereList.add("dliv_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odDliv.dlivDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odDliv.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odDliv.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("dliv_ship_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odDliv.dlivShipDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(odDliv.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdDlivDto.Item> query = baseSelColumnQuery()
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
        List<OdDlivDto.Item> list = query.fetch();
        return list;
    }

    /* 배송 페이지조회 */
    @Override
    public BasePage<OdDlivDto.Item> selectPageData(OdDlivDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(odDliv.orderId, search.getOrderIds())); // 상위 FK 다건 IN
        whereList.add(QdslUtil.strEq(odDliv.orderId, search.getOrderId())); // 상위 FK 필터
        whereList.add(QdslUtil.strEq(odDliv.dlivId, search.getDlivId())); // 배송ID 필터
        whereList.add((StringUtils.hasText(search.getMemberId()) || StringUtils.hasText(search.getMemberNm())) // 회원명 LIKE 필터 (직접 입력 시)
                ? JPAExpressions.selectOne().from(mbMemberEx)
                      .where(mbMemberEx.memberId.eq(odDliv.memberId),
                             QdslUtil.strEq(mbMemberEx.memberId, search.getMemberId()),
                             StringUtils.hasText(search.getMemberId()) ? null : QdslUtil.strLike(mbMemberEx.memberNm, search.getMemberNm())).exists()
                : null);
        whereList.add((StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm())) // 업체명 LIKE 필터 (직접 입력 시)
                ? JPAExpressions.selectOne().from(syVendorEx)
                      .where(syVendorEx.vendorId.eq(odDliv.vendorId),
                             QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                             StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm())).exists()
                : null);
        whereList.add(QdslUtil.strEq(odDliv.dlivStatusCd, search.getDlivStatusCd())); // 배송상태 필터
        whereList.add("dliv_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odDliv.dlivDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odDliv.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odDliv.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("dliv_ship_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(odDliv.dlivShipDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(odDliv.siteId, search.getSiteId())); // 사이트ID 필터
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<OdDlivDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdDlivDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odDliv.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdDlivDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 예: "apprAprvUserId,apprReason,apprReqUserId,apprStatusCd,apprStatusCdBefore" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("apprAprvUserId", odDliv.apprAprvUserId),
            QdslUtil.FieldDef.like("apprReason", odDliv.apprReason),
            QdslUtil.FieldDef.like("apprReqUserId", odDliv.apprReqUserId),
            QdslUtil.FieldDef.like("apprStatusCd", odDliv.apprStatusCd),
            QdslUtil.FieldDef.like("apprStatusCdBefore", odDliv.apprStatusCdBefore),
            QdslUtil.FieldDef.like("apprTargetCd", odDliv.apprTargetCd),
            QdslUtil.FieldDef.like("apprTargetNm", odDliv.apprTargetNm),
            QdslUtil.FieldDef.like("claimId", odDliv.claimId),
            QdslUtil.FieldDef.like("dlivDivCd", odDliv.dlivDivCd), // 입출고구분 — DLIV_DIV_CD {OUTBOUND:출고, INBOUND:입고}
            QdslUtil.FieldDef.like("dlivId", odDliv.dlivId), // 배송ID 필터
            QdslUtil.FieldDef.like("dlivMemo", odDliv.dlivMemo), // 메모 (HTML 에디터)
            QdslUtil.FieldDef.like("dlivPayTypeCd", odDliv.dlivPayTypeCd),
            QdslUtil.FieldDef.like("dlivStatusCd", odDliv.dlivStatusCd), // 배송상태 필터
            QdslUtil.FieldDef.like("dlivStatusCdBefore", odDliv.dlivStatusCdBefore), // 변경 전 배송상태 — DLIV_STATUS
            QdslUtil.FieldDef.like("dlivTypeCd", odDliv.dlivTypeCd), // 배송유형 — DLIV_TYPE_CD
            QdslUtil.FieldDef.like("inboundCourierCd", odDliv.inboundCourierCd), // 반입 택배사 (반품일 때만) — COURIER
            QdslUtil.FieldDef.like("inboundTrackingNo", odDliv.inboundTrackingNo), // 반입 송장번호
            QdslUtil.FieldDef.like("memberId", odDliv.memberId), // 회원 ID 필터
            QdslUtil.FieldDef.like("memberNm", odDliv.memberNm), // 회원명 LIKE 필터 (직접 입력 시)
            QdslUtil.FieldDef.like("orderId", odDliv.orderId), // 상위 FK 필터
            QdslUtil.FieldDef.like("outboundCourierCd", odDliv.outboundCourierCd), // 출고(발송) 택배사 — COURIER {CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배 외}
            QdslUtil.FieldDef.like("outboundTrackingNo", odDliv.outboundTrackingNo), // 출고(발송) 송장번호
            QdslUtil.FieldDef.like("parentDlivId", odDliv.parentDlivId),
            QdslUtil.FieldDef.like("recvAddr", odDliv.recvAddr), // 주소
            QdslUtil.FieldDef.like("recvAddrDetail", odDliv.recvAddrDetail), // 상세주소
            QdslUtil.FieldDef.like("recvNm", odDliv.recvNm), // 수령자명
            QdslUtil.FieldDef.like("recvPhone", odDliv.recvPhone), // 수령자연락처
            QdslUtil.FieldDef.like("recvZip", odDliv.recvZip), // 우편번호
            QdslUtil.FieldDef.like("shippingFeeTypeCd", odDliv.shippingFeeTypeCd),
            QdslUtil.FieldDef.like("vendorId", odDliv.vendorId) // 업체 ID 필터
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("dlivId", odDliv.dlivId,
                   "memberNm", odDliv.memberNm,
                   "regDate", odDliv.regDate),
        new OrderSpecifier<>(Order.DESC, odDliv.regDate),
        new OrderSpecifier<>(Order.ASC, odDliv.dlivId));
    }

    /* 배송 수정 */
    @Override
    public int updateSelective(OdDliv entity) {
        if (entity.getDlivId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odDliv);
        boolean hasAny = false;

        if (entity.getDlivStatusCd()       != null) { update.set(odDliv.dlivStatusCd,       entity.getDlivStatusCd());       hasAny = true; }
        if (entity.getDlivStatusCdBefore() != null) { update.set(odDliv.dlivStatusCdBefore, entity.getDlivStatusCdBefore()); hasAny = true; }
        if (entity.getOutboundCourierCd()  != null) { update.set(odDliv.outboundCourierCd,  entity.getOutboundCourierCd());  hasAny = true; }
        if (entity.getOutboundTrackingNo() != null) { update.set(odDliv.outboundTrackingNo, entity.getOutboundTrackingNo()); hasAny = true; }
        if (entity.getDlivShipDate()       != null) { update.set(odDliv.dlivShipDate,       entity.getDlivShipDate());       hasAny = true; }
        if (entity.getDlivDate()           != null) { update.set(odDliv.dlivDate,           entity.getDlivDate());           hasAny = true; }
        if (entity.getDlivMemo()           != null) { update.set(odDliv.dlivMemo,           entity.getDlivMemo());           hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(odDliv.updBy,              entity.getUpdBy());              hasAny = true; }
        update.set(odDliv.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odDliv.dlivId.eq(entity.getDlivId())).execute();
        return (int) affected;
    }

    /** 주문 자동 완료 대상 — dlivDivCd + dlivStatusCd + dlivDate <= threshold */
    @Override
    public List<OdDliv> selectDeliveredOutboundBefore(String dlivDivCd, String dlivStatusCd, LocalDateTime threshold) {
        return queryFactory.selectFrom(odDliv)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectDeliveredOutboundBefore()")
                .where(odDliv.dlivDivCd.eq(dlivDivCd),
                        odDliv.dlivStatusCd.eq(dlivStatusCd),
                        odDliv.dlivDate.loe(threshold))
                .fetch();
    }
}
