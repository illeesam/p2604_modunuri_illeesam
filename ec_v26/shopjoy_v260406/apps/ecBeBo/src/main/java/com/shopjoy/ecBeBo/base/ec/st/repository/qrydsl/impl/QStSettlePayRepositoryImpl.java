package com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.QStSettlePay;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStSettlePayRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;

/** StSettlePay(정산지급) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettlePayRepositoryImpl implements QStSettlePayRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettlePayRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QStSettlePay stSettlePay     = QStSettlePay.stSettlePay;
    private static final QSyVendor    syVendor   = QSyVendor.syVendor;
    private static final QSySite      sySite   = QSySite.sySite;
    private static final QVwSyCode      codePayMethodCd = new QVwSyCode("cd_pmc");
    private static final QVwSyCode      codePayStatusCd = new QVwSyCode("cd_sps");    /*
     * baseListQuery — 코드성 필드 예시 코드값
     * PAY_METHOD_CD      (Entity 주석 명시값 없음. sy_code 에도 'PAY_METHOD_CD' 그룹 데이터 없음 —
     *                      od_refund_method.pay_method_cd DDL 코멘트 기준 유사 코드그룹 'PAY_METHOD' 값 참고: BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)
     * SETTLE_PAY_STATUS  {PENDING: '지급대기', REQUESTED: '지급요청', COMPLT: '지급완료', FAILED: '지급실패', DISPUTED: '이의신청'}
     */
    private JPAQuery<StSettlePayDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettlePayDto.Item.class,
                        stSettlePay.settlePayId,         // 정산지급ID (PK, YYMMDDhhmmss+rand4)
                        stSettlePay.settleId,             // 정산ID (st_settle.settle_id)
                        stSettlePay.vendorId,              // 업체ID (sy_vendor.vendor_id)
                        stSettlePay.payAmt,                // 지급금액
                        stSettlePay.payMethodCd,           // 지급수단 — PAY_METHOD_CD (sy_code 실 데이터 없음, 참고: PAY_METHOD 그룹 BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)
                        stSettlePay.bankNm,                // 은행명
                        stSettlePay.bankAccount,           // 계좌번호
                        stSettlePay.bankHolder,            // 예금주
                        stSettlePay.payStatusCd,           // 지급상태 — SETTLE_PAY_STATUS {PENDING: '지급대기', REQUESTED: '지급요청', COMPLT: '지급완료', FAILED: '지급실패', DISPUTED: '이의신청'}
                        stSettlePay.payStatusCdBefore,     // 변경 전 상태
                        stSettlePay.payDate,               // 실지급 일시
                        stSettlePay.payBy,                 // 지급처리자 (sy_user.user_id)
                        stSettlePay.settlePayMemo,         // 메모
                        stSettlePay.regBy,                 // 등록자
                        stSettlePay.regDate,               // 등록일시
                        stSettlePay.updBy,                 // 수정자
                        stSettlePay.updDate,               // 수정일시
                        syVendor.vendorNm.as("vendorNm"),               // 업체명 (조인)
                        codePayMethodCd.codeLabel.as("payMethodCdNm"),            // 지급수단명 (sy_code 조인)
                        codePayStatusCd.codeLabel.as("payStatusCdNm"),             // 지급상태명 (sy_code 조인)
                        stSettlePay.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(stSettlePay)
                .innerJoin(syVendor).on(syVendor.vendorId.eq(stSettlePay.vendorId)) // 업체
                .leftJoin(codePayMethodCd).on(codePayMethodCd.codeGrp.eq("PAY_METHOD").and(codePayMethodCd.codeValue.eq(stSettlePay.payMethodCd))) // 결제수단
                .leftJoin(codePayStatusCd).on(codePayStatusCd.codeGrp.eq("SETTLE_PAY_STATUS").and(codePayStatusCd.codeValue.eq(stSettlePay.payStatusCd))) // 정산지급상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(stSettlePay.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(stSettlePay.regBy)) // 등록자
                ;
    }

    /* 정산 지급 키조회 */
    @Override
    public Optional<StSettlePayDto.Item> selectById(String id) {
        StSettlePayDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettlePay.settlePayId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 정산 지급 목록조회 */
    @Override
    public List<StSettlePayDto.Item> selectList(StSettlePayDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettlePay.settlePayId, search.getSettlePayId())); // 정산지급ID 필터
        whereList.add(QdslUtil.strEq(stSettlePay.payStatusCd, search.getPayStatusCd())); // 지급상태 필터 — SETTLE_PAY_STATUS (PENDING/COMPLT/FAILED)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettlePay.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettlePay.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<StSettlePayDto.Item> query = baseListQuery()
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
        List<StSettlePayDto.Item> list = query.fetch();
        return list;
    }

    /* 정산 지급 페이지조회 */
    @Override
    public BasePage<StSettlePayDto.Item> selectPageData(StSettlePayDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettlePay.settlePayId, search.getSettlePayId())); // 정산지급ID 필터
        whereList.add(QdslUtil.strEq(stSettlePay.payStatusCd, search.getPayStatusCd())); // 지급상태 필터 — SETTLE_PAY_STATUS (PENDING/COMPLT/FAILED)
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettlePay.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettlePay.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<StSettlePayDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<StSettlePayDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettlePay.count())
                .where(wheres)
                .fetchOne();

        BasePage<StSettlePayDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "bankAccount,bankHolder,bankNm,payBy,payMethodCd" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("bankAccount", stSettlePay.bankAccount), // 계좌번호
            QdslUtil.FieldDef.like("bankHolder", stSettlePay.bankHolder), // 예금주
            QdslUtil.FieldDef.like("bankNm", stSettlePay.bankNm), // 은행명
            QdslUtil.FieldDef.like("payBy", stSettlePay.payBy), // 지급처리자 (sy_user.user_id)
            QdslUtil.FieldDef.like("payMethodCd", stSettlePay.payMethodCd), // 지급수단 — PAY_METHOD
            QdslUtil.FieldDef.like("payStatusCd", stSettlePay.payStatusCd), // 지급상태 필터 — SETTLE_PAY_STATUS (PENDING/COMPLT/FAILED)
            QdslUtil.FieldDef.like("payStatusCdBefore", stSettlePay.payStatusCdBefore), // 변경 전 상태
            QdslUtil.FieldDef.like("settleId", stSettlePay.settleId), // 정산ID (st_settle.settle_id)
            QdslUtil.FieldDef.like("settlePayId", stSettlePay.settlePayId), // 정산지급ID 필터
            QdslUtil.FieldDef.like("settlePayMemo", stSettlePay.settlePayMemo), // 메모
            QdslUtil.FieldDef.like("vendorId", stSettlePay.vendorId) // 업체ID (sy_vendor.vendor_id)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("settlePayId", stSettlePay.settlePayId,
                   "bankNm", stSettlePay.bankNm,
                   "regDate", stSettlePay.regDate),
        new OrderSpecifier<>(Order.DESC, stSettlePay.regDate),
        new OrderSpecifier<>(Order.ASC, stSettlePay.settlePayId));
    }

    /* 정산 지급 수정 */
    @Override
    public int updateSelective(StSettlePay entity) {
        if (entity.getSettlePayId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettlePay);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(stSettlePay.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(stSettlePay.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getPayAmt()           != null) { update.set(stSettlePay.payAmt,           entity.getPayAmt());           hasAny = true; }
        if (entity.getPayMethodCd()      != null) { update.set(stSettlePay.payMethodCd,      entity.getPayMethodCd());      hasAny = true; }
        if (entity.getBankNm()           != null) { update.set(stSettlePay.bankNm,           entity.getBankNm());           hasAny = true; }
        if (entity.getBankAccount()      != null) { update.set(stSettlePay.bankAccount,      entity.getBankAccount());      hasAny = true; }
        if (entity.getBankHolder()       != null) { update.set(stSettlePay.bankHolder,       entity.getBankHolder());       hasAny = true; }
        if (entity.getPayStatusCd()      != null) { update.set(stSettlePay.payStatusCd,      entity.getPayStatusCd());      hasAny = true; }
        if (entity.getPayStatusCdBefore()!= null) { update.set(stSettlePay.payStatusCdBefore,entity.getPayStatusCdBefore());hasAny = true; }
        if (entity.getPayDate()          != null) { update.set(stSettlePay.payDate,          entity.getPayDate());          hasAny = true; }
        if (entity.getPayBy()            != null) { update.set(stSettlePay.payBy,            entity.getPayBy());            hasAny = true; }
        if (entity.getSettlePayMemo()    != null) { update.set(stSettlePay.settlePayMemo,    entity.getSettlePayMemo());    hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(stSettlePay.updBy,            entity.getUpdBy());            hasAny = true; }
        update.set(stSettlePay.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettlePay.settlePayId.eq(entity.getSettlePayId())).execute();
        return (int) affected;
    }
}
