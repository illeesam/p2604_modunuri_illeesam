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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PdProdOpt (pd_prod_opt — 옵션값) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdOptRepositoryImpl implements QPdProdOptRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdOptRepositoryImpl";
    private static final QPdProdOpt pdProdOpt = QPdProdOpt.pdProdOpt;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdProdOpt.regDate,
        "upd_date", pdProdOpt.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("prodOptId", pdProdOpt.prodOptId),
        Map.entry("prodId", pdProdOpt.prodId),
        Map.entry("prodOptNm", pdProdOpt.prodOptNm),
        Map.entry("prodOptVal", pdProdOpt.prodOptVal),
        Map.entry("parentProdOptId", pdProdOpt.parentProdOptId),
        Map.entry("siteId", pdProdOpt.siteId),
        Map.entry("useYn", pdProdOpt.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 등록 기준)
     * PROD_OPT_STD_CD / PROD_OPT_TYPE1_CD / PROD_OPT_TYPE2_CD (OPT_VAL)
     *   {BLACK: '검정', WHITE: '흰색', RED: '빨강', BLUE: '파랑', GREEN: '초록', YELLOW: '노랑', PINK: '핑크', PURPLE: '보라', GRAY: '회색', BROWN: '갈색'}
     * USE_YN               {Y: '사용', N: '미사용'}
     * PROD_OPT_TYPE_LEVEL  {1: '1단 옵션', 2: '2단 옵션'}
     */
    private JPAQuery<PdProdOptDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdOptDto.Item.class,
                        pdProdOpt.prodOptId,           // 옵션ID (PK)
                        pdProdOpt.siteId,               // 사이트ID (sy_site.site_id)
                        pdProdOpt.prodId,               // 상품ID (pd_prod.prod_id) — 조회 편의용 비정규화 컬럼
                        pdProdOpt.prodOptNm,             // 옵션명 (예: 빨강, M)
                        pdProdOpt.prodOptVal,            // 실제 저장값 — 직접입력 또는 프리셋 선택 시 자동 채움
                        pdProdOpt.prodOptStdCd,           // 표준 코드값 — OPT_VAL {BLACK: '검정', WHITE: '흰색', RED: '빨강', ...}. 직접입력 시 NULL
                        pdProdOpt.parentProdOptId,        // 상위 옵션ID — 2단 옵션에서 상위 1단 옵션값 참조, NULL이면 독립값
                        pdProdOpt.prodOptStyle,          // 옵션 스타일 (컬러 hex 값, 아이콘 클래스 등)
                        pdProdOpt.sortOrd,               // 정렬순서
                        pdProdOpt.useYn,                  // 사용여부 — {Y: '사용', N: '미사용'}
                        pdProdOpt.prodOptTypeLevel,        // 옵션유형레벨 — {1: '1단 옵션', 2: '2단 옵션'}
                        pdProdOpt.prodOptType1Cd,         // 옵션유형1 분류코드 (예: COLOR)
                        pdProdOpt.prodOptType2Cd,         // 옵션유형2 분류코드 (예: SIZE)
                        pdProdOpt.regBy,
                        pdProdOpt.regDate,
                        pdProdOpt.updBy,
                        pdProdOpt.updDate
                ))
                .from(pdProdOpt);
    }

    /* 상품 옵션값 키조회 */
    @Override
    public Optional<PdProdOptDto.Item> selectById(String prodOptId) {
        PdProdOptDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdProdOpt.prodOptId.eq(prodOptId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 옵션값 목록조회 */
    @Override
    public List<PdProdOptDto.Item> selectList(PdProdOptDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pdProdOpt.prodId, search.getProdIds()),
                    QdslUtil.strEq(pdProdOpt.prodId, search.getProdId()),
                    QdslUtil.strEq(pdProdOpt.siteId, search.getSiteId()),
                    QdslUtil.strEq(pdProdOpt.prodOptId, search.getProdOptId()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 상품 옵션값 페이지조회 */
    @Override
    public PdProdOptDto.PageResponse selectPageData(PdProdOptDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pdProdOpt.prodId, search.getProdIds()),
                QdslUtil.strEq(pdProdOpt.prodId, search.getProdId()),
                QdslUtil.strEq(pdProdOpt.siteId, search.getSiteId()),
                QdslUtil.strEq(pdProdOpt.prodOptId, search.getProdOptId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        JPAQuery<PdProdOptDto.Item> query = baseSelColumnQuery();

        List<PdProdOptDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(pageSize)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProdOpt.count())
                .where(wheres)
                .fetchOne();

        PdProdOptDto.PageResponse res = new PdProdOptDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * ============================================================ */

private BooleanExpression andSearchValueLike(PdProdOptDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdProdOptDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.prodOptId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("prodOptId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdOpt.prodOptId));
                } else if ("prodOptNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdOpt.prodOptNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdOpt.regDate));
                } else if ("sortOrd".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdProdOpt.sortOrd));
                }
            }
        }
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdProdOpt.prodOptId));
        }
        return orders;
    }

    /* 상품 옵션값 수정 */
    @Override
    public int updateSelective(PdProdOpt entity) {
        if (entity.getProdOptId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProdOpt);
        boolean hasAny = false;

        if (entity.getSiteId()            != null) { update.set(pdProdOpt.siteId,            entity.getSiteId());            hasAny = true; }
        if (entity.getProdId()            != null) { update.set(pdProdOpt.prodId,            entity.getProdId());            hasAny = true; }
        if (entity.getProdOptNm()         != null) { update.set(pdProdOpt.prodOptNm,         entity.getProdOptNm());         hasAny = true; }
        if (entity.getProdOptVal()            != null) { update.set(pdProdOpt.prodOptVal,            entity.getProdOptVal());            hasAny = true; }
        if (entity.getParentProdOptId()       != null) { update.set(pdProdOpt.parentProdOptId,       entity.getParentProdOptId());       hasAny = true; }
        if (entity.getProdOptStyle()          != null) { update.set(pdProdOpt.prodOptStyle,          entity.getProdOptStyle());          hasAny = true; }
        if (entity.getSortOrd()           != null) { update.set(pdProdOpt.sortOrd,           entity.getSortOrd());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(pdProdOpt.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getProdOptTypeLevel()  != null) { update.set(pdProdOpt.prodOptTypeLevel,  entity.getProdOptTypeLevel());  hasAny = true; }
        if (entity.getProdOptType1Cd()    != null) { update.set(pdProdOpt.prodOptType1Cd,    entity.getProdOptType1Cd());    hasAny = true; }
        if (entity.getProdOptType2Cd()    != null) { update.set(pdProdOpt.prodOptType2Cd,    entity.getProdOptType2Cd());    hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(pdProdOpt.updBy,             entity.getUpdBy());             hasAny = true; }
        update.set(pdProdOpt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProdOpt.prodOptId.eq(entity.getProdOptId())).execute();
        return (int) affected;
    }
}
