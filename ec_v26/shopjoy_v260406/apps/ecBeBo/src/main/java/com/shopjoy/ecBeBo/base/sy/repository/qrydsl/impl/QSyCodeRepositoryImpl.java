package com.shopjoy.ecBeBo.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyCodeGrp;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyCode;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyCodeRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
/** SyCode(공통코드) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyCodeRepositoryImpl implements QSyCodeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyCodeRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
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
                        syCode.updDate,                       // 수정일시
                        syCode.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syCode)
                .innerJoin(syCodeGrp).on(syCodeGrp.codeGrpId.eq(syCode.codeGrpId)) // 코드그룹
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syCode.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syCode.regBy)) // 등록자
                ;
    }

    /* 키조회 */
    @Override
    public Optional<SyCodeDto.Item> selectById(String codeId) {
        SyCodeDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syCode.codeId.eq(codeId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 목록조회 */
    @Override
    public List<SyCodeDto.Item> selectList(SyCodeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syCode.codeId, search.getCodeId())); // 코드ID 필터
        whereList.add(QdslUtil.strEq(syCodeGrp.codeGrp, search.getCodeGrp())); // 코드그룹코드 필터 (예: MEMBER_GRADE) — sy_code_grp.code_grp
        whereList.add(andCodeGrpIn(search));
        whereList.add(QdslUtil.strEq(syCode.codeValue, search.getCodeValue())); // 코드값 필터 (sy_code.code_value)
        whereList.add(QdslUtil.strEq(syCode.parentCodeValue, search.getParentCodeValue())); // 부모 코드값 필터
        whereList.add(QdslUtil.strEq(syCode.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syCode.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syCode.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyCodeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyCodeDto.Item> list = query.fetch();
        return list;
    }

    /* 페이지조회 */
    @Override
    public BasePage<SyCodeDto.Item> selectPageData(SyCodeDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syCode.codeId, search.getCodeId())); // 코드ID 필터
        whereList.add(QdslUtil.strEq(syCodeGrp.codeGrp, search.getCodeGrp())); // 코드그룹코드 필터 (예: MEMBER_GRADE) — sy_code_grp.code_grp
        whereList.add(andCodeGrpIn(search));
        whereList.add(QdslUtil.strEq(syCode.codeValue, search.getCodeValue())); // 코드값 필터 (sy_code.code_value)
        whereList.add(QdslUtil.strEq(syCode.parentCodeValue, search.getParentCodeValue())); // 부모 코드값 필터
        whereList.add(QdslUtil.strEq(syCode.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syCode.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syCode.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyCodeDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyCodeDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syCode.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyCodeDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "childCodeValues,codeId,codeLabel,codeOpt1,codeRemark" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("childCodeValues", syCode.childCodeValues), // 허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)
            QdslUtil.FieldDef.like("codeId", syCode.codeId), // 코드ID 필터
            QdslUtil.FieldDef.like("codeLabel", syCode.codeLabel), // 코드라벨 (화면 표시명, sy_code.code_label)
            QdslUtil.FieldDef.like("codeOpt1", syCode.codeOpt1), // 코드별 부가 옵션 1 (스타일 색상 hex, 아이콘 클래스 등 자유 문자열)
            QdslUtil.FieldDef.like("codeRemark", syCode.codeRemark), // 비고
            QdslUtil.FieldDef.like("codeValue", syCode.codeValue), // 코드값 필터 (sy_code.code_value)
            QdslUtil.FieldDef.like("parentCodeValue", syCode.parentCodeValue), // 부모 코드값 필터
            QdslUtil.FieldDef.like("useYn", syCode.useYn) // 사용여부 필터 Y/N
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
