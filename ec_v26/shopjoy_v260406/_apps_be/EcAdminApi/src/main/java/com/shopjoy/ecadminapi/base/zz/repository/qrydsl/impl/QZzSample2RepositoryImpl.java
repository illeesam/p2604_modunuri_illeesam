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
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.QZzSample2;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample2Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** ZzSample2 QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QZzSample2RepositoryImpl implements QZzSample2Repository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.zz.repository.qrydsl.impl.QZzSample2RepositoryImpl";
    private static final QZzSample2 zzSample2 = QZzSample2.zzSample2;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (zz_sample2 는 다목적 샘플 테이블이라 sy_code 미등록.
     * 아래는 실제 값이 아니라 필드 용도를 보여주기 위한 예시 가상 코드)
     * USE_YN     {Y: '사용', N: '미사용'}
     * STATUS_CD  {ACTIVE: '활성', INACTIVE: '비활성', PENDING: '대기'}
     * TYPE_CD    {NORMAL: '일반', SPECIAL: '특수'}
     * DIV_CD     {A: '구분A', B: '구분B'}
     * KIND_CD    {BASIC: '기본', CUSTOM: '커스텀'}
     */
    private JPAQuery<ZzSample2Dto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(ZzSample2Dto.Item.class,
                        zzSample2.sample2Id,    // 샘플2 ID (PK, ZS2+YYMMDDHHmmss+rand4)
                        zzSample2.cdGrp,        // 도메인 구분 키
                        zzSample2.cdVl,         // 코드 값
                        zzSample2.cdNm,         // 코드명 / 대표 텍스트
                        zzSample2.srtordVl,     // 정렬 순서
                        zzSample2.attrNm1,      // 속성명1
                        zzSample2.attrNm2,      // 속성명2
                        zzSample2.attrNm3,      // 속성명3
                        zzSample2.attrNm4,      // 속성명4
                        zzSample2.explnCn,      // 설명 내용
                        zzSample2.cdInfwSeCd,   // 코드 유입 구분 코드
                        zzSample2.useYn,        // 사용 여부 — USE_YN {Y: '사용', N: '미사용'}
                        zzSample2.regBy,        // 등록자
                        zzSample2.regDate,      // 등록일시
                        zzSample2.updBy,        // 수정자
                        zzSample2.updDate,      // 수정일시
                        zzSample2.groupCd,      // 그룹 코드
                        zzSample2.col01,        // 범용 컬럼01
                        zzSample2.col02,        // 범용 컬럼02
                        zzSample2.col03,        // 범용 컬럼03
                        zzSample2.col04,        // 범용 컬럼04
                        zzSample2.col05,        // 범용 컬럼05
                        zzSample2.col06,        // 범용 컬럼06
                        zzSample2.col07,        // 범용 컬럼07
                        zzSample2.col08,        // 범용 컬럼08
                        zzSample2.col09,        // 범용 컬럼09
                        zzSample2.statusCd,     // 상태 코드 — STATUS_CD {ACTIVE: '활성', INACTIVE: '비활성', PENDING: '대기'}
                        zzSample2.typeCd,       // 유형 코드 — TYPE_CD {NORMAL: '일반', SPECIAL: '특수'}
                        zzSample2.divCd,        // 구분 코드 — DIV_CD {A: '구분A', B: '구분B'}
                        zzSample2.kindCd,       // 종류 코드 — KIND_CD {BASIC: '기본', CUSTOM: '커스텀'}
                        zzSample2.cateCds,      // 카테고리 코드 목록
                        zzSample2.sample1Id     // 연관 샘플1 ID (FK)
                ))
                .from(zzSample2);
    }

    /* 키조회 */
    @Override
    public Optional<ZzSample2Dto.Item> selectById(String id) {
        ZzSample2Dto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(zzSample2.sample2Id.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<ZzSample2Dto.Item> selectList(ZzSample2Dto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<ZzSample2Dto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strIn(zzSample2.sample1Id, search.getSample1Ids()),
                QdslUtil.strIn(zzSample2.sample2Id, search.getSample2Ids()),
                QdslUtil.strEq(zzSample2.sample2Id, search.getSample2Id()),
                QdslUtil.strEq(zzSample2.sample1Id, search.getSample1Id()),
                QdslUtil.strEq(zzSample2.useYn, search.getUseYn()),
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

    /* 페이지조회 */
    @Override
    public BasePage<ZzSample2Dto.Item> selectPageData(ZzSample2Dto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(zzSample2.sample1Id, search.getSample1Ids()),
                QdslUtil.strIn(zzSample2.sample2Id, search.getSample2Ids()),
                QdslUtil.strEq(zzSample2.sample2Id, search.getSample2Id()),
                QdslUtil.strEq(zzSample2.sample1Id, search.getSample1Id()),
                QdslUtil.strEq(zzSample2.useYn, search.getUseYn()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<ZzSample2Dto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<ZzSample2Dto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(zzSample2.count())
                .where(wheres)
                .fetchOne();

        BasePage<ZzSample2Dto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("attrNm1", zzSample2.attrNm1),
            QdslUtil.FieldDef.like("attrNm2", zzSample2.attrNm2),
            QdslUtil.FieldDef.like("attrNm3", zzSample2.attrNm3),
            QdslUtil.FieldDef.like("attrNm4", zzSample2.attrNm4),
            QdslUtil.FieldDef.like("cateCds", zzSample2.cateCds),
            QdslUtil.FieldDef.like("cdGrp", zzSample2.cdGrp),
            QdslUtil.FieldDef.like("cdInfwSeCd", zzSample2.cdInfwSeCd),
            QdslUtil.FieldDef.like("cdNm", zzSample2.cdNm),
            QdslUtil.FieldDef.like("cdVl", zzSample2.cdVl),
            QdslUtil.FieldDef.like("col01", zzSample2.col01),
            QdslUtil.FieldDef.like("col02", zzSample2.col02),
            QdslUtil.FieldDef.like("col03", zzSample2.col03),
            QdslUtil.FieldDef.like("col04", zzSample2.col04),
            QdslUtil.FieldDef.like("col05", zzSample2.col05),
            QdslUtil.FieldDef.like("col06", zzSample2.col06),
            QdslUtil.FieldDef.like("col07", zzSample2.col07),
            QdslUtil.FieldDef.like("col08", zzSample2.col08),
            QdslUtil.FieldDef.like("col09", zzSample2.col09),
            QdslUtil.FieldDef.like("divCd", zzSample2.divCd),
            QdslUtil.FieldDef.like("explnCn", zzSample2.explnCn),
            QdslUtil.FieldDef.like("groupCd", zzSample2.groupCd),
            QdslUtil.FieldDef.like("kindCd", zzSample2.kindCd),
            QdslUtil.FieldDef.like("sample1Id", zzSample2.sample1Id),
            QdslUtil.FieldDef.like("sample2Id", zzSample2.sample2Id),
            QdslUtil.FieldDef.like("statusCd", zzSample2.statusCd),
            QdslUtil.FieldDef.like("typeCd", zzSample2.typeCd),
            QdslUtil.FieldDef.like("useYn", zzSample2.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(ZzSample2Dto.Request search) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = QdslUtil.sortOf(search);
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, zzSample2.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample2.sample2Id));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sample2Id".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample2.sample2Id));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, zzSample2.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, zzSample2.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, zzSample2.sample2Id));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(ZzSample2 entity) {
        if (entity.getSample2Id() == null) return 0;

        JPAUpdateClause update = queryFactory.update(zzSample2);
        boolean hasAny = false;

        if (entity.getCdGrp()      != null) { update.set(zzSample2.cdGrp,      entity.getCdGrp());      hasAny = true; }
        if (entity.getCdVl()       != null) { update.set(zzSample2.cdVl,       entity.getCdVl());       hasAny = true; }
        if (entity.getCdNm()       != null) { update.set(zzSample2.cdNm,       entity.getCdNm());       hasAny = true; }
        if (entity.getSrtordVl()   != null) { update.set(zzSample2.srtordVl,   entity.getSrtordVl());   hasAny = true; }
        if (entity.getAttrNm1()    != null) { update.set(zzSample2.attrNm1,    entity.getAttrNm1());    hasAny = true; }
        if (entity.getAttrNm2()    != null) { update.set(zzSample2.attrNm2,    entity.getAttrNm2());    hasAny = true; }
        if (entity.getAttrNm3()    != null) { update.set(zzSample2.attrNm3,    entity.getAttrNm3());    hasAny = true; }
        if (entity.getAttrNm4()    != null) { update.set(zzSample2.attrNm4,    entity.getAttrNm4());    hasAny = true; }
        if (entity.getExplnCn()    != null) { update.set(zzSample2.explnCn,    entity.getExplnCn());    hasAny = true; }
        if (entity.getCdInfwSeCd() != null) { update.set(zzSample2.cdInfwSeCd, entity.getCdInfwSeCd()); hasAny = true; }
        if (entity.getUseYn()      != null) { update.set(zzSample2.useYn,      entity.getUseYn());      hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(zzSample2.updBy,      entity.getUpdBy());      hasAny = true; }
        if (entity.getUpdDate()    != null) { update.set(zzSample2.updDate,    entity.getUpdDate());    hasAny = true; }
        if (entity.getGroupCd()    != null) { update.set(zzSample2.groupCd,    entity.getGroupCd());    hasAny = true; }
        if (entity.getStatusCd()   != null) { update.set(zzSample2.statusCd,   entity.getStatusCd());   hasAny = true; }
        if (entity.getTypeCd()     != null) { update.set(zzSample2.typeCd,     entity.getTypeCd());     hasAny = true; }
        if (entity.getDivCd()      != null) { update.set(zzSample2.divCd,      entity.getDivCd());      hasAny = true; }
        if (entity.getKindCd()     != null) { update.set(zzSample2.kindCd,     entity.getKindCd());     hasAny = true; }
        if (entity.getCateCds()    != null) { update.set(zzSample2.cateCds,    entity.getCateCds());    hasAny = true; }
        if (entity.getSample1Id()  != null) { update.set(zzSample2.sample1Id,  entity.getSample1Id());  hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(zzSample2.sample2Id.eq(entity.getSample2Id())).execute();
        return (int) affected;
    }
}
