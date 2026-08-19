package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStErpVoucherRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** StErpVoucher QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStErpVoucherRepositoryImpl implements QStErpVoucherRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStErpVoucherRepositoryImpl";
    private static final QStErpVoucher stErpVoucher    = QStErpVoucher.stErpVoucher;
    private static final QSySite       sySite  = QSySite.sySite;
    private static final QSyVendor     syVendor  = QSyVendor.syVendor;
    private static final QVwSyCode       cdEvt = new QVwSyCode("cd_evt");
    private static final QVwSyCode       cdEvs = new QVwSyCode("cd_evs");    /*
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
                        cdEvt.codeLabel.as("erpVoucherTypeCdNm"),   // 전표유형명 (sy_code 조인)
                        cdEvs.codeLabel.as("erpVoucherStatusCdNm") // 전표상태명 (sy_code 조인)
                ))
                .from(stErpVoucher)
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stErpVoucher.vendorId))
                .leftJoin(cdEvt).on(cdEvt.codeGrp.eq("ERP_VOUCHER_TYPE_CD").and(cdEvt.codeValue.eq(stErpVoucher.erpVoucherTypeCd)))
                .leftJoin(cdEvs).on(cdEvs.codeGrp.eq("ERP_VOUCHER_STATUS_CD").and(cdEvs.codeValue.eq(stErpVoucher.erpVoucherStatusCd)));
    }

    /* ERP 전표 키조회 */
    @Override
    public Optional<StErpVoucherDto.Item> selectById(String id) {
        StErpVoucherDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stErpVoucher.erpVoucherId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* ERP 전표 목록조회 */
    @Override
    public List<StErpVoucherDto.Item> selectList(StErpVoucherDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = stErpVoucher.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = stErpVoucher.updDate;
        }
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<StErpVoucherDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stErpVoucher.erpVoucherId, search.getErpVoucherId()),
                    QdslUtil.strEq(stErpVoucher.erpVoucherTypeCd, search.getErpVoucherTypeCd()),
                    QdslUtil.strEq(stErpVoucher.erpVoucherStatusCd, search.getErpVoucherStatusCd()),
                    QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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

    /* ERP 전표 페이지조회 */
    @Override
    public BasePage<StErpVoucherDto.Item> selectPageData(StErpVoucherDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = stErpVoucher.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = stErpVoucher.updDate;
        }
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stErpVoucher.erpVoucherId, search.getErpVoucherId()),
                QdslUtil.strEq(stErpVoucher.erpVoucherTypeCd, search.getErpVoucherTypeCd()),
                QdslUtil.strEq(stErpVoucher.erpVoucherStatusCd, search.getErpVoucherStatusCd()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StErpVoucherDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StErpVoucherDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stErpVoucher.count())
                .where(wheres)
                .fetchOne();

        BasePage<StErpVoucherDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("erpResMsg", stErpVoucher.erpResMsg),
            QdslUtil.FieldDef.like("erpVoucherDesc", stErpVoucher.erpVoucherDesc),
            QdslUtil.FieldDef.like("erpVoucherId", stErpVoucher.erpVoucherId),
            QdslUtil.FieldDef.like("erpVoucherNo", stErpVoucher.erpVoucherNo),
            QdslUtil.FieldDef.like("erpVoucherStatusCd", stErpVoucher.erpVoucherStatusCd),
            QdslUtil.FieldDef.like("erpVoucherStatusCdBefore", stErpVoucher.erpVoucherStatusCdBefore),
            QdslUtil.FieldDef.like("erpVoucherTypeCd", stErpVoucher.erpVoucherTypeCd),
            QdslUtil.FieldDef.like("settleId", stErpVoucher.settleId),
            QdslUtil.FieldDef.like("settleYm", stErpVoucher.settleYm),
            QdslUtil.FieldDef.like("vendorId", stErpVoucher.vendorId)
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stErpVoucher.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stErpVoucher.erpVoucherId.eq(entity.getErpVoucherId())).execute();
        return (int) affected;
    }
}
