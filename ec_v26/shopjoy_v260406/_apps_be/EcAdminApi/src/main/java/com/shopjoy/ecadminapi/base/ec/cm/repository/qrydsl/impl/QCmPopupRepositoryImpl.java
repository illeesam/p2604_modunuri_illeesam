package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPopupDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmPopup;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmPopupRepository;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/** CmPopup QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmPopupRepositoryImpl implements QCmPopupRepository {

    private final JPAQueryFactory queryFactory;

    /* ============================================================
     * 기본 정의 — Q타입 / 검색필드
     * ============================================================ */

    private static final String   QRY_SRC  = "base.ec.cm.repository.qrydsl.impl.QCmPopupRepositoryImpl";
    private static final QCmPopup cmPopup  = QCmPopup.cmPopup;

    /** 통합검색 대상 — 팝업명 / 팝업코드 / 대상 엔티티명 */

    /* ============================================================
     * 조회 메서드 — selectPageData
     * 검색조건은 .where(andXxx(...), ...) 형태로 직접 나열
     * ============================================================ */

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    @Override
    public BasePage<CmPopup> selectPageData(CmPopupDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmPopup.useYn, search.getUseYn()));
        whereList.add(andPopupPatternEq(search));
        whereList.add(/* searchType 을 주지 않으면 SEARCH_FIELDS 전체 OR — 팝업명/코드/엔티티명 통합검색 */
            andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        List<CmPopup> content = queryFactory.selectFrom(cmPopup)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(buildOrder())
                .offset((long) (pageNo - 1) * pageSize).limit(pageSize)
                .fetch();

        Long total = queryFactory.select(cmPopup.count()).from(cmPopup)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .where(wheres)
                .fetchOne();

        BasePage<CmPopup> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /** 팝업 패턴 (1 조회+목록 / 2 트리+목록 / 3 트리+목록+선택목록) */
    private BooleanExpression andPopupPatternEq(CmPopupDto.Request search) {
        return search.getPopupPattern() == null ? null : cmPopup.popupPattern.eq(search.getPopupPattern());
    }

    /* ============================================================
     * 정렬조건
     * ============================================================ */

    /** 팝업관리는 화면 정렬 요구가 없어 고정 정렬 — 표시순서 → 코드 */
    private OrderSpecifier<?>[] buildOrder() {
        return new OrderSpecifier<?>[] { cmPopup.sortOrd.asc(), cmPopup.popupCode.asc() };
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("popupNm",   cmPopup.popupNm),
            QdslUtil.FieldDef.like("popupCode", cmPopup.popupCode),
            QdslUtil.FieldDef.like("entityNm",  cmPopup.entityNm)
        ));
    }

}
