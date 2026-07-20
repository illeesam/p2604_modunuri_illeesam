package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdDlivTmpltRepository;
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
/** PdDlivTmplt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdDlivTmpltRepositoryImpl implements QPdDlivTmpltRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdDlivTmpltRepositoryImpl";
    private static final QPdDlivTmplt pdDlivTmplt      = QPdDlivTmplt.pdDlivTmplt;
    private static final QSySite      sySite    = QSySite.sySite;
    private static final QSyVendor    syVendor    = QSyVendor.syVendor;
    private static final QSyCode      cdDm   = new QSyCode("cd_dm");
    private static final QSyCode      cdDpt  = new QSyCode("cd_dpt");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdDlivTmplt.regDate,
        "upd_date", pdDlivTmplt.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("baseDlivYn", pdDlivTmplt.baseDlivYn),
        Map.entry("dlivCourierCd", pdDlivTmplt.dlivCourierCd),
        Map.entry("dlivMethodCd", pdDlivTmplt.dlivMethodCd),
        Map.entry("dlivPayTypeCd", pdDlivTmplt.dlivPayTypeCd),
        Map.entry("dlivTmpltId", pdDlivTmplt.dlivTmpltId),
        Map.entry("dlivTmpltNm", pdDlivTmplt.dlivTmpltNm),
        Map.entry("returnAddr", pdDlivTmplt.returnAddr),
        Map.entry("returnAddrDetail", pdDlivTmplt.returnAddrDetail),
        Map.entry("returnAddrZip", pdDlivTmplt.returnAddrZip),
        Map.entry("returnCourierCd", pdDlivTmplt.returnCourierCd),
        Map.entry("returnTelNo", pdDlivTmplt.returnTelNo),
        Map.entry("siteId", pdDlivTmplt.siteId),
        Map.entry("useYn", pdDlivTmplt.useYn),
        Map.entry("vendorId", pdDlivTmplt.vendorId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 등록 기준)
     * DLIV_METHOD_CD    {COURIER: '택배', DIRECT: '직접배송', PICKUP: '방문수령'}
     * DLIV_PAY_TYPE_CD  {PREPAY: '선불', COD: '착불'}
     * BASE_DLIV_YN      {Y: '기본배송지', N: '일반'}
     * USE_YN            {Y: '사용', N: '미사용'}
     */
    private JPAQuery<PdDlivTmpltDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdDlivTmpltDto.Item.class,
                        pdDlivTmplt.dlivTmpltId,          // 배송템플릿ID (PK, YYMMDDhhmmss+rand4)
                        pdDlivTmplt.siteId,                // 사이트ID (sy_site.site_id)
                        pdDlivTmplt.vendorId,               // 업체ID (sy_vendor.vendor_id)
                        pdDlivTmplt.dlivTmpltNm,             // 템플릿명
                        pdDlivTmplt.dlivMethodCd,             // 배송방법 — {COURIER: '택배', DIRECT: '직접배송', PICKUP: '방문수령'}
                        pdDlivTmplt.dlivPayTypeCd,            // 배송비결제유형 — {PREPAY: '선불', COD: '착불'}
                        pdDlivTmplt.dlivCourierCd,           // 배송 택배사 코드
                        pdDlivTmplt.dlivCost,                // 기본 배송비
                        pdDlivTmplt.freeDlivMinAmt,          // 무료배송 최소 주문금액
                        pdDlivTmplt.islandExtraCost,          // 도서산간 추가배송비
                        pdDlivTmplt.returnCost,               // 반품배송비 (편도)
                        pdDlivTmplt.exchangeCost,              // 교환배송비 (왕복=반품+재발송)
                        pdDlivTmplt.returnCourierCd,           // 반품 택배사 코드
                        pdDlivTmplt.returnAddrZip,            // 반품지 우편번호
                        pdDlivTmplt.returnAddr,               // 반품지 주소
                        pdDlivTmplt.returnAddrDetail,          // 반품지 상세주소
                        pdDlivTmplt.returnTelNo,              // 반품지 전화번호
                        pdDlivTmplt.baseDlivYn,                // 기본배송지여부 — {Y: '기본', N: '일반'}
                        pdDlivTmplt.useYn,                     // 사용여부 — {Y: '사용', N: '미사용'}
                        pdDlivTmplt.regBy, pdDlivTmplt.regDate, pdDlivTmplt.updBy, pdDlivTmplt.updDate
                ))
                .from(pdDlivTmplt)
                .leftJoin(sySite).on(sySite.siteId.eq(pdDlivTmplt.siteId))
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pdDlivTmplt.vendorId))
                .leftJoin(cdDm).on(cdDm.codeGrp.eq("DLIV_METHOD").and(cdDm.codeValue.eq(pdDlivTmplt.dlivMethodCd)))
                .leftJoin(cdDpt).on(cdDpt.codeGrp.eq("DLIV_PAY_TYPE").and(cdDpt.codeValue.eq(pdDlivTmplt.dlivPayTypeCd)));
    }

    /* 배송 템플릿 키조회 */
    @Override
    public Optional<PdDlivTmpltDto.Item> selectById(String dlivTmpltId) {
        PdDlivTmpltDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdDlivTmplt.dlivTmpltId.eq(dlivTmpltId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 배송 템플릿 목록조회 */
    @Override
    public List<PdDlivTmpltDto.Item> selectList(PdDlivTmpltDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdDlivTmpltDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pdDlivTmplt.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdDlivTmplt.dlivTmpltId, search.getDlivTmpltId()),
                    QdslUtil.strEq(pdDlivTmplt.dlivMethodCd, search.getDlivMethodCd()),
                    QdslUtil.strEq(pdDlivTmplt.useYn, search.getUseYn()),
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

    /* 배송 템플릿 페이지조회 */
    @Override
    public PdDlivTmpltDto.PageResponse selectPageData(PdDlivTmpltDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdDlivTmplt.siteId, search.getSiteId()),
                QdslUtil.strEq(pdDlivTmplt.dlivTmpltId, search.getDlivTmpltId()),
                QdslUtil.strEq(pdDlivTmplt.dlivMethodCd, search.getDlivMethodCd()),
                QdslUtil.strEq(pdDlivTmplt.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdDlivTmpltDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdDlivTmpltDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdDlivTmplt.count())
                .where(wheres)
                .fetchOne();

        PdDlivTmpltDto.PageResponse res = new PdDlivTmpltDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdDlivTmpltDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdDlivTmpltDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdDlivTmplt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdDlivTmplt.dlivTmpltId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("dlivTmpltId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdDlivTmplt.dlivTmpltId));
                } else if ("dlivTmpltNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdDlivTmplt.dlivTmpltNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdDlivTmplt.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdDlivTmplt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdDlivTmplt.dlivTmpltId));
        }
        return orders;
    }

    /* 배송 템플릿 수정 */

    @Override
    public int updateSelective(PdDlivTmplt entity) {
        if (entity.getDlivTmpltId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdDlivTmplt);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(pdDlivTmplt.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getVendorId()         != null) { update.set(pdDlivTmplt.vendorId,         entity.getVendorId());         hasAny = true; }
        if (entity.getDlivTmpltNm()      != null) { update.set(pdDlivTmplt.dlivTmpltNm,      entity.getDlivTmpltNm());      hasAny = true; }
        if (entity.getDlivMethodCd()     != null) { update.set(pdDlivTmplt.dlivMethodCd,     entity.getDlivMethodCd());     hasAny = true; }
        if (entity.getDlivPayTypeCd()    != null) { update.set(pdDlivTmplt.dlivPayTypeCd,    entity.getDlivPayTypeCd());    hasAny = true; }
        if (entity.getDlivCourierCd()    != null) { update.set(pdDlivTmplt.dlivCourierCd,    entity.getDlivCourierCd());    hasAny = true; }
        if (entity.getDlivCost()         != null) { update.set(pdDlivTmplt.dlivCost,         entity.getDlivCost());         hasAny = true; }
        if (entity.getFreeDlivMinAmt()   != null) { update.set(pdDlivTmplt.freeDlivMinAmt,   entity.getFreeDlivMinAmt());   hasAny = true; }
        if (entity.getIslandExtraCost()  != null) { update.set(pdDlivTmplt.islandExtraCost,  entity.getIslandExtraCost());  hasAny = true; }
        if (entity.getReturnCost()       != null) { update.set(pdDlivTmplt.returnCost,       entity.getReturnCost());       hasAny = true; }
        if (entity.getExchangeCost()     != null) { update.set(pdDlivTmplt.exchangeCost,     entity.getExchangeCost());     hasAny = true; }
        if (entity.getReturnCourierCd()  != null) { update.set(pdDlivTmplt.returnCourierCd,  entity.getReturnCourierCd());  hasAny = true; }
        if (entity.getReturnAddrZip()    != null) { update.set(pdDlivTmplt.returnAddrZip,    entity.getReturnAddrZip());    hasAny = true; }
        if (entity.getReturnAddr()       != null) { update.set(pdDlivTmplt.returnAddr,       entity.getReturnAddr());       hasAny = true; }
        if (entity.getReturnAddrDetail() != null) { update.set(pdDlivTmplt.returnAddrDetail, entity.getReturnAddrDetail()); hasAny = true; }
        if (entity.getReturnTelNo()      != null) { update.set(pdDlivTmplt.returnTelNo,      entity.getReturnTelNo());      hasAny = true; }
        if (entity.getBaseDlivYn()       != null) { update.set(pdDlivTmplt.baseDlivYn,       entity.getBaseDlivYn());       hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(pdDlivTmplt.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(pdDlivTmplt.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdDlivTmplt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdDlivTmplt.dlivTmpltId.eq(entity.getDlivTmpltId())).execute();
        return (int) affected;
    }
}
