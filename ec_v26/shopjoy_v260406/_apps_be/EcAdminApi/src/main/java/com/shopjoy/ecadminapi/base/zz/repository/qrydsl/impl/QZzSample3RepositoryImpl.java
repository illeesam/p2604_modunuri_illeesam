package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample3;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample3;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample3Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** ZzSample3 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample3RepositoryImpl implements QZzSample3Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample3RepositoryImpl";
    private static final QZzSample3 zzSample3 = QZzSample3.zzSample3;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("attrNm1", zzSample3.attrNm1),
        Map.entry("attrNm2", zzSample3.attrNm2),
        Map.entry("attrNm3", zzSample3.attrNm3),
        Map.entry("attrNm4", zzSample3.attrNm4),
        Map.entry("cateCds", zzSample3.cateCds),
        Map.entry("cdGrp", zzSample3.cdGrp),
        Map.entry("cdInfwSeCd", zzSample3.cdInfwSeCd),
        Map.entry("cdNm", zzSample3.cdNm),
        Map.entry("cdVl", zzSample3.cdVl),
        Map.entry("col01", zzSample3.col01),
        Map.entry("col02", zzSample3.col02),
        Map.entry("col03", zzSample3.col03),
        Map.entry("col04", zzSample3.col04),
        Map.entry("col05", zzSample3.col05),
        Map.entry("col06", zzSample3.col06),
        Map.entry("col07", zzSample3.col07),
        Map.entry("col08", zzSample3.col08),
        Map.entry("col09", zzSample3.col09),
        Map.entry("divCd", zzSample3.divCd),
        Map.entry("explnCn", zzSample3.explnCn),
        Map.entry("groupCd", zzSample3.groupCd),
        Map.entry("kindCd", zzSample3.kindCd),
        Map.entry("sample1Id", zzSample3.sample1Id),
        Map.entry("sample2Id", zzSample3.sample2Id),
        Map.entry("sample3Id", zzSample3.sample3Id),
        Map.entry("statusCd", zzSample3.statusCd),
        Map.entry("typeCd", zzSample3.typeCd),
        Map.entry("useYn", zzSample3.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (zz_sample3 는 다목적 샘플 테이블이라 sy_code 미등록.
     * 아래는 실제 값이 아니라 필드 용도를 보여주기 위한 예시 가상 코드)
     * USE_YN     {Y: '사용', N: '미사용'}
     * STATUS_CD  {ACTIVE: '활성', INACTIVE: '비활성', PENDING: '대기'}
     * TYPE_CD    {NORMAL: '일반', SPECIAL: '특수'}
     * DIV_CD     {A: '구분A', B: '구분B'}
     * KIND_CD    {BASIC: '기본', CUSTOM: '커스텀'}
     */
    private JPAQuery<ZzSample3Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample3Dto.Item.class,
                        zzSample3.sample3Id,    // 샘플3 ID (PK)
                        zzSample3.cdGrp,        // 도메인 구분 키
                        zzSample3.cdVl,         // 코드 값
                        zzSample3.cdNm,         // 코드명 / 대표 텍스트
                        zzSample3.srtordVl,     // 정렬 순서
                        zzSample3.attrNm1,      // 속성명1
                        zzSample3.attrNm2,      // 속성명2
                        zzSample3.attrNm3,      // 속성명3
                        zzSample3.attrNm4,      // 속성명4
                        zzSample3.explnCn,      // 설명 내용
                        zzSample3.cdInfwSeCd,   // 코드 유입 구분 코드
                        zzSample3.useYn,        // 사용 여부 — USE_YN {Y: '사용', N: '미사용'}
                        zzSample3.regBy,        // 등록자
                        zzSample3.regDate,      // 등록일시
                        zzSample3.updBy,        // 수정자
                        zzSample3.updDate,      // 수정일시
                        zzSample3.groupCd,      // 그룹 코드
                        zzSample3.col01,        // 범용 컬럼01
                        zzSample3.col02,        // 범용 컬럼02
                        zzSample3.col03,        // 범용 컬럼03
                        zzSample3.col04,        // 범용 컬럼04
                        zzSample3.col05,        // 범용 컬럼05
                        zzSample3.col06,        // 범용 컬럼06
                        zzSample3.col07,        // 범용 컬럼07
                        zzSample3.col08,        // 범용 컬럼08
                        zzSample3.col09,        // 범용 컬럼09
                        zzSample3.statusCd,     // 상태 코드 — STATUS_CD {ACTIVE: '활성', INACTIVE: '비활성', PENDING: '대기'}
                        zzSample3.typeCd,       // 유형 코드 — TYPE_CD {NORMAL: '일반', SPECIAL: '특수'}
                        zzSample3.divCd,        // 구분 코드 — DIV_CD {A: '구분A', B: '구분B'}
                        zzSample3.kindCd,       // 종류 코드 — KIND_CD {BASIC: '기본', CUSTOM: '커스텀'}
                        zzSample3.cateCds,      // 카테고리 코드 목록
                        zzSample3.sample1Id,    // 연관 샘플1 ID (FK)
                        zzSample3.sample2Id     // 연관 샘플2 ID (FK)
                ))
                .from(zzSample3);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample3Dto.Item> selectById(String id) {
        ZzSample3Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzSample3.sample3Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample3Dto.Item> selectList(ZzSample3Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample3Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strIn(zzSample3.sample1Id, search.getSample1Ids()),
                QdslUtil.strIn(zzSample3.sample2Id, search.getSample2Ids()),
                QdslUtil.strEq(zzSample3.sample3Id, search.getSample3Id()),
                QdslUtil.strEq(zzSample3.sample1Id, search.getSample1Id()),
                QdslUtil.strEq(zzSample3.sample2Id, search.getSample2Id()),
                QdslUtil.strEq(zzSample3.useYn, search.getUseYn()),
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

    /* 페이지조회 */
    @Override
    public ZzSample3Dto.PageResponse selectPageData(ZzSample3Dto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(zzSample3.sample1Id, search.getSample1Ids()),
                QdslUtil.strIn(zzSample3.sample2Id, search.getSample2Ids()),
                QdslUtil.strEq(zzSample3.sample3Id, search.getSample3Id()),
                QdslUtil.strEq(zzSample3.sample1Id, search.getSample1Id()),
                QdslUtil.strEq(zzSample3.sample2Id, search.getSample2Id()),
                QdslUtil.strEq(zzSample3.useYn, search.getUseYn()),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<ZzSample3Dto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<ZzSample3Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzSample3.count())
                .where(wheres)
                .fetchOne();

        ZzSample3Dto.PageResponse res = new ZzSample3Dto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(ZzSample3Dto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzSample3Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = search == null ? null : search.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, zzSample3.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample3.sample3Id));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sample3Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample3.sample3Id));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample3.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, zzSample3.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample3.sample3Id));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample3 entity) {
        if (entity.getSample3Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzSample3);
        boolean hasAny = false;

        if (entity.getCdGrp()      != null) { update.set(zzSample3.cdGrp,      entity.getCdGrp());      hasAny = true; }
        if (entity.getCdVl()       != null) { update.set(zzSample3.cdVl,       entity.getCdVl());       hasAny = true; }
        if (entity.getCdNm()       != null) { update.set(zzSample3.cdNm,       entity.getCdNm());       hasAny = true; }
        if (entity.getSrtordVl()   != null) { update.set(zzSample3.srtordVl,   entity.getSrtordVl());   hasAny = true; }
        if (entity.getAttrNm1()    != null) { update.set(zzSample3.attrNm1,    entity.getAttrNm1());    hasAny = true; }
        if (entity.getAttrNm2()    != null) { update.set(zzSample3.attrNm2,    entity.getAttrNm2());    hasAny = true; }
        if (entity.getAttrNm3()    != null) { update.set(zzSample3.attrNm3,    entity.getAttrNm3());    hasAny = true; }
        if (entity.getAttrNm4()    != null) { update.set(zzSample3.attrNm4,    entity.getAttrNm4());    hasAny = true; }
        if (entity.getExplnCn()    != null) { update.set(zzSample3.explnCn,    entity.getExplnCn());    hasAny = true; }
        if (entity.getCdInfwSeCd() != null) { update.set(zzSample3.cdInfwSeCd, entity.getCdInfwSeCd()); hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(zzSample3.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(zzSample3.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(zzSample3.updDate,    entity.getUpdDate());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(zzSample3.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(zzSample3.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(zzSample3.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(zzSample3.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(zzSample3.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(zzSample3.cateCds,    entity.getCateCds());    hasAny = true; }
        if (entity.getSample1Id()  != null) { update.set(zzSample3.sample1Id,  entity.getSample1Id());  hasAny = true; }
        if (entity.getSample2Id()  != null) { update.set(zzSample3.sample2Id,  entity.getSample2Id());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(zzSample3.sample3Id.eq(entity.getSample3Id())).execute();
        return (int) affected;
    }
}
