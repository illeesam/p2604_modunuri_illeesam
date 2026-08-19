package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyCodeRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyCode QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyCodeRepositoryImpl implements QSyCodeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyCodeRepositoryImpl";
    private static final QSyCode syCode = QSyCode.syCode;
    private static final QSyCodeGrp syCodeGrp = QSyCodeGrp.syCodeGrp;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN {Y: '사용', N: '미사용'}
     * (sy_code 자체가 전체 공통코드 메타 테이블 — code_grp 로 도메인 구분, code_value/code_label 이 실제 코드값/라벨.
     *  예: code_grp='SITE_STATUS_CD' 인 행의 code_value 는 ACTIVE/MAINTENANCE/INACTIVE)
     */
    private JPAQuery<SyCodeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyCodeDto.Item.class,
                        syCode.codeId,                        // 코드ID
                        syCode.codeGrpId,                     // 코드그룹ID (FK)
                        syCodeGrp.codeGrp.as("codeGrp"),      // 코드그룹명 (sy_code_grp 조인)
                        syCodeGrp.grpNm.as("grpNm"),          // 그룹명 (sy_code_grp 조인)
                        syCode.codeValue,                     // 코드값
                        syCode.codeLabel,                     // 코드라벨
                        syCode.sortOrd,                       // 정렬순서
                        syCode.useYn,                         // 사용여부
                        syCode.parentCodeValue,               // 부모 코드값
                        syCode.childCodeValues,               // 자식/전이 코드값 목록
                        syCode.codeRemark,                    // 비고
                        syCode.codeLevel,                     // 코드 트리 레벨
                        syCode.codeOpt1,                      // 부가 옵션 1
                        syCode.regBy,                         // 등록자
                        syCode.regDate,                       // 등록일시
                        syCode.updBy,                         // 수정자
                        syCode.updDate                       // 수정일시
                ))
                .from(syCode)
                .leftJoin(syCodeGrp).on(syCodeGrp.codeGrpId.eq(syCode.codeGrpId));
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
        DateTimePath<LocalDateTime> dateRangeField = syCode.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = syCode.updDate;
        }
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        JPAQuery<SyCodeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syCode.codeId, search.getCodeId()),
                QdslUtil.strEq(syCodeGrp.codeGrp, search.getCodeGrp()),
                andCodeGrpIn(search),
                QdslUtil.strEq(syCode.codeValue, search.getCodeValue()),
                QdslUtil.strEq(syCode.parentCodeValue, search.getParentCodeValue()),
                QdslUtil.strEq(syCode.useYn, search.getUseYn()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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
    public BasePage<SyCodeDto.Item> selectPageData(SyCodeDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = syCode.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = syCode.updDate;
        }
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syCode.codeId, search.getCodeId()),
                QdslUtil.strEq(syCodeGrp.codeGrp, search.getCodeGrp()),
                andCodeGrpIn(search),
                QdslUtil.strEq(syCode.codeValue, search.getCodeValue()),
                QdslUtil.strEq(syCode.parentCodeValue, search.getParentCodeValue()),
                QdslUtil.strEq(syCode.useYn, search.getUseYn()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

        BasePage<SyCodeDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("childCodeValues", syCode.childCodeValues),
            QdslUtil.FieldDef.like("codeId", syCode.codeId),
            QdslUtil.FieldDef.like("codeLabel", syCode.codeLabel),
            QdslUtil.FieldDef.like("codeOpt1", syCode.codeOpt1),
            QdslUtil.FieldDef.like("codeRemark", syCode.codeRemark),
            QdslUtil.FieldDef.like("codeValue", syCode.codeValue),
            QdslUtil.FieldDef.like("parentCodeValue", syCode.parentCodeValue),
            QdslUtil.FieldDef.like("useYn", syCode.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("codeId", syCode.codeId,
                   "regDate", syCode.regDate,
                   "sortOrd", syCode.sortOrd),
        new OrderSpecifier<>(Order.ASC, syCode.sortOrd),
        new OrderSpecifier<>(Order.ASC, syCode.regDate),
        new OrderSpecifier<>(Order.ASC, syCode.codeId));
    }

    /* 수정 */
    @Override
    public int updateSelective(SyCode entity) {
        if (entity.getCodeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syCode);
        boolean hasAny = false;

        if (entity.getCodeGrpId()       != null) { update.set(syCode.codeGrpId,       entity.getCodeGrpId());       hasAny = true; }
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

    /** 코드그룹 다중 조회 — 화면 단위 지연 로딩에서 필요한 그룹을 한 번에 가져온다 */
    private BooleanExpression andCodeGrpIn(SyCodeDto.Request search) {
        return QdslUtil.strIn(syCodeGrp.codeGrp, search.getCodeGrps());
    }
}
