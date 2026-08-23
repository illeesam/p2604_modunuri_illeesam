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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettle;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** StSettle(정산 마스터 (업체별 월정산)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleRepositoryImpl implements QStSettleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QStSettle  stSettle   = QStSettle.stSettle;
    private static final QSyVendor  syVendor = QSyVendor.syVendor;
    private static final QSySite    sySite = QSySite.sySite;
    private static final QVwSyCode    codeSettleStatusCd = new QVwSyCode("cd_ss");    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * SETTLE_STATUS  {OPEN: '진행중', CLOSED: '마감완료', CANCELLED: '마감취소'}
     * (Entity/DDL 주석상 settleStatusCd 흐름: DRAFT/CONFIRMED/CLOSED/PAID — sy_code 실 데이터와 값 표기가 다름)
     */
    private JPAQuery<StSettleDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleDto.Item.class,
                        stSettle.settleId,                 // 정산ID (PK, YYMMDDhhmmss+rand4)
                        stSettle.vendorId,                  // 업체ID (sy_vendor.vendor_id)
                        stSettle.settleYm,                  // 정산년월 (YYYYMM)
                        stSettle.settleStartDate,           // 정산 기준 시작일
                        stSettle.settleEndDate,             // 정산 기준 종료일
                        stSettle.totalOrderAmt,             // 총 주문금액 (당월 신규 주문 귀속)
                        stSettle.totalReturnAmt,            // 총 환불금액 (환불 확정월 귀속 — 타월 주문 환불 포함)
                        stSettle.totalClaimCnt,             // 환불 건수 (st_settle_raw.raw_type_cd=CLAIM 집계)
                        stSettle.totalDiscntAmt,            // 총 할인금액
                        stSettle.commissionRate,            // 적용 수수료율 (%)
                        stSettle.commissionAmt,             // 수수료금액
                        stSettle.settleAmt,                 // 기본 정산금액
                        stSettle.adjAmt,                    // 정산조정 합계
                        stSettle.etcAdjAmt,                 // 기타조정 합계
                        stSettle.finalSettleAmt,            // 최종 정산금액
                        stSettle.settleStatusCd,            // 상태 — SETTLE_STATUS {OPEN: '진행중', CLOSED: '마감완료', CANCELLED: '마감취소'}
                        stSettle.settleStatusCdBefore,      // 변경 전 상태
                        stSettle.settleMemo,                // 정산 메모
                        stSettle.regBy,                     // 등록자
                        stSettle.regDate,                   // 등록일시
                        stSettle.updBy,                     // 수정자
                        stSettle.updDate,                   // 수정일시
                        syVendor.vendorNm.as("vendorNm"),               // 업체명 (조인)
                        codeSettleStatusCd.codeLabel.as("settleStatusCdNm"),           // 상태명 (sy_code 조인)
                        stSettle.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(stSettle)
                .innerJoin(syVendor).on(syVendor.vendorId.eq(stSettle.vendorId)) // 업체
                .leftJoin(codeSettleStatusCd).on(codeSettleStatusCd.codeGrp.eq("SETTLE_STATUS_CD").and(codeSettleStatusCd.codeValue.eq(stSettle.settleStatusCd))) // 정산상태
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(stSettle.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(stSettle.regBy)) // 등록자
                ;
    }

    /* 정산 키조회 */
    @Override
    public Optional<StSettleDto.Item> selectById(String id) {
        StSettleDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettle.settleId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 정산 목록조회 */
    @Override
    public List<StSettleDto.Item> selectList(StSettleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettle.settleId, search.getSettleId())); // 정산ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettle.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettle.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<StSettleDto.Item> query = baseListQuery()
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
        List<StSettleDto.Item> list = query.fetch();
        return list;
    }

    /* 정산 페이지조회 */
    @Override
    public BasePage<StSettleDto.Item> selectPageData(StSettleDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stSettle.settleId, search.getSettleId())); // 정산ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettle.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stSettle.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<StSettleDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<StSettleDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettle.count())
                .where(wheres)
                .fetchOne();

        BasePage<StSettleDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "settleId,settleMemo,settleStatusCd,settleStatusCdBefore,settleYm" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("settleId", stSettle.settleId), // 정산ID 필터
            QdslUtil.FieldDef.like("settleMemo", stSettle.settleMemo), // 정산 메모
            QdslUtil.FieldDef.like("settleStatusCd", stSettle.settleStatusCd), // 상태 — SETTLE_STATUS_CD (DRAFT/CONFIRMED/CLOSED/PAID)
            QdslUtil.FieldDef.like("settleStatusCdBefore", stSettle.settleStatusCdBefore), // 변경 전 상태
            QdslUtil.FieldDef.like("settleYm", stSettle.settleYm), // 정산년월 (YYYYMM)
            QdslUtil.FieldDef.like("vendorId", stSettle.vendorId) // 업체ID (sy_vendor.vendor_id)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("settleId", stSettle.settleId,
                   "settleYm", stSettle.settleYm),
        new OrderSpecifier<>(Order.DESC, stSettle.regDate),
        new OrderSpecifier<>(Order.ASC, stSettle.settleId));
    }

    /* 정산 수정 */
    @Override
    public int updateSelective(StSettle entity) {
        if (entity.getSettleId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettle);
        boolean hasAny = false;

        if (entity.getVendorId()             != null) { update.set(stSettle.vendorId,             entity.getVendorId());             hasAny = true; }
        if (entity.getSettleYm()             != null) { update.set(stSettle.settleYm,             entity.getSettleYm());             hasAny = true; }
        if (entity.getSettleStartDate()      != null) { update.set(stSettle.settleStartDate,      entity.getSettleStartDate());      hasAny = true; }
        if (entity.getSettleEndDate()        != null) { update.set(stSettle.settleEndDate,        entity.getSettleEndDate());        hasAny = true; }
        if (entity.getTotalOrderAmt()        != null) { update.set(stSettle.totalOrderAmt,        entity.getTotalOrderAmt());        hasAny = true; }
        if (entity.getTotalReturnAmt()       != null) { update.set(stSettle.totalReturnAmt,       entity.getTotalReturnAmt());       hasAny = true; }
        if (entity.getTotalClaimCnt()        != null) { update.set(stSettle.totalClaimCnt,        entity.getTotalClaimCnt());        hasAny = true; }
        if (entity.getTotalDiscntAmt()       != null) { update.set(stSettle.totalDiscntAmt,       entity.getTotalDiscntAmt());       hasAny = true; }
        if (entity.getCommissionRate()       != null) { update.set(stSettle.commissionRate,       entity.getCommissionRate());       hasAny = true; }
        if (entity.getCommissionAmt()        != null) { update.set(stSettle.commissionAmt,        entity.getCommissionAmt());        hasAny = true; }
        if (entity.getSettleAmt()            != null) { update.set(stSettle.settleAmt,            entity.getSettleAmt());            hasAny = true; }
        if (entity.getAdjAmt()               != null) { update.set(stSettle.adjAmt,               entity.getAdjAmt());               hasAny = true; }
        if (entity.getEtcAdjAmt()            != null) { update.set(stSettle.etcAdjAmt,            entity.getEtcAdjAmt());            hasAny = true; }
        if (entity.getFinalSettleAmt()       != null) { update.set(stSettle.finalSettleAmt,       entity.getFinalSettleAmt());       hasAny = true; }
        if (entity.getSettleStatusCd()       != null) { update.set(stSettle.settleStatusCd,       entity.getSettleStatusCd());       hasAny = true; }
        if (entity.getSettleStatusCdBefore() != null) { update.set(stSettle.settleStatusCdBefore, entity.getSettleStatusCdBefore()); hasAny = true; }
        if (entity.getSettleMemo()           != null) { update.set(stSettle.settleMemo,           entity.getSettleMemo());           hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(stSettle.updBy,                entity.getUpdBy());                hasAny = true; }
        update.set(stSettle.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettle.settleId.eq(entity.getSettleId())).execute();
        return (int) affected;
    }
}
