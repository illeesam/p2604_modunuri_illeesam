package com.shopjoy.ecBeBo.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyDeptDto;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyDept;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyDept;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyDeptRepository;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
/** SyDept(부서) QueryDSL Custom 구현체 */
public class QSyDeptRepositoryImpl implements QSyDeptRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyDeptRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyDept syDept = QSyDept.syDept;

    public QSyDeptRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }
    private static final QSyUser syUser = QSyUser.syUser;
    private static final QVwSyCode codeDeptTypeCd = new QVwSyCode("cd_dt");    /*
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
                        codeDeptTypeCd.codeLabel.as("deptTypeCdNm"), // 코드 라벨
                        syDept.managerId,      // 부서장 (sy_user.user_id)
                        syDept.sortOrd,        // 정렬순서
                        syDept.useYn,          // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syDept.deptRemark,     // 비고
                        syDept.regBy,          // 등록자
                        syDept.regDate,        // 등록일시
                        syDept.updBy,          // 수정자
                        syDept.updDate,        // 수정일시
                        syDept.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syDept)
                .leftJoin(syUser).on(syUser.userId.eq(syDept.managerId)) // 사용자
                .leftJoin(codeDeptTypeCd).on(codeDeptTypeCd.codeGrp.eq("DEPT_TYPE_CD").and(codeDeptTypeCd.codeValue.eq(syDept.deptTypeCd))) // 부서유형
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syDept.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syDept.regBy)) // 등록자
                ;
    }

    /* 부서 키조회 */
    @Override
    public Optional<SyDeptDto.Item> selectById(String deptId) {
        SyDeptDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syDept.deptId.eq(deptId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 부서 목록조회 */
    @Override
    public List<SyDeptDto.Item> selectList(SyDeptDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andParentDeptIdIn(search));
        whereList.add(QdslUtil.strEq(syDept.deptTypeCd, search.getTypeCd())); // 부서유형 필터
        whereList.add(QdslUtil.strEq(syDept.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syDept.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syDept.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyDeptDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyDeptDto.Item> list = query.fetch();
        return list;
    }

    /* 부서 페이지조회 */
    @Override
    public BasePage<SyDeptDto.Item> selectPageData(SyDeptDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(andParentDeptIdIn(search));
        whereList.add(QdslUtil.strEq(syDept.deptTypeCd, search.getTypeCd())); // 부서유형 필터
        whereList.add(QdslUtil.strEq(syDept.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syDept.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syDept.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyDeptDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyDeptDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syDept.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyDeptDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* 부서 트리 — 선택 노드 + 모든 자손 부서 포함 (자기참조) */
    private BooleanExpression andParentDeptIdIn(SyDeptDto.Request search) {
        return search != null && StringUtils.hasText(search.getParentDeptId())
                // [QueryDSL] 부서 트리 자손ID 수집
                ? syDept.deptId.in(selectTreeDeptIds(search.getParentDeptId()))
                : null;
    }

    /** 루트 dept + 모든 자손 dept_id 수집 — 전체 (deptId, parentDeptId) 를 한 번에 읽어 자바에서 BFS */
    @Override
    public List<String> selectTreeDeptIds(String rootDeptId) {
        List<Tuple> rows = queryFactory.select(syDept.deptId, syDept.parentDeptId)
                .from(syDept)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectTreeDeptIds()")
                .fetch();

        Map<String, List<String>> childrenOf = new HashMap<>();
        for (Tuple row : rows) {
            String parentId = row.get(syDept.parentDeptId);
            if (parentId != null) {
                childrenOf.computeIfAbsent(parentId, k -> new ArrayList<>()).add(row.get(syDept.deptId));
            }
        }
        return QdslUtil.collectTreeIds(rootDeptId, childrenOf);
    }

    /* searchType 예: "deptCode,deptId,deptNm,deptRemark,deptTypeCd" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("deptCode", syDept.deptCode), // 부서코드
            QdslUtil.FieldDef.like("deptId", syDept.deptId), // 부서ID (YYMMDDhhmmss+rand4)
            QdslUtil.FieldDef.like("deptNm", syDept.deptNm), // 부서명
            QdslUtil.FieldDef.like("deptRemark", syDept.deptRemark), // 비고
            QdslUtil.FieldDef.like("deptTypeCd", syDept.deptTypeCd), // 부서유형 — DEPT_TYPE_CD
            QdslUtil.FieldDef.like("managerId", syDept.managerId), // 부서장 (sy_user.user_id)
            QdslUtil.FieldDef.like("parentDeptId", syDept.parentDeptId), // 상위부서ID 필터
            QdslUtil.FieldDef.like("useYn", syDept.useYn) // 사용여부 필터 Y/N
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
        update.set(syDept.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syDept.deptId.eq(entity.getDeptId())).execute();
        return (int) affected;
    }
}
