package com.shopjoy.ecadminapi.md.sg.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgSourcegenHistDto;
import com.shopjoy.ecadminapi.md.sg.data.entity.QMdSgSourcegenHist;
import com.shopjoy.ecadminapi.md.sg.data.entity.QMdSgProject;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgSourcegenHistRepository;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** MdSgSourcegenHist(소스젠 생성이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdSgSourcegenHistRepositoryImpl implements QMdSgSourcegenHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.sg.repository.qrydsl.impl.QMdSgSourcegenHistRepositoryImpl";
    private static final QMdSgSourcegenHist mdSgSourcegenHist = QMdSgSourcegenHist.mdSgSourcegenHist;
    private static final QMdSgProject projectEx = QMdSgProject.mdSgProject;
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QMbMember memberEx = QMbMember.mbMember;

    private JPAQuery<MdSgSourcegenHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MdSgSourcegenHistDto.Item.class,
                        mdSgSourcegenHist.sourcegenHistId,   // 생성이력ID (PK)
                        mdSgSourcegenHist.projectId,         // 소스젠ID
                        mdSgSourcegenHist.genDate,           // 생성 일시
                        mdSgSourcegenHist.ddlCount,          // 포함된 DDL 탭 수
                        mdSgSourcegenHist.fileCount,         // 생성된 파일 수
                        mdSgSourcegenHist.attachId,          // ZIP 첨부ID
                        mdSgSourcegenHist.zipFileNm,         // ZIP 파일명
                        mdSgSourcegenHist.zipFileSize,       // ZIP 크기
                        mdSgSourcegenHist.zipUrl,            // ZIP 다운로드 URL
                        mdSgSourcegenHist.genMemo,           // 생성 메모
                        mdSgSourcegenHist.useYn,             // 사용여부
                        projectEx.projectNm.as("projectNm"),      // 소스젠명 (조인)
                        projectEx.basePackage.as("basePackage"),  // Base Package (조인)
                        mdSgSourcegenHist.regBy, mdSgSourcegenHist.regDate,
                        regUserEx.userNm.as("regUserNm"),         // 등록자명 (조인)
                        memberEx.memberNm.as("memberNm")          // 작성 회원명 (조인)
                ))
                .from(mdSgSourcegenHist)
                .leftJoin(projectEx).on(projectEx.projectId.eq(mdSgSourcegenHist.projectId))
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mdSgSourcegenHist.regBy))
                .leftJoin(memberEx).on(memberEx.memberId.eq(mdSgSourcegenHist.regBy))
                ;
    }

    @Override
    public List<MdSgSourcegenHistDto.Item> selectList(MdSgSourcegenHistDto.Request search) {
        return baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(buildWheres(search))
                .orderBy(buildOrder(QdslUtil.sortOf(search)).toArray(OrderSpecifier[]::new))
                .fetch();
    }

    @Override
    public BasePage<MdSgSourcegenHistDto.Item> selectPageData(MdSgSourcegenHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        BooleanExpression[] wheres = buildWheres(search);
        OrderSpecifier<?>[] orders = buildOrder(QdslUtil.sortOf(search)).toArray(OrderSpecifier[]::new);

        JPAQuery<MdSgSourcegenHistDto.Item> query = baseSelColumnQuery();
        List<MdSgSourcegenHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres).orderBy(orders).offset(offset).limit(pageSize).fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mdSgSourcegenHist.count()).where(wheres).fetchOne();

        BasePage<MdSgSourcegenHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** buildWheres — selectList / selectPageData 공통 검색 조건 */
    private BooleanExpression[] buildWheres(MdSgSourcegenHistDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdSgSourcegenHist.projectId, search.getProjectId()));
        whereList.add(QdslUtil.strEq(mdSgSourcegenHist.useYn, search.getUseYn()));
        whereList.add(QdslUtil.strEq(mdSgSourcegenHist.siteId, search.getSiteId()));
        whereList.add("gen_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdSgSourcegenHist.genDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdSgSourcegenHist.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        return whereList.toArray(BooleanExpression[]::new);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("projectNm", projectEx.projectNm),          // 소스젠명 (조인)
            QdslUtil.FieldDef.like("zipFileNm", mdSgSourcegenHist.zipFileNm),  // ZIP 파일명
            QdslUtil.FieldDef.like("genMemo",   mdSgSourcegenHist.genMemo),    // 생성 메모
            QdslUtil.FieldDef.like("basePackage", projectEx.basePackage),      // Base Package (조인)
            QdslUtil.FieldDef.like("regUserNm", regUserEx.userNm),             // 등록자명 (조인)
            QdslUtil.FieldDef.like("memberNm",  memberEx.memberNm)             // 작성 회원명 (조인)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("genDate", mdSgSourcegenHist.genDate,
                   "fileCount", mdSgSourcegenHist.fileCount,
                   "regDate", mdSgSourcegenHist.regDate),
        new OrderSpecifier<>(Order.DESC, mdSgSourcegenHist.genDate),
        new OrderSpecifier<>(Order.DESC, mdSgSourcegenHist.sourcegenHistId));
    }
}
