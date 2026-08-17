package com.shopjoy.ecadminapi.bo.common.config;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetLibRepository;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetRepository;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpAreaService;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpPanelService;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpUiService;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpWidgetLibService;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpWidgetService;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 엑셀 다운로드 도메인 등록소 — 전시관리(dp) 전용.
 *
 * <p>다른 도메인 등록 파일(ExcelDomainConfig/SyMgmtExcelDomainConfig/OdPdCmExcelDomainConfig)과
 * 병행 작업 충돌을 피하려고 전시관리(UI/영역/패널/위젯/위젯라이브러리) 5종은 이 파일에 별도로 등록한다.
 * 등록 방식·스케줄러 연동 방식은 다른 파일과 완전히 동일하다.</p>
 *
 * <p>각 도메인은 화면(Mng)의 목록 API 가 그대로 쓰는 {@code Bo{Domain}Service#getList/#getPageData}
 * 를 재사용한다 — 검색조건·정렬이 화면과 항상 같도록 보장하기 위함이며, 별도 SQL/JPQL 을 새로 만들지 않는다.</p>
 */
@Configuration
public class DpExcelDomainConfig {

    /* ── 전시관리 > UI 관리 ────────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<DpUi, DpUiDto.Item, DpUiDto.Request>
    dpUiExcelHandler(BoDpUiService svc, DpUiRepository r, EntityManager em) {
        return PagedExcelHandler.of("dpUi", "전시 UI",
            DpUi.class, DpUiDto.Item.class, DpUiDto.Request.class,
            r, svc::getList, svc::getPageData, "uiId", em);
    }

    /* ── 전시관리 > 영역 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<DpArea, DpAreaDto.Item, DpAreaDto.Request>
    dpAreaExcelHandler(BoDpAreaService svc, DpAreaRepository r, EntityManager em) {
        return PagedExcelHandler.of("dpArea", "전시 영역",
            DpArea.class, DpAreaDto.Item.class, DpAreaDto.Request.class,
            r, svc::getList, svc::getPageData, "areaId", em);
    }

    /* ── 전시관리 > 패널 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<DpPanel, DpPanelDto.Item, DpPanelDto.Request>
    dpPanelExcelHandler(BoDpPanelService svc, DpPanelRepository r, EntityManager em) {
        return PagedExcelHandler.of("dpPanel", "전시 패널",
            DpPanel.class, DpPanelDto.Item.class, DpPanelDto.Request.class,
            r, svc::getList, svc::getPageData, "panelId", em);
    }

    /* ── 전시관리 > 위젯 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<DpWidget, DpWidgetDto.Item, DpWidgetDto.Request>
    dpWidgetExcelHandler(BoDpWidgetService svc, DpWidgetRepository r, EntityManager em) {
        return PagedExcelHandler.of("dpWidget", "전시 위젯",
            DpWidget.class, DpWidgetDto.Item.class, DpWidgetDto.Request.class,
            r, svc::getList, svc::getPageData, "widgetId", em);
    }

    /* ── 전시관리 > 위젯라이브러리 관리 ────────────────────────── */

    @Bean
    public ExcelDomainHandler<DpWidgetLib, DpWidgetLibDto.Item, DpWidgetLibDto.Request>
    dpWidgetLibExcelHandler(BoDpWidgetLibService svc, DpWidgetLibRepository r, EntityManager em) {
        return PagedExcelHandler.of("dpWidgetLib", "위젯 라이브러리",
            DpWidgetLib.class, DpWidgetLibDto.Item.class, DpWidgetLibDto.Request.class,
            r, svc::getList, svc::getPageData, "widgetLibId", em);
    }
}
