package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStRecon;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStReconRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
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
/** StRecon QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStReconRepositoryImpl implements QStReconRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStReconRepositoryImpl";
    private static final QStRecon     stRecon    = QStRecon.stRecon;
    private static final QSySite      sySite  = QSySite.sySite;
    private static final QSyVendor    syVendor  = QSyVendor.syVendor;
    private static final QStSettleRaw stSettleRaw  = QStSettleRaw.stSettleRaw;
    private static final QSyCode      cdRt = new QSyCode("cd_rt");
    private static final QSyCode      cdRs = new QSyCode("cd_rs");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", stRecon.regDate,
        "upd_date", stRecon.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("reconId", stRecon.reconId),
        Map.entry("reconNote", stRecon.reconNote),
        Map.entry("reconStatusCd", stRecon.reconStatusCd),
        Map.entry("reconStatusCdBefore", stRecon.reconStatusCdBefore),
        Map.entry("reconTypeCd", stRecon.reconTypeCd),
        Map.entry("refId", stRecon.refId),
        Map.entry("refNo", stRecon.refNo),
        Map.entry("resolvedBy", stRecon.resolvedBy),
        Map.entry("settleId", stRecon.settleId),
        Map.entry("settlePeriod", stRecon.settlePeriod),
        Map.entry("settleRawId", stRecon.settleRawId),
        Map.entry("siteId", stRecon.siteId),
        Map.entry("vendorId", stRecon.vendorId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * RECON_TYPE    {ORDER: '주문대사', SETTLE: '정산대사'}
     * RECON_STATUS  {MATCHED: '일치', DIFF: '차이', MANUAL: '수동처리'}
     * (Entity 주석상 reconStatusCd 흐름: MATCHED/MISMATCH/RESOLVED — sy_code 실 데이터와 값 표기가 다름)
     */
    private JPAQuery<StReconDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StReconDto.Item.class,
                        stRecon.reconId,                 // 대사ID (PK, YYMMDDhhmmss+rand4)
                        stRecon.siteId,                  // 사이트ID
                        stRecon.vendorId,                 // 업체ID
                        stRecon.reconTypeCd,               // 대사유형 — RECON_TYPE {ORDER: '주문대사', SETTLE: '정산대사'}
                        stRecon.reconStatusCd,             // 대사상태 — RECON_STATUS {MATCHED: '일치', DIFF: '차이', MANUAL: '수동처리'}
                        stRecon.reconStatusCdBefore,       // 변경 전 대사상태
                        stRecon.settleId,                  // 정산ID (st_settle.settle_id)
                        stRecon.settleRawId,               // 수집원장ID (st_settle_raw.settle_raw_id)
                        stRecon.refId,                     // 참조ID (order_id / pay_id / claim_id 등)
                        stRecon.refNo,                     // 참조번호 스냅샷
                        stRecon.settlePeriod,              // 정산기간 (YYYY-MM)
                        stRecon.expectedAmt,               // 기대금액 (정산 계산값)
                        stRecon.actualAmt,                 // 실제금액 (외부/결제 확인값)
                        stRecon.diffAmt,                   // 차이금액 (expected_amt - actual_amt)
                        stRecon.reconNote,                 // 대사 메모
                        stRecon.resolvedBy,                // 해소 처리자 (sy_user.user_id)
                        stRecon.resolvedDate,               // 해소 일시
                        stRecon.regBy,                      // 등록자
                        stRecon.regDate,                    // 등록일시
                        stRecon.updBy,                      // 수정자
                        stRecon.updDate,                    // 수정일시
                        sySite.siteNm.as("siteNm"),                   // 사이트명 (조인)
                        syVendor.vendorNm.as("vendorNm"),             // 업체명 (조인)
                        stSettleRaw.prodNm.as("settleRawNm"),         // 수집원장 상품명 스냅샷 (조인)
                        cdRt.codeLabel.as("reconTypeCdNm"),           // 대사유형명 (sy_code 조인)
                        cdRs.codeLabel.as("reconStatusCdNm")         // 대사상태명 (sy_code 조인)
                ))
                .from(stRecon)
                .leftJoin(sySite).on(sySite.siteId.eq(stRecon.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stRecon.vendorId))
                .leftJoin(stSettleRaw).on(stSettleRaw.settleRawId.eq(stRecon.settleRawId))
                .leftJoin(cdRt).on(cdRt.codeGrp.eq("RECON_TYPE").and(cdRt.codeValue.eq(stRecon.reconTypeCd)))
                .leftJoin(cdRs).on(cdRs.codeGrp.eq("RECON_STATUS").and(cdRs.codeValue.eq(stRecon.reconStatusCd)));
    }

    /* 정산 대사(Reconciliation) 키조회 */
    @Override
    public Optional<StReconDto.Item> selectById(String id) {
        StReconDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stRecon.reconId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 대사(Reconciliation) 목록조회 */
    @Override
    public List<StReconDto.Item> selectList(StReconDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StReconDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stRecon.siteId, search.getSiteId()),
                    QdslUtil.strEq(stRecon.reconId, search.getReconId()),
                    QdslUtil.strEq(stRecon.reconTypeCd, search.getReconTypeCd()),
                    QdslUtil.strEq(stRecon.reconStatusCd, search.getReconStatusCd()),
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

    /* 정산 대사(Reconciliation) 페이지조회 */
    @Override
    public StReconDto.PageResponse selectPageData(StReconDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stRecon.siteId, search.getSiteId()),
                QdslUtil.strEq(stRecon.reconId, search.getReconId()),
                QdslUtil.strEq(stRecon.reconTypeCd, search.getReconTypeCd()),
                QdslUtil.strEq(stRecon.reconStatusCd, search.getReconStatusCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StReconDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StReconDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stRecon.count())
                .where(wheres)
                .fetchOne();

        StReconDto.PageResponse res = new StReconDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(StReconDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StReconDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stRecon.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stRecon.reconId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("reconId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stRecon.reconId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stRecon.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stRecon.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stRecon.reconId));
        }
        return orders;
    }

    /* 정산 대사(Reconciliation) 수정 */
    @Override
    public int updateSelective(StRecon entity) {
        if (entity.getReconId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stRecon);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(stRecon.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getVendorId()            != null) { update.set(stRecon.vendorId,            entity.getVendorId());            hasAny = true; }
        if (entity.getReconTypeCd()         != null) { update.set(stRecon.reconTypeCd,         entity.getReconTypeCd());         hasAny = true; }
        if (entity.getReconStatusCd()       != null) { update.set(stRecon.reconStatusCd,       entity.getReconStatusCd());       hasAny = true; }
        if (entity.getReconStatusCdBefore() != null) { update.set(stRecon.reconStatusCdBefore, entity.getReconStatusCdBefore()); hasAny = true; }
        if (entity.getSettleId()            != null) { update.set(stRecon.settleId,            entity.getSettleId());            hasAny = true; }
        if (entity.getSettleRawId()         != null) { update.set(stRecon.settleRawId,         entity.getSettleRawId());         hasAny = true; }
        if (entity.getRefId()               != null) { update.set(stRecon.refId,               entity.getRefId());               hasAny = true; }
        if (entity.getRefNo()               != null) { update.set(stRecon.refNo,               entity.getRefNo());               hasAny = true; }
        if (entity.getSettlePeriod()        != null) { update.set(stRecon.settlePeriod,        entity.getSettlePeriod());        hasAny = true; }
        if (entity.getExpectedAmt()         != null) { update.set(stRecon.expectedAmt,         entity.getExpectedAmt());         hasAny = true; }
        if (entity.getActualAmt()           != null) { update.set(stRecon.actualAmt,           entity.getActualAmt());           hasAny = true; }
        if (entity.getDiffAmt()             != null) { update.set(stRecon.diffAmt,             entity.getDiffAmt());             hasAny = true; }
        if (entity.getReconNote()           != null) { update.set(stRecon.reconNote,           entity.getReconNote());           hasAny = true; }
        if (entity.getResolvedBy()          != null) { update.set(stRecon.resolvedBy,          entity.getResolvedBy());          hasAny = true; }
        if (entity.getResolvedDate()        != null) { update.set(stRecon.resolvedDate,        entity.getResolvedDate());        hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(stRecon.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stRecon.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stRecon.reconId.eq(entity.getReconId())).execute();
        return (int) affected;
    }
}
