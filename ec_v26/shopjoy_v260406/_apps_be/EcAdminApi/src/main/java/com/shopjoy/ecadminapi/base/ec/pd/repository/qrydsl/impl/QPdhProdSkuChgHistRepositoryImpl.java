package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdSkuChgHistRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdhProdSkuChgHist QueryDSL Custom 구현체 — write-once 로그성 (updBy/updDate 없음) */
@RequiredArgsConstructor
public class QPdhProdSkuChgHistRepositoryImpl implements QPdhProdSkuChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdSkuChgHistRepositoryImpl";
    private static final QPdhProdSkuChgHist pdhProdSkuChgHist      = QPdhProdSkuChgHist.pdhProdSkuChgHist;
    private static final QSySite            sySite    = QSySite.sySite;
    private static final QPdProd            pdProd    = QPdProd.pdProd;
    private static final QVwSyCode            cd_sct = new QVwSyCode("cd_sct");

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 등록 SKU_CHG_TYPE 기준. 실 데이터 미등록 시 Entity 주석 참고)
     * CHG_TYPE_CD  {STATUS: 'SKU 상태변경'} — 등록된 세부 코드값은 실 운영 sy_code 확인 필요
     */
    /* 상품 SKU 변경 이력 baseSelColumnQuery */
    private JPAQuery<PdhProdSkuChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdSkuChgHistDto.Item.class,
                        pdhProdSkuChgHist.histId,        // 이력ID (PK, YYMMDDhhmmss+rand4)
                        pdhProdSkuChgHist.prodSkuId,      // SKU ID (pd_prod_sku.prod_sku_id)
                        pdhProdSkuChgHist.prodId,         // 상품ID (pd_prod.prod_id)
                        pdhProdSkuChgHist.chgTypeCd,       // 변경유형 (코드: SKU_CHG_TYPE)
                        pdhProdSkuChgHist.beforeVal,      // 변경 전 값
                        pdhProdSkuChgHist.afterVal,       // 변경 후 값
                        pdhProdSkuChgHist.chgReason,      // 변경사유
                        pdhProdSkuChgHist.chgBy,          // 처리자 (sy_user.user_id)
                        pdhProdSkuChgHist.chgDate,        // 처리일시
                        pdhProdSkuChgHist.regBy,
                        pdhProdSkuChgHist.regDate
                ))
                .from(pdhProdSkuChgHist)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdhProdSkuChgHist.prodId))
                .leftJoin(cd_sct).on(cd_sct.codeGrp.eq("SKU_CHG_TYPE").and(cd_sct.codeValue.eq(pdhProdSkuChgHist.chgTypeCd)));
    }

    /* 상품 SKU 변경 이력 키조회 */
    @Override
    public Optional<PdhProdSkuChgHistDto.Item> selectById(String id) {
        PdhProdSkuChgHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdSkuChgHist.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 SKU 변경 이력 목록조회 */
    @Override
    public List<PdhProdSkuChgHistDto.Item> selectList(PdhProdSkuChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdSkuChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(pdhProdSkuChgHist.histId, search.getHistId()),
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

    /* 상품 SKU 변경 이력 페이지조회 */
    @Override
    public BasePage<PdhProdSkuChgHistDto.Item> selectPageData(PdhProdSkuChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdhProdSkuChgHist.histId, search.getHistId()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdhProdSkuChgHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdhProdSkuChgHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdSkuChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdhProdSkuChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("afterVal", pdhProdSkuChgHist.afterVal),
            QdslUtil.FieldDef.like("beforeVal", pdhProdSkuChgHist.beforeVal),
            QdslUtil.FieldDef.like("chgBy", pdhProdSkuChgHist.chgBy),
            QdslUtil.FieldDef.like("chgReason", pdhProdSkuChgHist.chgReason),
            QdslUtil.FieldDef.like("chgTypeCd", pdhProdSkuChgHist.chgTypeCd),
            QdslUtil.FieldDef.like("histId", pdhProdSkuChgHist.histId),
            QdslUtil.FieldDef.like("prodId", pdhProdSkuChgHist.prodId),
            QdslUtil.FieldDef.like("skuId", pdhProdSkuChgHist.prodSkuId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdhProdSkuChgHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = QdslUtil.sortOf(s);
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdhProdSkuChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdSkuChgHist.histId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("histId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdSkuChgHist.histId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdSkuChgHist.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdhProdSkuChgHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdSkuChgHist.histId));
        }
        return orders;
    }

    /* 상품 SKU 변경 이력 수정 */
    @Override
    public int updateSelective(PdhProdSkuChgHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdSkuChgHist);
        boolean hasAny = false;

        if (entity.getProdSkuId() != null) { update.set(pdhProdSkuChgHist.prodSkuId, entity.getProdSkuId()); hasAny = true; }
        if (entity.getProdId()    != null) { update.set(pdhProdSkuChgHist.prodId,    entity.getProdId());    hasAny = true; }
        if (entity.getChgTypeCd() != null) { update.set(pdhProdSkuChgHist.chgTypeCd, entity.getChgTypeCd()); hasAny = true; }
        if (entity.getBeforeVal() != null) { update.set(pdhProdSkuChgHist.beforeVal, entity.getBeforeVal()); hasAny = true; }
        if (entity.getAfterVal()  != null) { update.set(pdhProdSkuChgHist.afterVal,  entity.getAfterVal());  hasAny = true; }
        if (entity.getChgReason() != null) { update.set(pdhProdSkuChgHist.chgReason, entity.getChgReason()); hasAny = true; }
        if (entity.getChgBy()     != null) { update.set(pdhProdSkuChgHist.chgBy,     entity.getChgBy());     hasAny = true; }
        if (entity.getChgDate()   != null) { update.set(pdhProdSkuChgHist.chgDate,   entity.getChgDate());   hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pdhProdSkuChgHist.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
