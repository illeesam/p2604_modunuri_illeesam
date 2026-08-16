package com.shopjoy.ecadminapi.bo.common.config;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattRepository;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 엑셀 다운로드 도메인 등록소 — 주문/상품/채팅 도메인 전용.
 *
 * <p>{@link ExcelDomainConfig} 는 이력조회(sy/mb 로그) 도메인 전용으로 이미 쓰이고 있어,
 * 병행 작업 충돌을 피하려고 주문(od)/상품(pd)/채팅(cm) 도메인은 이 파일에 별도로 등록한다.
 * 등록 방식·스케줄러 연동 방식은 {@link ExcelDomainConfig} 와 완전히 동일하다.</p>
 *
 * <p>각 도메인은 화면(Mng)의 목록 API 가 그대로 쓰는 QueryDSL 페이지 조회
 * ({@code selectList}/{@code selectPageData}) 를 그대로 재사용한다 — 검색조건·필터가
 * 화면과 항상 같도록 보장하기 위함이며, 별도 SQL/JPQL 을 새로 만들지 않는다.</p>
 */
@Configuration
public class OdPdCmExcelDomainConfig {

    /* ── 주문관리 > 클레임관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<OdClaim, OdClaimDto.Item, OdClaimDto.Request>
    odClaimExcelHandler(OdClaimRepository r, EntityManager em) {
        return PagedExcelHandler.of("odClaim", "클레임관리",
            OdClaim.class, OdClaimDto.Item.class, OdClaimDto.Request.class,
            r, r::selectList, r::selectPageData, "claimId", em);
    }

    /* ── 주문관리 > 배송관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<OdDliv, OdDlivDto.Item, OdDlivDto.Request>
    odDlivExcelHandler(OdDlivRepository r, EntityManager em) {
        return PagedExcelHandler.of("odDliv", "배송관리",
            OdDliv.class, OdDlivDto.Item.class, OdDlivDto.Request.class,
            r, r::selectList, r::selectPageData, "dlivId", em);
    }

    /* ── 주문관리 > 주문관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<OdOrder, OdOrderDto.Item, OdOrderDto.Request>
    odOrderExcelHandler(OdOrderRepository r, EntityManager em) {
        return PagedExcelHandler.of("odOrder", "주문관리",
            OdOrder.class, OdOrderDto.Item.class, OdOrderDto.Request.class,
            r, r::selectList, r::selectPageData, "orderId", em);
    }

    /* ── 상품관리 > 상품관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<PdProd, PdProdDto.Item, PdProdDto.Request>
    pdProdExcelHandler(PdProdRepository r, EntityManager em) {
        return PagedExcelHandler.of("pdProd", "상품관리",
            PdProd.class, PdProdDto.Item.class, PdProdDto.Request.class,
            r, r::selectList, r::selectPageData, "prodId", em);
    }

    /* ── 고객센터 > 채팅관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<CmChatt, CmChattDto.Item, CmChattDto.Request>
    cmChattExcelHandler(CmChattRepository r, EntityManager em) {
        return PagedExcelHandler.of("cmChatt", "채팅관리",
            CmChatt.class, CmChattDto.Item.class, CmChattDto.Request.class,
            r, r::selectList, r::selectPageData, "chattId", em);
    }
}
