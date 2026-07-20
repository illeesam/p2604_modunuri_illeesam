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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettlePayRepository;
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

/** StSettlePay QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettlePayRepositoryImpl implements QStSettlePayRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettlePayRepositoryImpl";
    private static final QStSettlePay stSettlePay     = QStSettlePay.stSettlePay;
    private static final QSyVendor    syVendor   = QSyVendor.syVendor;
    private static final QSySite      sySite   = QSySite.sySite;
    private static final QSyCode      cdPmc = new QSyCode("cd_pmc");
    private static final QSyCode      cdSps = new QSyCode("cd_sps");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", stSettlePay.regDate,
        "upd_date", stSettlePay.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("bankAccount", stSettlePay.bankAccount),
        Map.entry("bankHolder", stSettlePay.bankHolder),
        Map.entry("bankNm", stSettlePay.bankNm),
        Map.entry("payBy", stSettlePay.payBy),
        Map.entry("payMethodCd", stSettlePay.payMethodCd),
        Map.entry("payStatusCd", stSettlePay.payStatusCd),
        Map.entry("payStatusCdBefore", stSettlePay.payStatusCdBefore),
        Map.entry("settleId", stSettlePay.settleId),
        Map.entry("settlePayId", stSettlePay.settlePayId),
        Map.entry("settlePayMemo", stSettlePay.settlePayMemo),
        Map.entry("siteId", stSettlePay.siteId),
        Map.entry("vendorId", stSettlePay.vendorId)
    );

    /*
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
                        stSettlePay.siteId,                // 사이트ID
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
                        sySite.siteNm.as("siteNm"),                     // 사이트명 (조인)
                        cdPmc.codeLabel.as("payMethodCdNm"),            // 지급수단명 (sy_code 조인)
                        cdSps.codeLabel.as("payStatusCdNm")             // 지급상태명 (sy_code 조인)
                ))
                .from(stSettlePay)
                .leftJoin(syVendor).on(syVendor.vendorId.eq(stSettlePay.vendorId))
                .leftJoin(sySite).on(sySite.siteId.eq(stSettlePay.siteId))
                .leftJoin(cdPmc).on(cdPmc.codeGrp.eq("PAY_METHOD_CD").and(cdPmc.codeValue.eq(stSettlePay.payMethodCd)))
                .leftJoin(cdSps).on(cdSps.codeGrp.eq("SETTLE_PAY_STATUS").and(cdSps.codeValue.eq(stSettlePay.payStatusCd)));
    }

    /* 정산 지급 키조회 */
    @Override
    public Optional<StSettlePayDto.Item> selectById(String id) {
        StSettlePayDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettlePay.settlePayId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 지급 목록조회 */
    @Override
    public List<StSettlePayDto.Item> selectList(StSettlePayDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettlePayDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stSettlePay.siteId, search.getSiteId()),
                    QdslUtil.strEq(stSettlePay.settlePayId, search.getSettlePayId()),
                    QdslUtil.strEq(stSettlePay.payStatusCd, search.getPayStatusCd()),
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

    /* 정산 지급 페이지조회 */
    @Override
    public StSettlePayDto.PageResponse selectPageData(StSettlePayDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stSettlePay.siteId, search.getSiteId()),
                QdslUtil.strEq(stSettlePay.settlePayId, search.getSettlePayId()),
                QdslUtil.strEq(stSettlePay.payStatusCd, search.getPayStatusCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettlePayDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettlePayDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettlePay.count())
                .where(wheres)
                .fetchOne();

        StSettlePayDto.PageResponse res = new StSettlePayDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(StSettlePayDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettlePayDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettlePay.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettlePay.settlePayId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settlePayId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettlePay.settlePayId));
                } else if ("bankNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettlePay.bankNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettlePay.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettlePay.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettlePay.settlePayId));
        }
        return orders;
    }

    /* 정산 지급 수정 */
    @Override
    public int updateSelective(StSettlePay entity) {
        if (entity.getSettlePayId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettlePay);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(stSettlePay.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(stSettlePay.siteId,           entity.getSiteId());           hasAny = true; }
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettlePay.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettlePay.settlePayId.eq(entity.getSettlePayId())).execute();
        return (int) affected;
    }
}
