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
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.QStErpVoucher;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStErpVoucherRepository;
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
/** StErpVoucher(ERP 전표 마스터 (정산 → ERP 회계 전표)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStErpVoucherRepositoryImpl implements QStErpVoucherRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStErpVoucherRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QStErpVoucher stErpVoucher    = QStErpVoucher.stErpVoucher;
    private static final QSySite       sySite  = QSySite.sySite;
    private static final QSyVendor     syVendor  = QSyVendor.syVendor;
    private static final QVwSyCode       codeErpVoucherTypeCd = new QVwSyCode("cd_evt");
    private static final QVwSyCode       codeErpVoucherStatusCd = new QVwSyCode("cd_evs");    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * ERP_VOUCHER_TYPE    {SALE: '매출전표', CANCEL: '취소전표', SETTLE: '정산전표', ADJ: '조정전표'}
     * ERP_VOUCHER_STATUS  {DRAFT: '임시', SENT: '전송완료', FAILED: '전송실패', CONFIRMED: 'ERP확인'}
     * (Entity 주석상 erpVoucherStatusCd 흐름: DRAFT→CONFIRMED→SENT→MATCHED/MISMATCH/ERROR — sy_code 실 데이터와 값 표기가 다름)
     */
    private JPAQuery<StErpVoucherDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StErpVoucherDto.Item.class,
                        stErpVoucher.erpVoucherId,               // ERP전표ID (PK, YYMMDDhhmmss+rand4)
                        stErpVoucher.vendorId,                   // 업체ID
                        stErpVoucher.settleId,                   // 정산ID (st_settle.settle_id)
                        stErpVoucher.settleYm,                   // 정산년월 (YYYYMM)
                        stErpVoucher.erpVoucherTypeCd,            // 전표유형 — ERP_VOUCHER_TYPE {SALE: '매출전표', CANCEL: '취소전표', SETTLE: '정산전표', ADJ: '조정전표'}
                        stErpVoucher.erpVoucherStatusCd,          // 전표상태 — ERP_VOUCHER_STATUS {DRAFT: '임시', SENT: '전송완료', FAILED: '전송실패', CONFIRMED: 'ERP확인'}
                        stErpVoucher.erpVoucherStatusCdBefore,    // 변경 전 전표상태
                        stErpVoucher.voucherDate,                // 전표 기준일자
                        stErpVoucher.erpVoucherDesc,              // 전표 적요
                        stErpVoucher.totalDebitAmt,                // 차변 합계 (대변과 일치해야 전표 확정 가능)
                        stErpVoucher.totalCreditAmt,               // 대변 합계
                        stErpVoucher.erpSendDate,                  // ERP 전송일시
                        stErpVoucher.erpVoucherNo,                 // ERP 채번 전표번호 (전송 후 ERP에서 수신)
                        stErpVoucher.erpResMsg,                    // ERP 처리 응답 메시지
                        stErpVoucher.regBy,                        // 등록자
                        stErpVoucher.regDate,                      // 등록일시
                        stErpVoucher.updBy,                        // 수정자
                        stErpVoucher.updDate,                      // 수정일시
                        syVendor.vendorNm.as("vendorNm"),           // 업체명 (조인)
                        codeErpVoucherTypeCd.codeLabel.as("erpVoucherTypeCdNm"),   // 전표유형명 (sy_code 조인)
                        codeErpVoucherStatusCd.codeLabel.as("erpVoucherStatusCdNm"), // 전표상태명 (sy_code 조인)
                        stErpVoucher.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(stErpVoucher)
                .innerJoin(codeErpVoucherTypeCd).on(codeErpVoucherTypeCd.codeGrp.eq("ERP_VOUCHER_TYPE_CD").and(codeErpVoucherTypeCd.codeValue.eq(stErpVoucher.erpVoucherTypeCd))) // ERP전표유형
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stErpVoucher.vendorId)) // 업체
                .leftJoin(codeErpVoucherStatusCd).on(codeErpVoucherStatusCd.codeGrp.eq("ERP_VOUCHER_STATUS_CD").and(codeErpVoucherStatusCd.codeValue.eq(stErpVoucher.erpVoucherStatusCd))) // ERP전표상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(stErpVoucher.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(stErpVoucher.regBy)) // 등록자
                ;
    }

    /* ERP 전표 키조회 */
    @Override
    public Optional<StErpVoucherDto.Item> selectById(String id) {
        StErpVoucherDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stErpVoucher.erpVoucherId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* ERP 전표 목록조회 */
    @Override
    public List<StErpVoucherDto.Item> selectList(StErpVoucherDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stErpVoucher.erpVoucherId, search.getErpVoucherId())); // ERP전표ID 필터
        whereList.add(QdslUtil.strEq(stErpVoucher.erpVoucherTypeCd, search.getErpVoucherTypeCd())); // 전표유형 필터 — ERP_VOUCHER_TYPE_CD (SETTLE/RETURN/ADJ/PAY)
        whereList.add(QdslUtil.strEq(stErpVoucher.erpVoucherStatusCd, search.getErpVoucherStatusCd())); // 전표상태 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stErpVoucher.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stErpVoucher.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<StErpVoucherDto.Item> query = baseListQuery()
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
        List<StErpVoucherDto.Item> list = query.fetch();
        return list;
    }

    /* ERP 전표 페이지조회 */
    @Override
    public BasePage<StErpVoucherDto.Item> selectPageData(StErpVoucherDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stErpVoucher.erpVoucherId, search.getErpVoucherId())); // ERP전표ID 필터
        whereList.add(QdslUtil.strEq(stErpVoucher.erpVoucherTypeCd, search.getErpVoucherTypeCd())); // 전표유형 필터 — ERP_VOUCHER_TYPE_CD (SETTLE/RETURN/ADJ/PAY)
        whereList.add(QdslUtil.strEq(stErpVoucher.erpVoucherStatusCd, search.getErpVoucherStatusCd())); // 전표상태 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stErpVoucher.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stErpVoucher.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<StErpVoucherDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<StErpVoucherDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stErpVoucher.count())
                .where(wheres)
                .fetchOne();

        BasePage<StErpVoucherDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "erpResMsg,erpVoucherDesc,erpVoucherId,erpVoucherNo,erpVoucherStatusCd" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("erpResMsg", stErpVoucher.erpResMsg), // ERP 처리 응답 메시지
            QdslUtil.FieldDef.like("erpVoucherDesc", stErpVoucher.erpVoucherDesc), // 전표 적요
            QdslUtil.FieldDef.like("erpVoucherId", stErpVoucher.erpVoucherId), // ERP전표ID 필터
            QdslUtil.FieldDef.like("erpVoucherNo", stErpVoucher.erpVoucherNo), // ERP 채번 전표번호 (전송 후 ERP에서 수신)
            QdslUtil.FieldDef.like("erpVoucherStatusCd", stErpVoucher.erpVoucherStatusCd), // 전표상태 필터
            QdslUtil.FieldDef.like("erpVoucherStatusCdBefore", stErpVoucher.erpVoucherStatusCdBefore), // 변경 전 전표상태
            QdslUtil.FieldDef.like("erpVoucherTypeCd", stErpVoucher.erpVoucherTypeCd), // 전표유형 필터 — ERP_VOUCHER_TYPE_CD (SETTLE/RETURN/ADJ/PAY)
            QdslUtil.FieldDef.like("settleId", stErpVoucher.settleId), // 정산ID (st_settle.settle_id)
            QdslUtil.FieldDef.like("settleYm", stErpVoucher.settleYm), // 정산년월 (YYYYMM)
            QdslUtil.FieldDef.like("vendorId", stErpVoucher.vendorId) // 업체ID
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("erpVoucherId", stErpVoucher.erpVoucherId,
                   "settleYm", stErpVoucher.settleYm),
        new OrderSpecifier<>(Order.DESC, stErpVoucher.regDate),
        new OrderSpecifier<>(Order.ASC, stErpVoucher.erpVoucherId));
    }

    /* ERP 전표 수정 */
    @Override
    public int updateSelective(StErpVoucher entity) {
        if (entity.getErpVoucherId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stErpVoucher);
        boolean hasAny = false;

        if (entity.getVendorId()                 != null) { update.set(stErpVoucher.vendorId,                 entity.getVendorId());                 hasAny = true; }
        if (entity.getSettleId()                 != null) { update.set(stErpVoucher.settleId,                 entity.getSettleId());                 hasAny = true; }
        if (entity.getSettleYm()                 != null) { update.set(stErpVoucher.settleYm,                 entity.getSettleYm());                 hasAny = true; }
        if (entity.getErpVoucherTypeCd()         != null) { update.set(stErpVoucher.erpVoucherTypeCd,         entity.getErpVoucherTypeCd());         hasAny = true; }
        if (entity.getErpVoucherStatusCd()       != null) { update.set(stErpVoucher.erpVoucherStatusCd,       entity.getErpVoucherStatusCd());       hasAny = true; }
        if (entity.getErpVoucherStatusCdBefore() != null) { update.set(stErpVoucher.erpVoucherStatusCdBefore, entity.getErpVoucherStatusCdBefore()); hasAny = true; }
        if (entity.getVoucherDate()              != null) { update.set(stErpVoucher.voucherDate,              entity.getVoucherDate());              hasAny = true; }
        if (entity.getErpVoucherDesc()           != null) { update.set(stErpVoucher.erpVoucherDesc,           entity.getErpVoucherDesc());           hasAny = true; }
        if (entity.getTotalDebitAmt()            != null) { update.set(stErpVoucher.totalDebitAmt,            entity.getTotalDebitAmt());            hasAny = true; }
        if (entity.getTotalCreditAmt()           != null) { update.set(stErpVoucher.totalCreditAmt,           entity.getTotalCreditAmt());           hasAny = true; }
        if (entity.getErpSendDate()              != null) { update.set(stErpVoucher.erpSendDate,              entity.getErpSendDate());              hasAny = true; }
        if (entity.getErpVoucherNo()             != null) { update.set(stErpVoucher.erpVoucherNo,             entity.getErpVoucherNo());             hasAny = true; }
        if (entity.getErpResMsg()                != null) { update.set(stErpVoucher.erpResMsg,                entity.getErpResMsg());                hasAny = true; }
        if (entity.getUpdBy()                    != null) { update.set(stErpVoucher.updBy,                    entity.getUpdBy());                    hasAny = true; }
        update.set(stErpVoucher.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stErpVoucher.erpVoucherId.eq(entity.getErpVoucherId())).execute();
        return (int) affected;
    }
}
