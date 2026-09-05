package com.shopjoy.ecBeBo.bo.common.config;

import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecBeBo.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecBeBo.base.ec.cm.repository.CmBlogRepository;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyNotice;
import com.shopjoy.ecBeBo.base.sy.repository.SyNoticeRepository;
import com.shopjoy.ecBeBo.bo.ec.cm.service.BoCmBlogService;
import com.shopjoy.ecBeBo.common.excel.ExcelDomainHandler;
import com.shopjoy.ecBeBo.common.excel.PagedExcelHandler;
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

    /* ── 고객센터 > 블로그관리 ──────────────────────────────── */

    @Bean
    public ExcelDomainHandler<CmBlog, CmBlogDto.Item, CmBlogDto.Request>
    cmBlogExcelHandler(BoCmBlogService svc, CmBlogRepository r, EntityManager em) {
        return PagedExcelHandler.of("cmBlog", "블로그",
            CmBlog.class, CmBlogDto.Item.class, CmBlogDto.Request.class,
            r, svc::getList, svc::getPageData, "blogId", em);
    }

    // 고객센터 > FAQ관리(cmFaq) 여기 등록하지 않는다: AutoExcelDomainScanner 가 CmFaqRepository 를
    // 부팅 후 classpath 스캔으로 자동 등록한다 — Bo서비스 enrich 없이 r::selectList 그대로였던
    // 등록이라 자동탐색 결과와 완전히 동일(2026-08-17 중복 제거).

    /* ── 고객센터 > 공지사항관리 ──────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyNotice, SyNoticeDto.Item, SyNoticeDto.Request>
    cmNoticeExcelHandler(SyNoticeRepository r, EntityManager em) {
        return PagedExcelHandler.of("cmNotice", "공지사항",
            SyNotice.class, SyNoticeDto.Item.class, SyNoticeDto.Request.class,
            r, r::selectList, r::selectPageData, "noticeId", em);
    }
}
