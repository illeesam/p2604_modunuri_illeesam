package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyCode QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyCodeRepositoryImpl implements QSyCodeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyCodeRepositoryImpl";
    private static final QSyCode syCode = QSyCode.syCode;
    private static final QSySite sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", syCode.regDate,
        "upd_date", syCode.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("childCodeValues", syCode.childCodeValues),
        Map.entry("codeGrp", syCode.codeGrp),
        Map.entry("codeId", syCode.codeId),
        Map.entry("codeLabel", syCode.codeLabel),
        Map.entry("codeOpt1", syCode.codeOpt1),
        Map.entry("codeRemark", syCode.codeRemark),
        Map.entry("codeValue", syCode.codeValue),
        Map.entry("parentCodeValue", syCode.parentCodeValue),
        Map.entry("siteId", syCode.siteId),
        Map.entry("useYn", syCode.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN {Y: '사용', N: '미사용'}
     * (sy_code 자체가 전체 공통코드 메타 테이블 — code_grp 로 도메인 구분, code_value/code_label 이 실제 코드값/라벨.
     *  예: code_grp='SITE_STATUS' 인 행의 code_value 는 ACTIVE/MAINTENANCE/INACTIVE)
     */
    private JPAQuery<SyCodeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyCodeDto.Item.class,
                        syCode.codeId,            // 코드ID (YYMMDDhhmmss+rand4)
                        syCode.siteId,            // 사이트ID (sy_site.site_id)
                        syCode.codeGrp,           // 코드그룹 (sy_code_grp.code_grp)
                        syCode.codeValue,         // 코드값 (저장값)
                        syCode.codeLabel,         // 코드라벨 (표시명)
                        syCode.sortOrd,           // 정렬순서
                        syCode.useYn,             // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syCode.parentCodeValue,   // 부모 코드값 (트리 구조 시 상위 code_value, null 이면 루트)
                        syCode.childCodeValues,   // 허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)
                        syCode.codeRemark,        // 비고
                        syCode.codeLevel,         // 코드 트리 레벨 (1=루트, 2=중간, 3=리프 등)
                        syCode.codeOpt1,          // 코드별 부가 옵션 1 (스타일 색상 hex, 아이콘 클래스 등 자유 문자열)
                        syCode.regBy,             // 등록자
                        syCode.regDate,           // 등록일시
                        syCode.updBy,             // 수정자
                        syCode.updDate,           // 수정일시
                        sySite.siteNm.as("siteNm")   // 사이트명 (sy_site 조인)
                ))
                .from(syCode)
                .leftJoin(sySite).on(sySite.siteId.eq(syCode.siteId));
    }

    /* 키조회 */
    @Override
    public Optional<SyCodeDto.Item> selectById(String codeId) {
        SyCodeDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syCode.codeId.eq(codeId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<SyCodeDto.Item> selectList(SyCodeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyCodeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syCode.siteId, search.getSiteId()),
                QdslUtil.strEq(syCode.codeId, search.getCodeId()),
                QdslUtil.strEq(syCode.codeGrp, search.getCodeGrp()),
                QdslUtil.strEq(syCode.codeValue, search.getCodeValue()),
                QdslUtil.strEq(syCode.parentCodeValue, search.getParentCodeValue()),
                QdslUtil.strEq(syCode.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 페이지조회 */
    @Override
    public SyCodeDto.PageResponse selectPageData(SyCodeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syCode.siteId, search.getSiteId()),
                QdslUtil.strEq(syCode.codeId, search.getCodeId()),
                QdslUtil.strEq(syCode.codeGrp, search.getCodeGrp()),
                QdslUtil.strEq(syCode.codeValue, search.getCodeValue()),
                QdslUtil.strEq(syCode.parentCodeValue, search.getParentCodeValue()),
                QdslUtil.strEq(syCode.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyCodeDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyCodeDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syCode.count())
                .where(wheres)
                .fetchOne();

        SyCodeDto.PageResponse res = new SyCodeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyCodeDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyCodeDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, syCode.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syCode.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syCode.codeId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("codeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syCode.codeId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syCode.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, syCode.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, syCode.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, syCode.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syCode.codeId));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(SyCode entity) {
        if (entity.getCodeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syCode);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(syCode.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getCodeGrp()         != null) { update.set(syCode.codeGrp,         entity.getCodeGrp());         hasAny = true; }
        if (entity.getCodeValue()       != null) { update.set(syCode.codeValue,       entity.getCodeValue());       hasAny = true; }
        if (entity.getCodeLabel()       != null) { update.set(syCode.codeLabel,       entity.getCodeLabel());       hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(syCode.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(syCode.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getParentCodeValue() != null) { update.set(syCode.parentCodeValue, entity.getParentCodeValue()); hasAny = true; }
        if (entity.getChildCodeValues() != null) { update.set(syCode.childCodeValues, entity.getChildCodeValues()); hasAny = true; }
        if (entity.getCodeRemark()      != null) { update.set(syCode.codeRemark,      entity.getCodeRemark());      hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(syCode.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syCode.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syCode.codeId.eq(entity.getCodeId())).execute();
        return (int) affected;
    }
}
