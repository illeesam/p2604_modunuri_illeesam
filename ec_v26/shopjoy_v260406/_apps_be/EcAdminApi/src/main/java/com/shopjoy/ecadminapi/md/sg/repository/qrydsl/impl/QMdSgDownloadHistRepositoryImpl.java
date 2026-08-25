package com.shopjoy.ecadminapi.md.sg.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgDownloadHistDto;
import com.shopjoy.ecadminapi.md.sg.data.entity.QMdSgDownloadHist;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgDownloadHistRepository;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** MdSgDownloadHist(소스젠 다운로드이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdSgDownloadHistRepositoryImpl implements QMdSgDownloadHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.sg.repository.qrydsl.impl.QMdSgDownloadHistRepositoryImpl";
    private static final QMdSgDownloadHist mdSgDownloadHist = QMdSgDownloadHist.mdSgDownloadHist;
    private static final QMbMember memberEx = QMbMember.mbMember;

    private JPAQuery<MdSgDownloadHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MdSgDownloadHistDto.Item.class,
                        mdSgDownloadHist.downloadHistId,   // 다운로드이력ID (PK)
                        mdSgDownloadHist.projectId,        // 프로젝트ID
                        mdSgDownloadHist.projectNm,        // 프로젝트명 스냅샷
                        mdSgDownloadHist.basePackage,      // Base Package 스냅샷
                        mdSgDownloadHist.zipFileNm,        // ZIP 파일명 스냅샷
                        mdSgDownloadHist.ddlCount,         // DDL 탭 수
                        mdSgDownloadHist.fileCount,        // 생성 파일 수
                        mdSgDownloadHist.regBy, mdSgDownloadHist.regDate,
                        memberEx.memberNm.as("memberNm"),  // 다운로드한 회원명 (조인)
                        mdSgDownloadHist.siteId
                ))
                .from(mdSgDownloadHist)
                .leftJoin(memberEx).on(memberEx.memberId.eq(mdSgDownloadHist.regBy))
                ;
    }

    @Override
    public List<MdSgDownloadHistDto.Item> selectList(MdSgDownloadHistDto.Request search) {
        return baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(buildWheres(search))
                .orderBy(buildOrder(QdslUtil.sortOf(search)).toArray(OrderSpecifier[]::new))
                .fetch();
    }

    @Override
    public BasePage<MdSgDownloadHistDto.Item> selectPageData(MdSgDownloadHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        BooleanExpression[] wheres = buildWheres(search);
        OrderSpecifier<?>[] orders = buildOrder(QdslUtil.sortOf(search)).toArray(OrderSpecifier[]::new);

        JPAQuery<MdSgDownloadHistDto.Item> query = baseSelColumnQuery();
        List<MdSgDownloadHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres).orderBy(orders).offset(offset).limit(pageSize).fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mdSgDownloadHist.count()).where(wheres).fetchOne();

        BasePage<MdSgDownloadHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** buildWheres — selectList / selectPageData 공통 검색 조건 */
    private BooleanExpression[] buildWheres(MdSgDownloadHistDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdSgDownloadHist.siteId, search.getSiteId()));
        whereList.add(QdslUtil.strEq(mdSgDownloadHist.projectId, search.getProjectId()));
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdSgDownloadHist.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        return whereList.toArray(BooleanExpression[]::new);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("projectNm", mdSgDownloadHist.projectNm),
            QdslUtil.FieldDef.like("zipFileNm", mdSgDownloadHist.zipFileNm),
            QdslUtil.FieldDef.like("basePackage", mdSgDownloadHist.basePackage),
            QdslUtil.FieldDef.like("memberNm", memberEx.memberNm)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("regDate", mdSgDownloadHist.regDate,
                   "fileCount", mdSgDownloadHist.fileCount),
        new OrderSpecifier<>(Order.DESC, mdSgDownloadHist.regDate),
        new OrderSpecifier<>(Order.DESC, mdSgDownloadHist.downloadHistId));
    }
}
