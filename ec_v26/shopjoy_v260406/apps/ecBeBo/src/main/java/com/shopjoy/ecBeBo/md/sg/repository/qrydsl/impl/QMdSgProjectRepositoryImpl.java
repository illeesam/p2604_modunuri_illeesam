package com.shopjoy.ecBeBo.md.sg.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.jpa.JPAExpressions;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgProjectDto;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgProject;
import com.shopjoy.ecBeBo.md.sg.data.entity.QMdSgProject;
import com.shopjoy.ecBeBo.md.sg.data.entity.QMdSgSourcegenHist;
import com.shopjoy.ecBeBo.md.sg.repository.qrydsl.QMdSgProjectRepository;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;

/** MdSgProject(소스젠 프로젝트) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdSgProjectRepositoryImpl implements QMdSgProjectRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.sg.repository.qrydsl.impl.QMdSgProjectRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMdSgProject mdSgProject = QMdSgProject.mdSgProject;
    private static final QMbMember memberEx = QMbMember.mbMember;
    private static final QVwSyCode codeStatusCd = new QVwSyCode("cd_ps");
    private static final QVwSyCode codeDbTypeCd = new QVwSyCode("cd_db");
    private static final QMdSgSourcegenHist genHistEx = new QMdSgSourcegenHist("gen_hist_ex");

    private JPAQuery<MdSgProjectDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MdSgProjectDto.Item.class,
                        mdSgProject.projectId,          // 프로젝트ID (PK)
                        mdSgProject.memberId,           // 작성 회원ID
                        mdSgProject.projectNm,          // 프로젝트명
                        mdSgProject.projectDesc,        // 프로젝트 설명
                        mdSgProject.basePackage,        // Base Package
                        mdSgProject.dbTypeCd,           // DB 유형
                        codeDbTypeCd.codeLabel.as("dbTypeCdNm"),          // DB유형 코드라벨 (조인)
                        mdSgProject.ddlCount,           // DDL 탭 수
                        mdSgProject.lastGenDate,        // 마지막 생성 일시
                        mdSgProject.lastFileCount,      // 마지막 생성 파일 수
                        mdSgProject.thumbnailUrl,       // 대표이미지 URL
                        mdSgProject.thumbnailAttachId,  // 대표이미지 첨부ID
                        mdSgProject.projectStatusCd,    // 상태
                        codeStatusCd.codeLabel.as("projectStatusCdNm"),   // 상태 코드라벨 (조인)
                        mdSgProject.useYn,              // 사용여부
                        memberEx.memberNm.as("memberNm"),                 // 작성 회원명 (조인)
                        ExpressionUtils.as(              // 생성 이력 건수 — 목록에서 "몇 번 생성했나" 표시용
                            JPAExpressions.select(genHistEx.count())
                                .from(genHistEx)
                                .where(genHistEx.projectId.eq(mdSgProject.projectId)),
                            "genHistCount"),
                        mdSgProject.regBy, mdSgProject.regDate, mdSgProject.updBy, mdSgProject.updDate,
                        mdSgProject.regSiteId,
                        regSiteEx.siteNm.as("regSiteNm"),
                        regUserEx.userNm.as("regUserNm"),
                        mdSgProject.siteId,
                        siteEx.siteNm.as("siteNm")
                ))
                .from(mdSgProject)
                .leftJoin(codeStatusCd).on(codeStatusCd.codeGrp.eq("SG_PROJECT_STATUS_CD").and(codeStatusCd.codeValue.eq(mdSgProject.projectStatusCd)))
                .leftJoin(codeDbTypeCd).on(codeDbTypeCd.codeGrp.eq("SG_DB_TYPE_CD").and(codeDbTypeCd.codeValue.eq(mdSgProject.dbTypeCd)))
                .leftJoin(memberEx).on(memberEx.memberId.eq(mdSgProject.memberId))
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mdSgProject.regSiteId))
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mdSgProject.regBy))
                .leftJoin(siteEx).on(siteEx.siteId.eq(mdSgProject.siteId))
                ;
    }

    @Override
    public Optional<MdSgProjectDto.Item> selectById(String projectId) {
        MdSgProjectDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mdSgProject.projectId.eq(projectId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    @Override
    public List<MdSgProjectDto.Item> selectList(MdSgProjectDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = buildWheres(search);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MdSgProjectDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((pageNo - 1) * pageSize).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public BasePage<MdSgProjectDto.Item> selectPageData(MdSgProjectDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = buildWheres(search);

        JPAQuery<MdSgProjectDto.Item> query = baseSelColumnQuery();
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MdSgProjectDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres).orderBy(orders).offset(offset).limit(pageSize).fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mdSgProject.count()).where(wheres).fetchOne();

        BasePage<MdSgProjectDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** buildWheres — selectList / selectPageData 공통 검색 조건 */
    private BooleanExpression[] buildWheres(MdSgProjectDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdSgProject.projectId, search.getProjectId()));
        whereList.add(QdslUtil.strEq(mdSgProject.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(mdSgProject.dbTypeCd, search.getDbTypeCd()));
        whereList.add(QdslUtil.strEq(mdSgProject.projectStatusCd, search.getProjectStatusCd()));
        whereList.add(QdslUtil.strEq(mdSgProject.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdSgProject.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdSgProject.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mdSgProject.siteId, search.getSiteId()));
        return whereList.toArray(BooleanExpression[]::new);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("projectDesc", mdSgProject.projectDesc),
            QdslUtil.FieldDef.like("projectId", mdSgProject.projectId),
            QdslUtil.FieldDef.like("projectNm", mdSgProject.projectNm),
            QdslUtil.FieldDef.like("basePackage", mdSgProject.basePackage),
            QdslUtil.FieldDef.like("memberNm", memberEx.memberNm),     // 작성 회원명 (조인)
            QdslUtil.FieldDef.like("regUserNm", regUserEx.userNm)      // 등록자명 (조인, 관리자 대리등록 케이스)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("projectId", mdSgProject.projectId,
                   "projectNm", mdSgProject.projectNm,
                   "lastGenDate", mdSgProject.lastGenDate,
                   "regDate", mdSgProject.regDate),
        new OrderSpecifier<>(Order.DESC, mdSgProject.regDate),
        new OrderSpecifier<>(Order.ASC, mdSgProject.projectId));
    }

    @Override
    public int updateSelective(MdSgProject entity) {
        if (entity.getProjectId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mdSgProject);
        boolean hasAny = false;

        if (entity.getProjectNm()        != null) { update.set(mdSgProject.projectNm,        entity.getProjectNm());        hasAny = true; }
        if (entity.getProjectDesc()      != null) { update.set(mdSgProject.projectDesc,      entity.getProjectDesc());      hasAny = true; }
        if (entity.getBasePackage()      != null) { update.set(mdSgProject.basePackage,      entity.getBasePackage());      hasAny = true; }
        if (entity.getDbTypeCd()         != null) { update.set(mdSgProject.dbTypeCd,         entity.getDbTypeCd());         hasAny = true; }
        if (entity.getDdlCount()         != null) { update.set(mdSgProject.ddlCount,         entity.getDdlCount());         hasAny = true; }
        if (entity.getLastGenDate()      != null) { update.set(mdSgProject.lastGenDate,      entity.getLastGenDate());      hasAny = true; }
        if (entity.getLastFileCount()    != null) { update.set(mdSgProject.lastFileCount,    entity.getLastFileCount());    hasAny = true; }
        if (entity.getThumbnailUrl()     != null) { update.set(mdSgProject.thumbnailUrl,     entity.getThumbnailUrl());     hasAny = true; }
        if (entity.getThumbnailAttachId()!= null) { update.set(mdSgProject.thumbnailAttachId,entity.getThumbnailAttachId());hasAny = true; }
        if (entity.getProjectStatusCd()  != null) { update.set(mdSgProject.projectStatusCd,  entity.getProjectStatusCd());  hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(mdSgProject.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(mdSgProject.updBy,            entity.getUpdBy());            hasAny = true; }
        update.set(mdSgProject.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;
        long affected = update.where(mdSgProject.projectId.eq(entity.getProjectId())).execute();
        return (int) affected;
    }
}
