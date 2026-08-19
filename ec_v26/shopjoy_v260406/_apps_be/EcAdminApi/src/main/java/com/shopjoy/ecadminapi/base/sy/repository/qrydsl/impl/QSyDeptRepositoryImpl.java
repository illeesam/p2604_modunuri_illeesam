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
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyDeptRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyDept QueryDSL Custom 구현체 */
public class QSyDeptRepositoryImpl implements QSyDeptRepository {

    private final JPAQueryFactory queryFactory;
    private final SyDeptRepository syDeptRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyDeptRepositoryImpl";
    private static final QSyDept syDept = QSyDept.syDept;

    public QSyDeptRepositoryImpl(JPAQueryFactory queryFactory, @Lazy SyDeptRepository syDeptRepository) {
        this.queryFactory = queryFactory;
        this.syDeptRepository = syDeptRepository;
    }
    private static final QSyUser syUser = QSyUser.syUser;
    private static final QVwSyCode cdDt = new QVwSyCode("cd_dt");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * DEPT_TYPE {HQ: '본사', DEV: '개발팀', DEV_BACKEND: '백엔드', DEV_FRONTEND: '프론트엔드', MKT: '마케팅팀', LOGIS: '물류팀'}
     * USE_YN    {Y: '사용', N: '미사용'}
     */
    private JPAQuery<SyDeptDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyDeptDto.Item.class,
                        syDept.deptId,         // 부서ID (YYMMDDhhmmss+rand4)
                        syDept.deptCode,       // 부서코드
                        syDept.deptNm,         // 부서명
                        syDept.parentDeptId,   // 상위부서ID
                        syDept.deptTypeCd,     // 부서유형 — DEPT_TYPE {HQ: '본사', DEV: '개발팀', DEV_BACKEND: '백엔드', DEV_FRONTEND: '프론트엔드', MKT: '마케팅팀', LOGIS: '물류팀'}
                        syDept.managerId,      // 부서장 (sy_user.user_id)
                        syDept.sortOrd,        // 정렬순서
                        syDept.useYn,          // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syDept.deptRemark,     // 비고
                        syDept.regBy,          // 등록자
                        syDept.regDate,        // 등록일시
                        syDept.updBy,          // 수정자
                        syDept.updDate        // 수정일시
                ))
                .from(syDept)
                .leftJoin(syUser).on(syUser.userId.eq(syDept.managerId))
                .leftJoin(cdDt).on(cdDt.codeGrp.eq("DEPT_TYPE_CD").and(cdDt.codeValue.eq(syDept.deptTypeCd)));
    }

    /* 부서 키조회 */
    @Override
    public Optional<SyDeptDto.Item> selectById(String deptId) {
        SyDeptDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syDept.deptId.eq(deptId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 부서 목록조회 */
    @Override
    public List<SyDeptDto.Item> selectList(SyDeptDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = syDept.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = syDept.updDate;
        }
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        JPAQuery<SyDeptDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andParentDeptIdIn(search),
                QdslUtil.strEq(syDept.deptTypeCd, search.getTypeCd()),
                QdslUtil.strEq(syDept.useYn, search.getUseYn()),
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

    /* 부서 페이지조회 */
    @Override
    public BasePage<SyDeptDto.Item> selectPageData(SyDeptDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = syDept.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = syDept.updDate;
        }
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                andParentDeptIdIn(search),
                QdslUtil.strEq(syDept.deptTypeCd, search.getTypeCd()),
                QdslUtil.strEq(syDept.useYn, search.getUseYn()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyDeptDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyDeptDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syDept.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyDeptDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    /* 부서 트리 — 선택 노드 + 모든 자손 부서 포함 (자기참조 재귀 CTE) */
    private BooleanExpression andParentDeptIdIn(SyDeptDto.Request search) {
        return search != null && StringUtils.hasText(search.getParentDeptId())
                ? syDept.deptId.in(syDeptRepository.findTreeDeptIds(search.getParentDeptId()))
                : null;
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("deptCode", syDept.deptCode),
            QdslUtil.FieldDef.like("deptId", syDept.deptId),
            QdslUtil.FieldDef.like("deptNm", syDept.deptNm),
            QdslUtil.FieldDef.like("deptRemark", syDept.deptRemark),
            QdslUtil.FieldDef.like("deptTypeCd", syDept.deptTypeCd),
            QdslUtil.FieldDef.like("managerId", syDept.managerId),
            QdslUtil.FieldDef.like("parentDeptId", syDept.parentDeptId),
            QdslUtil.FieldDef.like("useYn", syDept.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("deptId", syDept.deptId,
                   "deptNm", syDept.deptNm,
                   "regDate", syDept.regDate,
                   "sortOrd", syDept.sortOrd),
        new OrderSpecifier<>(Order.ASC, syDept.sortOrd),
        new OrderSpecifier<>(Order.ASC, syDept.regDate),
        new OrderSpecifier<>(Order.ASC, syDept.deptId));
    }

    /* 부서 수정 */
    @Override
    public int updateSelective(SyDept entity) {
        if (entity.getDeptId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syDept);
        boolean hasAny = false;

        if (entity.getDeptCode()     != null) { update.set(syDept.deptCode,     entity.getDeptCode());     hasAny = true; }
        if (entity.getDeptNm()       != null) { update.set(syDept.deptNm,       entity.getDeptNm());       hasAny = true; }
        if (entity.getParentDeptId() != null) { update.set(syDept.parentDeptId, entity.getParentDeptId()); hasAny = true; }
        if (entity.getDeptTypeCd()   != null) { update.set(syDept.deptTypeCd,   entity.getDeptTypeCd());   hasAny = true; }
        if (entity.getManagerId()    != null) { update.set(syDept.managerId,    entity.getManagerId());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(syDept.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(syDept.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getDeptRemark()   != null) { update.set(syDept.deptRemark,   entity.getDeptRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syDept.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syDept.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syDept.deptId.eq(entity.getDeptId())).execute();
        return (int) affected;
    }
}
