package com.shopjoy.ecBeBo.bo.common.config;

import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdCartRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdOrderItemRepository;
import com.shopjoy.ecBeBo.bo.ec.od.service.BoOdCartService;
import com.shopjoy.ecBeBo.bo.ec.od.service.BoOdOrderItemService;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecBeBo.base.ec.pd.repository.PdProdQnaRepository;
import com.shopjoy.ecBeBo.common.excel.ExcelDomainHandler;
import com.shopjoy.ecBeBo.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 엑셀 다운로드 도메인 등록소 — 주문/상품/채팅 도메인 중 <b>Bo서비스 enrich 가 실제로 필요한
 * 도메인만</b> 남아 있다.
 *
 * <p>2026-08-17: {@code r::selectList}/{@code r::selectPageData}(순수 repository 직접 호출,
 * enrich 없음)로만 등록되어 있던 11개(odClaim/odDliv/odOrder/pdProd/cmChatt/pdCategory/
 * pdCategoryProd/pdDlivTmplt/pdRestockNoti/pdReview/pdTag) 는 삭제했다 — {@code AutoExcelDomainScanner}
 * 가 부팅 후 classpath 스캔으로 완전히 동일한 등록(같은 리포지토리, 같은 domain key)을 자동으로
 * 만들어주기 때문에 손으로 유지할 이유가 없다. 남아있는 것들은 Bo서비스가 실제로 연관데이터를
 * enrich 하거나(odCart/odOrderItem) domain key 가 Entity 명과 안 맞아(pdQna ≠ pdProdQna) 자동탐색이
 * 대체할 수 없는 경우뿐이다 — 이 파일이 계속 존재하는 이유이기도 하다.
 *
 * <p>각 도메인은 화면(Mng)의 목록 API 가 그대로 쓰는 QueryDSL 페이지 조회
 * ({@code selectList}/{@code selectPageData}) 를 그대로 재사용한다 — 검색조건·필터가
 * 화면과 항상 같도록 보장하기 위함이며, 별도 SQL/JPQL 을 새로 만들지 않는다.</p>
 */
@Configuration
public class OdPdCmExcelDomainConfig {

    /* ── 주문관리 > 장바구니관리 (BoOdCartService.getList 가 상품/SKU 정보를 보강해 넘긴다) ── */

    @Bean
    public ExcelDomainHandler<OdCart, OdCartDto.Item, OdCartDto.Request>
    odCartExcelHandler(BoOdCartService svc, OdCartRepository r, EntityManager em) {
        return PagedExcelHandler.of("odCart", "장바구니",
            OdCart.class, OdCartDto.Item.class, OdCartDto.Request.class,
            r, svc::getList, svc::getPageData, "cartId", em);
    }

    /* ── 주문관리 > 주문항목관리 ──────────────────────────────── */

    @Bean
    public ExcelDomainHandler<OdOrderItem, OdOrderItemDto.Item, OdOrderItemDto.Request>
    odOrderItemExcelHandler(BoOdOrderItemService svc, OdOrderItemRepository r, EntityManager em) {
        return PagedExcelHandler.of("odOrderItem", "주문항목",
            OdOrderItem.class, OdOrderItemDto.Item.class, OdOrderItemDto.Request.class,
            r, svc::getList, svc::getPageData, "orderItemId", em);
    }

    /* ── 상품관리 > 상품문의관리 (domain key "pdQna" ≠ auto탐색 key "pdProdQna" — 프론트 호환 위해 유지) ── */

    @Bean
    public ExcelDomainHandler<PdProdQna, PdProdQnaDto.Item, PdProdQnaDto.Request>
    pdQnaExcelHandler(PdProdQnaRepository r, EntityManager em) {
        return PagedExcelHandler.of("pdQna", "상품문의",
            PdProdQna.class, PdProdQnaDto.Item.class, PdProdQnaDto.Request.class,
            r, r::selectList, r::selectPageData, "prodQnaId", em);
    }
}
