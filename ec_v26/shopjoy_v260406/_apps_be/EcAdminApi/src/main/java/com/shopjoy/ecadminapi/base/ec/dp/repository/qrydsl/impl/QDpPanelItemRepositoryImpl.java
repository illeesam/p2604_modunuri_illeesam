package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.QDpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl.QDpPanelItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

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
    private static final QDpPanelItem dpPanelItem = QDpPanelItem.dpPanelItem;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", dpPanelItem.regDate,
        "upd_date", dpPanelItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("contentTypeCd", dpPanelItem.contentTypeCd),
        Map.entry("dispEnv", dpPanelItem.dispEnv),
        Map.entry("dispYn", dpPanelItem.dispYn),
        Map.entry("panelId", dpPanelItem.panelId),
        Map.entry("panelItemId", dpPanelItem.panelItemId),
        Map.entry("siteId", dpPanelItem.siteId),
        Map.entry("titleShowYn", dpPanelItem.titleShowYn),
        Map.entry("useYn", dpPanelItem.useYn),
        Map.entry("visibilityTargets", dpPanelItem.visibilityTargets),
        Map.entry("widgetConfigJson", dpPanelItem.widgetConfigJson),
        Map.entry("widgetContent", dpPanelItem.widgetContent),
        Map.entry("widgetLibId", dpPanelItem.widgetLibId),
        Map.entry("widgetLibRefYn", dpPanelItem.widgetLibRefYn),
        Map.entry("widgetTitle", dpPanelItem.widgetTitle),
        Map.entry("widgetTypeCd", dpPanelItem.widgetTypeCd)
    );

    /*
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
                        dpPanelItem.widgetTypeCd,      // 위젯유형 — WIDGET_TYPE_CD (코드: DISP_WIDGET_TYPE, 27종)
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
                        dpPanelItem.updDate            // 수정일시
                ))
                .from(dpPanelItem);
    }

    /* 전시 패널 아이템 키조회 */
    @Override
    public Optional<DpPanelItemDto.Item> selectById(String panelItemId) {
        DpPanelItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(dpPanelItem.panelItemId.eq(panelItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 전시 패널 아이템 목록조회 */
    @Override
    public List<DpPanelItemDto.Item> selectList(DpPanelItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<DpPanelItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(dpPanelItem.panelId, search.getPanelIds()),
                    QdslUtil.strEq(dpPanelItem.panelItemId, search.getPanelItemId()),
                    QdslUtil.strEq(dpPanelItem.widgetTypeCd, search.getWidgetTypeCd()),
                    QdslUtil.strEq(dpPanelItem.widgetLibId, search.getWidgetLibId()),
                    QdslUtil.strEq(dpPanelItem.panelId, search.getPanelId()),
                    QdslUtil.strEq(dpPanelItem.useYn, search.getUseYn()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
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

    /* 전시 패널 아이템 페이지조회 */
    @Override
    public DpPanelItemDto.PageResponse selectPageData(DpPanelItemDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(dpPanelItem.panelId, search.getPanelIds()),
                QdslUtil.strEq(dpPanelItem.panelItemId, search.getPanelItemId()),
                QdslUtil.strEq(dpPanelItem.widgetTypeCd, search.getWidgetTypeCd()),
                QdslUtil.strEq(dpPanelItem.widgetLibId, search.getWidgetLibId()),
                QdslUtil.strEq(dpPanelItem.panelId, search.getPanelId()),
                QdslUtil.strEq(dpPanelItem.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };
        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<DpPanelItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<DpPanelItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(dpPanelItem.count())
                .where(wheres)
                .fetchOne();

        DpPanelItemDto.PageResponse res = new DpPanelItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(DpPanelItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(DpPanelItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.panelItemId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("panelItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpPanelItem.panelItemId));
                } else if ("widgetTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpPanelItem.widgetTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, dpPanelItem.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, dpPanelItem.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, dpPanelItem.panelItemId));
        }
        return orders;
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(dpPanelItem.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(dpPanelItem.panelItemId.eq(entity.getPanelItemId())).execute();
    }
}
