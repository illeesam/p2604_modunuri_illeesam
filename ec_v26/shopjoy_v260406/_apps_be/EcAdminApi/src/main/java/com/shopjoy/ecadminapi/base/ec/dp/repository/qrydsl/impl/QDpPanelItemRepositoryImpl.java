package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpPanelItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QDpPanelItemRepositoryImpl implements QDpPanelItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.dp.repository.qrydsl.impl.QDpPanelItemRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QDpPanelItem dpPanelItem = QDpPanelItem.dpPanelItem;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN / TITLE_SHOW_YN / WIDGET_LIB_REF_YN / DISP_YN  {Y: '예', N: '아니오'}
     * WIDGET_TYPE_CD (코드그룹: DISP_WIDGET_TYPE, 27종)
     *   {image_banner: '이미지배너', product_slider: '상품슬라이더', product: '상품', cond_product: '조건부상품',
     *    chart_bar: '막대차트', chart_line: '라인차트', chart_pie: '파이차트', text_banner: '텍스트배너',
     *    info_card: '정보카드', popup: '팝업', file: '파일', file_list: '파일목록', coupon: '쿠폰',
     *    html_editor: 'HTML에디터', textarea: '텍스트영역', markdown: '마크다운', barcode: '바코드',
     *    qrcode: 'QR코드', barcode_qrcode: '바코드+QR코드', video_player: '동영상플레이어', countdown: '카운트다운',
     *    payment_widget: '결제위젯', approval_widget: '승인위젯', event_banner: '이벤트배너', cache_banner: '캐시배너',
     *    widget_embed: '위젯임베드', map_widget: '지도위젯'}
     * CONTENT_TYPE_CD  {WIDGET: '위젯', HTML: 'HTML', TEXT: '텍스트', IMAGE: '이미지'}
     * VISIBILITY_TARGETS — VISIBILITY_TARGET 코드 ^CODE^CODE^ 형식 (예: ^PUBLIC^MEMBER^VIP^)
     * DISP_ENV — 전시 환경 ^CODE^CODE^ 형식 (예: ^PROD^DEV^TEST^)
     */
    private JPAQuery<DpPanelItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(DpPanelItemDto.Item.class,
                        dpPanelItem.panelItemId,       // 패널항목ID (PK, YYMMDDhhmmss+rand4)
                        dpPanelItem.panelId,           // 패널ID (dp_panel.panel_id, FK)
                        dpPanelItem.widgetLibId,       // 위젯라이브러리ID (dp_widget_lib.widget_lib_id, 선택사항)
                        dpPanelItem.widgetTypeCd,      // 위젯유형 — WIDGET_TYPE_CD (코드: WIDGET_TYPE_CD, 27종)
                        dpPanelItem.widgetTitle,       // 위젯타이틀
                        dpPanelItem.widgetContent,     // 위젯내용 (HTML 에디터)
                        dpPanelItem.titleShowYn,       // 타이틀표시여부 — TITLE_SHOW_YN {Y: '예', N: '아니오'}
                        dpPanelItem.widgetLibRefYn,    // 위젯라이브러리참조여부 — WIDGET_LIB_REF_YN {Y: '예', N: '아니오'}
                        dpPanelItem.contentTypeCd,     // 콘텐츠유형 — CONTENT_TYPE_CD {WIDGET: '위젯', HTML: 'HTML', TEXT: '텍스트', IMAGE: '이미지'}
                        dpPanelItem.sortOrd,           // 항목정렬순서
                        dpPanelItem.widgetConfigJson,  // 위젯설정 (JSON - 위젯별 특정 설정 또는 직접 생성 콘텐츠)
                        dpPanelItem.visibilityTargets, // 공개대상 — VISIBILITY_TARGET (^CODE^CODE^ 형식)
                        dpPanelItem.dispYn,            // 전시여부 — DISP_YN {Y: '예', N: '아니오'} (배치로 자동 관리)
                        dpPanelItem.dispStartDt,       // 전시시작일시
                        dpPanelItem.dispEndDt,         // 전시종료일시
                        dpPanelItem.dispEnv,           // 전시 환경 (^PROD^DEV^TEST^ 형식)
                        dpPanelItem.useYn,             // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        dpPanelItem.regBy,             // 등록자
                        dpPanelItem.regDate,           // 등록일시
                        dpPanelItem.updBy,             // 수정자
                        dpPanelItem.updDate,            // 수정일시
                        dpPanelItem.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        dpPanelItem.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(dpPanelItem)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(dpPanelItem.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(dpPanelItem.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(dpPanelItem.siteId)) // 사이트

                ;
    }

    /* 전시 패널 아이템 키조회 */
    @Override
    public Optional<DpPanelItemDto.Item> selectById(String panelItemId) {
        DpPanelItemDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(dpPanelItem.panelItemId.eq(panelItemId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 전시 패널 아이템 목록조회 */
    @Override
    public List<DpPanelItemDto.Item> selectList(DpPanelItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(dpPanelItem.panelId, search.getPanelIds()));
        whereList.add(QdslUtil.strEq(dpPanelItem.panelItemId, search.getPanelItemId()));
        whereList.add(QdslUtil.strEq(dpPanelItem.widgetTypeCd, search.getWidgetTypeCd()));
        whereList.add(QdslUtil.strEq(dpPanelItem.widgetLibId, search.getWidgetLibId()));
        whereList.add(QdslUtil.strEq(dpPanelItem.panelId, search.getPanelId()));
        whereList.add(QdslUtil.strEq(dpPanelItem.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(dpPanelItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(dpPanelItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(dpPanelItem.siteId, search.getSiteId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<DpPanelItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<DpPanelItemDto.Item> list = query.fetch();
        return list;
    }

    /* 전시 패널 아이템 페이지조회 */
    @Override
    public BasePage<DpPanelItemDto.Item> selectPageData(DpPanelItemDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(dpPanelItem.panelId, search.getPanelIds()));
        whereList.add(QdslUtil.strEq(dpPanelItem.panelItemId, search.getPanelItemId()));
        whereList.add(QdslUtil.strEq(dpPanelItem.widgetTypeCd, search.getWidgetTypeCd()));
        whereList.add(QdslUtil.strEq(dpPanelItem.widgetLibId, search.getWidgetLibId()));
        whereList.add(QdslUtil.strEq(dpPanelItem.panelId, search.getPanelId()));
        whereList.add(QdslUtil.strEq(dpPanelItem.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(dpPanelItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(dpPanelItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(dpPanelItem.siteId, search.getSiteId()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        JPAQuery<DpPanelItemDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<DpPanelItemDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(dpPanelItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<DpPanelItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("contentTypeCd", dpPanelItem.contentTypeCd),
            QdslUtil.FieldDef.like("dispEnv", dpPanelItem.dispEnv),
            QdslUtil.FieldDef.like("dispYn", dpPanelItem.dispYn),
            QdslUtil.FieldDef.like("panelId", dpPanelItem.panelId),
            QdslUtil.FieldDef.like("panelItemId", dpPanelItem.panelItemId),
            QdslUtil.FieldDef.like("titleShowYn", dpPanelItem.titleShowYn),
            QdslUtil.FieldDef.like("useYn", dpPanelItem.useYn),
            QdslUtil.FieldDef.like("visibilityTargets", dpPanelItem.visibilityTargets),
            QdslUtil.FieldDef.like("widgetConfigJson", dpPanelItem.widgetConfigJson),
            QdslUtil.FieldDef.like("widgetContent", dpPanelItem.widgetContent),
            QdslUtil.FieldDef.like("widgetLibId", dpPanelItem.widgetLibId),
            QdslUtil.FieldDef.like("widgetLibRefYn", dpPanelItem.widgetLibRefYn),
            QdslUtil.FieldDef.like("widgetTitle", dpPanelItem.widgetTitle),
            QdslUtil.FieldDef.like("widgetTypeCd", dpPanelItem.widgetTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("panelItemId", dpPanelItem.panelItemId,
                   "widgetTitle", dpPanelItem.widgetTitle,
                   "regDate", dpPanelItem.regDate,
                   "sortOrd", dpPanelItem.sortOrd),
        new OrderSpecifier<>(Order.ASC, dpPanelItem.sortOrd),
        new OrderSpecifier<>(Order.ASC, dpPanelItem.regDate),
        new OrderSpecifier<>(Order.ASC, dpPanelItem.panelItemId));
    }

    /* 전시 패널 아이템 수정 */
    @Override
    public int updateSelective(DpPanelItem entity) {
        if (entity.getPanelItemId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(dpPanelItem);
        boolean hasAny = false;
        if (entity.getPanelId()           != null) { update.set(dpPanelItem.panelId,           entity.getPanelId());           hasAny = true; }
        if (entity.getWidgetLibId()       != null) { update.set(dpPanelItem.widgetLibId,       entity.getWidgetLibId());       hasAny = true; }
        if (entity.getWidgetTypeCd()      != null) { update.set(dpPanelItem.widgetTypeCd,      entity.getWidgetTypeCd());      hasAny = true; }
        if (entity.getWidgetTitle()       != null) { update.set(dpPanelItem.widgetTitle,       entity.getWidgetTitle());       hasAny = true; }
        if (entity.getWidgetContent()     != null) { update.set(dpPanelItem.widgetContent,     entity.getWidgetContent());     hasAny = true; }
        if (entity.getTitleShowYn()       != null) { update.set(dpPanelItem.titleShowYn,       entity.getTitleShowYn());       hasAny = true; }
        if (entity.getWidgetLibRefYn()    != null) { update.set(dpPanelItem.widgetLibRefYn,    entity.getWidgetLibRefYn());    hasAny = true; }
        if (entity.getContentTypeCd()     != null) { update.set(dpPanelItem.contentTypeCd,     entity.getContentTypeCd());     hasAny = true; }
        if (entity.getSortOrd()           != null) { update.set(dpPanelItem.sortOrd,           entity.getSortOrd());           hasAny = true; }
        if (entity.getWidgetConfigJson()  != null) { update.set(dpPanelItem.widgetConfigJson,  entity.getWidgetConfigJson());  hasAny = true; }
        if (entity.getVisibilityTargets() != null) { update.set(dpPanelItem.visibilityTargets, entity.getVisibilityTargets()); hasAny = true; }
        if (entity.getDispYn()            != null) { update.set(dpPanelItem.dispYn,            entity.getDispYn());            hasAny = true; }
        if (entity.getDispStartDt()       != null) { update.set(dpPanelItem.dispStartDt,       entity.getDispStartDt());       hasAny = true; }
        if (entity.getDispEndDt()         != null) { update.set(dpPanelItem.dispEndDt,         entity.getDispEndDt());         hasAny = true; }
        if (entity.getDispEnv()           != null) { update.set(dpPanelItem.dispEnv,           entity.getDispEnv());           hasAny = true; }
        if (entity.getUseYn()             != null) { update.set(dpPanelItem.useYn,             entity.getUseYn());             hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(dpPanelItem.updBy,             entity.getUpdBy());             hasAny = true; }
        update.set(dpPanelItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpPanelItem.panelItemId.eq(entity.getPanelItemId())).execute();
    }
}
