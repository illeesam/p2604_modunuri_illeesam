package com.shopjoy.ecadminapi.bo.common.config;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmFaq;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmFaqRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.repository.SyNoticeRepository;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 엑셀 다운로드 도메인 등록소 — CM(고객센터) + 대시보드 화면 전용.
 *
 * <p>{@link ExcelDomainConfig} (이력조회 8종) 과 별도 파일로 분리한 이유: 서로 다른 화면군을
 * 다른 작업자가 동시에 손대도 파일 충돌이 나지 않도록 하기 위함이다. 등록 방식은 동일하게
 * {@link PagedExcelHandler#of} 팩토리를 사용한다.</p>
 *
 * <p>대시보드(DashboardBoEc01/02/03) 화면은 여기에 등록하지 않는다 — 대시보드의 엑셀 버튼은
 * {@code boApiSvc.cmDashboard.getData()} (POST, 월별 집계 차트 시리즈) 결과를 그대로 CSV 로
 * 내보내는 구조라 페이지 조회(pageNo/pageSize) 기반 목록이 아니다. {@link PagedExcelHandler} 는
 * PK 오름차순 페이징으로 원본 행을 청크 단위로 훑는 구조라 이런 사전 집계 데이터에는 맞지 않는다.</p>
 */
@Configuration
public class CmDashboardExcelDomainConfig {

    /* ── 고객센터 > FAQ관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<CmFaq, CmFaqDto.Item, CmFaqDto.Request>
    cmFaqExcelHandler(CmFaqRepository r, EntityManager em) {
        return PagedExcelHandler.of("cmFaq", "FAQ",
            CmFaq.class, CmFaqDto.Item.class, CmFaqDto.Request.class,
            r, r::selectList, r::selectPageData, "faqId", em);
    }

    /* ── 고객센터 > 공지사항관리 ──────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyNotice, SyNoticeDto.Item, SyNoticeDto.Request>
    cmNoticeExcelHandler(SyNoticeRepository r, EntityManager em) {
        return PagedExcelHandler.of("cmNotice", "공지사항",
            SyNotice.class, SyNoticeDto.Item.class, SyNoticeDto.Request.class,
            r, r::selectList, r::selectPageData, "noticeId", em);
    }
}
