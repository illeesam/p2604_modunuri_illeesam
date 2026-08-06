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

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** StSettle QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleRepositoryImpl implements QStSettleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleRepositoryImpl";
    private static final QStSettle  stSettle   = QStSettle.stSettle;
    private static final QSyVendor  syVendor = QSyVendor.syVendor;
    private static final QSySite    sySite = QSySite.sySite;
    private static final QVwSyCode    cdSs = new QVwSyCode("cd_ss");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of(
        "reg_date", stSettle.regDate,
        "upd_date", stSettle.updDate
    );

    /*
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
                        cdSs.codeLabel.as("settleStatusCdNm")           // 상태명 (sy_code 조인)
                ))
                .from(stSettle)
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stSettle.vendorId))
                .leftJoin(cdSs).on(cdSs.codeGrp.eq("SETTLE_STATUS").and(cdSs.codeValue.eq(stSettle.settleStatusCd)));
    }

    /* 정산 키조회 */
    @Override
    public Optional<StSettleDto.Item> selectById(String id) {
        StSettleDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettle.settleId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 목록조회 */
    @Override
    public List<StSettleDto.Item> selectList(StSettleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stSettle.settleId, search.getSettleId()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
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

    /* 정산 페이지조회 */
    @Override
    public BasePage<StSettleDto.Item> selectPageData(StSettleDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stSettle.settleId, search.getSettleId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettle.count())
                .where(wheres)
                .fetchOne();

        BasePage<StSettleDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("settleId", stSettle.settleId),
            QdslUtil.FieldDef.like("settleMemo", stSettle.settleMemo),
            QdslUtil.FieldDef.like("settleStatusCd", stSettle.settleStatusCd),
            QdslUtil.FieldDef.like("settleStatusCdBefore", stSettle.settleStatusCdBefore),
            QdslUtil.FieldDef.like("settleYm", stSettle.settleYm),
            QdslUtil.FieldDef.like("vendorId", stSettle.vendorId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = QdslUtil.sortOf(c);
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettle.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettle.settleId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettle.settleId));
                } else if ("settleYm".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettle.settleYm));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettle.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettle.settleId));
        }
        return orders;
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettle.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettle.settleId.eq(entity.getSettleId())).execute();
        return (int) affected;
    }
}
