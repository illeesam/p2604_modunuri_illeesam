package com.shopjoy.ecadminapi.base.zz.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample1;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample1Repository;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
/** ZzSample1(다목적 샘플/코드성 데이터 저장소) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample1RepositoryImpl implements QZzSample1Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample1RepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QZzSample1 zzSample1 = QZzSample1.zzSample1;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (zz_sample1 는 다목적 샘플 테이블이라 sy_code 미등록.
     * 아래는 실제 값이 아니라 필드 용도를 보여주기 위한 예시 가상 코드)
     * USE_YN     {Y: '사용', N: '미사용'}
     * STATUS_CD  {ACTIVE: '활성', INACTIVE: '비활성', PENDING: '대기'}
     * TYPE_CD    {NORMAL: '일반', SPECIAL: '특수'}
     * DIV_CD     {A: '구분A', B: '구분B'}
     * KIND_CD    {BASIC: '기본', CUSTOM: '커스텀'}
     */
    private JPAQuery<ZzSample1Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample1Dto.Item.class,
                        zzSample1.sample1Id,    // 샘플1 ID (PK, ZS1+YYMMDDHHmmss+rand4)
                        zzSample1.cdGrp,        // 도메인 구분 키 (S01_MEMBER / S02_PRODUCT 등)
                        zzSample1.cdVl,         // 코드 값
                        zzSample1.cdNm,         // 코드명 / 대표 텍스트 (회원명, 상품명 등)
                        zzSample1.srtordVl,     // 정렬 순서
                        zzSample1.attrNm1,      // 속성명1 (도메인별 재정의)
                        zzSample1.attrNm2,      // 속성명2
                        zzSample1.attrNm3,      // 속성명3
                        zzSample1.attrNm4,      // 속성명4
                        zzSample1.explnCn,      // 설명 내용
                        zzSample1.cdInfwSeCd,   // 코드 유입 구분 코드
                        zzSample1.useYn,        // 사용 여부 — USE_YN {Y: '사용', N: '미사용'}
                        zzSample1.regBy,        // 등록자
                        zzSample1.regDate,      // 등록일시
                        zzSample1.updBy,        // 수정자
                        zzSample1.updDate,      // 수정일시
                        zzSample1.groupCd,      // 그룹 코드
                        zzSample1.col01,        // 범용 컬럼01 (도메인별 재정의)
                        zzSample1.col02,        // 범용 컬럼02
                        zzSample1.col03,        // 범용 컬럼03
                        zzSample1.col04,        // 범용 컬럼04
                        zzSample1.col05,        // 범용 컬럼05
                        zzSample1.col06,        // 범용 컬럼06
                        zzSample1.col07,        // 범용 컬럼07
                        zzSample1.col08,        // 범용 컬럼08
                        zzSample1.col09,        // 범용 컬럼09
                        zzSample1.statusCd,     // 상태 코드 — STATUS_CD {ACTIVE: '활성', INACTIVE: '비활성', PENDING: '대기'}
                        zzSample1.typeCd,       // 유형 코드 — TYPE_CD {NORMAL: '일반', SPECIAL: '특수'}
                        zzSample1.divCd,        // 구분 코드 — DIV_CD {A: '구분A', B: '구분B'}
                        zzSample1.kindCd,       // 종류 코드 — KIND_CD {BASIC: '기본', CUSTOM: '커스텀'}
                        zzSample1.cateCds,       // 카테고리 코드 목록
                        zzSample1.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(zzSample1)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(zzSample1.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(zzSample1.regBy)) // 등록자
                ;
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample1Dto.Item> selectById(String id) {
        ZzSample1Dto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzSample1.sample1Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample1Dto.Item> selectList(ZzSample1Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(zzSample1.sample1Id, search.getSample1Ids())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(zzSample1.sample1Id, search.getSample1Id())); // 샘플1 ID 검색값
        whereList.add(QdslUtil.strEq(zzSample1.useYn, search.getUseYn())); // 사용 여부(Y/N) 검색값
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<ZzSample1Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<ZzSample1Dto.Item> list = query.fetch();
        return list;
    }

    /* 페이지조회 */
    @Override
    public BasePage<ZzSample1Dto.Item> selectPageData(ZzSample1Dto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(zzSample1.sample1Id, search.getSample1Ids())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(zzSample1.sample1Id, search.getSample1Id())); // 샘플1 ID 검색값
        whereList.add(QdslUtil.strEq(zzSample1.useYn, search.getUseYn())); // 사용 여부(Y/N) 검색값
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<ZzSample1Dto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<ZzSample1Dto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzSample1.count())
                .where(wheres)
                .fetchOne();

        BasePage<ZzSample1Dto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "attrNm1,attrNm2,attrNm3,attrNm4,cateCds" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("attrNm1", zzSample1.attrNm1), // 속성명1
            QdslUtil.FieldDef.like("attrNm2", zzSample1.attrNm2), // 속성명2
            QdslUtil.FieldDef.like("attrNm3", zzSample1.attrNm3), // 속성명3
            QdslUtil.FieldDef.like("attrNm4", zzSample1.attrNm4), // 속성명4
            QdslUtil.FieldDef.like("cateCds", zzSample1.cateCds), // 카테고리 코드 목록
            QdslUtil.FieldDef.like("cdGrp", zzSample1.cdGrp), // 도메인 구분 키 (S01_MEMBER / S02_PRODUCT 등)
            QdslUtil.FieldDef.like("cdInfwSeCd", zzSample1.cdInfwSeCd), // 코드 유입 구분 코드
            QdslUtil.FieldDef.like("cdNm", zzSample1.cdNm), // 코드명 / 대표 텍스트 (회원명, 상품명 등)
            QdslUtil.FieldDef.like("cdVl", zzSample1.cdVl), // 코드 값
            QdslUtil.FieldDef.like("col01", zzSample1.col01), // 범용 컬럼01 (도메인별 재정의)
            QdslUtil.FieldDef.like("col02", zzSample1.col02), // 범용 컬럼02
            QdslUtil.FieldDef.like("col03", zzSample1.col03), // 범용 컬럼03
            QdslUtil.FieldDef.like("col04", zzSample1.col04), // 범용 컬럼04
            QdslUtil.FieldDef.like("col05", zzSample1.col05), // 범용 컬럼05
            QdslUtil.FieldDef.like("col06", zzSample1.col06), // 범용 컬럼06
            QdslUtil.FieldDef.like("col07", zzSample1.col07), // 범용 컬럼07
            QdslUtil.FieldDef.like("col08", zzSample1.col08), // 범용 컬럼08
            QdslUtil.FieldDef.like("col09", zzSample1.col09), // 범용 컬럼09
            QdslUtil.FieldDef.like("divCd", zzSample1.divCd), // 구분 코드
            QdslUtil.FieldDef.like("explnCn", zzSample1.explnCn), // 설명 내용
            QdslUtil.FieldDef.like("groupCd", zzSample1.groupCd), // 그룹 코드
            QdslUtil.FieldDef.like("kindCd", zzSample1.kindCd), // 종류 코드
            QdslUtil.FieldDef.like("sample1Id", zzSample1.sample1Id), // 샘플1 ID 검색값
            QdslUtil.FieldDef.like("statusCd", zzSample1.statusCd), // 상태 코드
            QdslUtil.FieldDef.like("typeCd", zzSample1.typeCd), // 유형 코드
            QdslUtil.FieldDef.like("useYn", zzSample1.useYn) // 사용 여부(Y/N) 검색값
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("sample1Id", zzSample1.sample1Id,
                   "regDate", zzSample1.regDate),
        new OrderSpecifier<>(Order.DESC, zzSample1.regDate),
        new OrderSpecifier<>(Order.ASC, zzSample1.sample1Id));
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample1 entity) {
        if (entity.getSample1Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzSample1);
        boolean hasAny = false;

        if (entity.getCdGrp()      != null) { update.set(zzSample1.cdGrp,      entity.getCdGrp());      hasAny = true; }
        if (entity.getCdVl()       != null) { update.set(zzSample1.cdVl,       entity.getCdVl());       hasAny = true; }
        if (entity.getCdNm()       != null) { update.set(zzSample1.cdNm,       entity.getCdNm());       hasAny = true; }
        if (entity.getSrtordVl()   != null) { update.set(zzSample1.srtordVl,   entity.getSrtordVl());   hasAny = true; }
        if (entity.getAttrNm1()    != null) { update.set(zzSample1.attrNm1,    entity.getAttrNm1());    hasAny = true; }
        if (entity.getAttrNm2()    != null) { update.set(zzSample1.attrNm2,    entity.getAttrNm2());    hasAny = true; }
        if (entity.getAttrNm3()    != null) { update.set(zzSample1.attrNm3,    entity.getAttrNm3());    hasAny = true; }
        if (entity.getAttrNm4()    != null) { update.set(zzSample1.attrNm4,    entity.getAttrNm4());    hasAny = true; }
        if (entity.getExplnCn()    != null) { update.set(zzSample1.explnCn,    entity.getExplnCn());    hasAny = true; }
        if (entity.getCdInfwSeCd() != null) { update.set(zzSample1.cdInfwSeCd, entity.getCdInfwSeCd()); hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(zzSample1.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(zzSample1.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(zzSample1.updDate,    entity.getUpdDate());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(zzSample1.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(zzSample1.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(zzSample1.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(zzSample1.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(zzSample1.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(zzSample1.cateCds,    entity.getCateCds());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(zzSample1.sample1Id.eq(entity.getSample1Id())).execute();
        return (int) affected;
    }
}
