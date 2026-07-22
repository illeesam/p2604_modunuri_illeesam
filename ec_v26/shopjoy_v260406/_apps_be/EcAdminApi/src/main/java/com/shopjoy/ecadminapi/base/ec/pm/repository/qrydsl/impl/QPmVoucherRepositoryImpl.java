package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmVoucherRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmVoucher QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmVoucherRepositoryImpl implements QPmVoucherRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmVoucherRepositoryImpl";
    private static final QPmVoucher pmVoucher    = QPmVoucher.pmVoucher;
    private static final QSySite    sySite  = QSySite.sySite;
    private static final QSyCode    cdVt = new QSyCode("cd_vt");
    private static final QSyCode    cdVs = new QSyCode("cd_vs");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmVoucher.regDate,
        "upd_date", pmVoucher.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("siteId", pmVoucher.siteId),
        Map.entry("useYn", pmVoucher.useYn),
        Map.entry("voucherDesc", pmVoucher.voucherDesc),
        Map.entry("voucherId", pmVoucher.voucherId),
        Map.entry("voucherNm", pmVoucher.voucherNm),
        Map.entry("voucherStatusCd", pmVoucher.voucherStatusCd),
        Map.entry("voucherStatusCdBefore", pmVoucher.voucherStatusCdBefore),
        Map.entry("voucherTypeCd", pmVoucher.voucherTypeCd)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * VOUCHER_TYPE    {AMOUNT: '금액권', RATE: '정률권'}
     * VOUCHER_STATUS  {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'}
     */
    private JPAQuery<PmVoucherDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherDto.Item.class,
                        pmVoucher.voucherId,               // 상품권ID (PK, YYMMDDhhmmss+rand4)
                        pmVoucher.siteId,                  // 사이트ID
                        pmVoucher.voucherNm,               // 상품권명
                        pmVoucher.voucherTypeCd,           // 유형 — VOUCHER_TYPE {AMOUNT: '금액권', RATE: '정률권'}
                        pmVoucher.voucherValue,            // 권면금액 또는 할인율
                        pmVoucher.minOrderAmt,             // 사용 최소주문금액
                        pmVoucher.maxDiscntAmt,            // 최대할인한도 (정률권)
                        pmVoucher.expireMonth,             // 유효기간 (발급 후 N개월, NULL=무제한)
                        pmVoucher.voucherStatusCd,         // 상태 — VOUCHER_STATUS {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'}
                        pmVoucher.voucherStatusCdBefore,   // 변경 전 상태
                        pmVoucher.voucherDesc,             // 상품권 설명
                        pmVoucher.useYn, pmVoucher.regBy, pmVoucher.regDate, pmVoucher.updBy, pmVoucher.updDate
                ))
                .from(pmVoucher)
                .leftJoin(sySite).on(sySite.siteId.eq(pmVoucher.siteId))
                .leftJoin(cdVt).on(cdVt.codeGrp.eq("VOUCHER_TYPE").and(cdVt.codeValue.eq(pmVoucher.voucherTypeCd)))
                .leftJoin(cdVs).on(cdVs.codeGrp.eq("VOUCHER_STATUS").and(cdVs.codeValue.eq(pmVoucher.voucherStatusCd)));
    }

    /* 바우처(상품권) 키조회 */
    @Override
    public Optional<PmVoucherDto.Item> selectById(String voucherId) {
        PmVoucherDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmVoucher.voucherId.eq(voucherId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 바우처(상품권) 목록조회 */
    @Override
    public List<PmVoucherDto.Item> selectList(PmVoucherDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmVoucher.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmVoucher.voucherId, search.getVoucherId()),
                    QdslUtil.strEq(pmVoucher.voucherStatusCd, search.getVoucherStatusCd()),
                    QdslUtil.strEq(pmVoucher.useYn, search.getUseYn()),
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

    /* 바우처(상품권) 페이지조회 */
    @Override
    public PmVoucherDto.PageResponse selectPageData(PmVoucherDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmVoucher.siteId, search.getSiteId()),
                QdslUtil.strEq(pmVoucher.voucherId, search.getVoucherId()),
                QdslUtil.strEq(pmVoucher.voucherStatusCd, search.getVoucherStatusCd()),
                QdslUtil.strEq(pmVoucher.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmVoucherDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmVoucherDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmVoucher.count())
                .where(wheres)
                .fetchOne();

        PmVoucherDto.PageResponse res = new PmVoucherDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PmVoucherDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmVoucherDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmVoucher.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmVoucher.voucherId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("voucherId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucher.voucherId));
                } else if ("voucherNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucher.voucherNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucher.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmVoucher.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmVoucher.voucherId));
        }
        return orders;
    }

    /* 바우처(상품권) 수정 */
    @Override
    public int updateSelective(PmVoucher entity) {
        if (entity.getVoucherId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmVoucher);
        boolean hasAny = false;

        if (entity.getSiteId()                != null) { update.set(pmVoucher.siteId,                entity.getSiteId());                hasAny = true; }
        if (entity.getVoucherNm()             != null) { update.set(pmVoucher.voucherNm,             entity.getVoucherNm());             hasAny = true; }
        if (entity.getVoucherTypeCd()         != null) { update.set(pmVoucher.voucherTypeCd,         entity.getVoucherTypeCd());         hasAny = true; }
        if (entity.getVoucherValue()          != null) { update.set(pmVoucher.voucherValue,          entity.getVoucherValue());          hasAny = true; }
        if (entity.getMinOrderAmt()           != null) { update.set(pmVoucher.minOrderAmt,           entity.getMinOrderAmt());           hasAny = true; }
        if (entity.getMaxDiscntAmt()          != null) { update.set(pmVoucher.maxDiscntAmt,          entity.getMaxDiscntAmt());          hasAny = true; }
        if (entity.getExpireMonth()           != null) { update.set(pmVoucher.expireMonth,           entity.getExpireMonth());           hasAny = true; }
        if (entity.getVoucherStatusCd()       != null) { update.set(pmVoucher.voucherStatusCd,       entity.getVoucherStatusCd());       hasAny = true; }
        if (entity.getVoucherStatusCdBefore() != null) { update.set(pmVoucher.voucherStatusCdBefore, entity.getVoucherStatusCdBefore()); hasAny = true; }
        if (entity.getVoucherDesc()           != null) { update.set(pmVoucher.voucherDesc,           entity.getVoucherDesc());           hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(pmVoucher.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(pmVoucher.updBy,                 entity.getUpdBy());                 hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmVoucher.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmVoucher.voucherId.eq(entity.getVoucherId())).execute();
        return (int) affected;
    }
}
