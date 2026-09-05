package com.shopjoy.ecBeBo.bo.common.config;

import com.shopjoy.ecBeBo.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecBeBo.base.ec.st.repository.StErpVoucherRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.StReconRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettleAdjRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettleCloseRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettleConfigRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettleEtcAdjRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettlePayRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettleRawRepository;
import com.shopjoy.ecBeBo.bo.ec.st.service.BoStErpService;
import com.shopjoy.ecBeBo.bo.ec.st.service.BoStReconService;
import com.shopjoy.ecBeBo.bo.ec.st.service.BoStSettleAdjService;
import com.shopjoy.ecBeBo.bo.ec.st.service.BoStSettleCloseService;
import com.shopjoy.ecBeBo.bo.ec.st.service.BoStSettleConfigService;
import com.shopjoy.ecBeBo.bo.ec.st.service.BoStSettleEtcAdjService;
import com.shopjoy.ecBeBo.bo.ec.st.service.BoStSettlePayService;
import com.shopjoy.ecBeBo.bo.ec.st.service.BoStSettleRawService;
import com.shopjoy.ecBeBo.common.excel.ExcelDomainHandler;
import com.shopjoy.ecBeBo.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Excel download domain registry - settlement (st) screens only.
 *
 * No St-prefixed registry file existed before this one, unlike every other domain area
 * (sy, od, pd, dp, mb, cm). Registration style and scheduler wiring are identical to the
 * other files - one Bean per domain, all reusing the screen's own Bo-Domain-Service
 * getList/getPageData method so search filters and sorting always match the on-screen grid.
 *
 * The "stRecon" handler below is shared by five different frontend screens
 * (StReconClaimMng/StReconOrderMng/StReconPayMng/StReconVendorMng/StErpReconMng) - they all
 * read the same StRecon entity through the same service, differing only in a reconTypeCd
 * filter value each screen sends. One backend registration covers all five.
 *
 * StStatusMng and StErpViewMng are intentionally NOT registered here: StStatusMng's grid is a
 * client-side aggregate merged from several other domains' APIs (no single backing entity to
 * page through), and StErpViewMng's list is not wired to any backend endpoint yet. Forcing
 * either into this pattern would export data that does not match what the screen shows.
 */
@Configuration
public class StExcelDomainConfig {

    @Bean
    public ExcelDomainHandler<StSettleConfig, StSettleConfigDto.Item, StSettleConfigDto.Request>
    stSettleConfigExcelHandler(BoStSettleConfigService svc, StSettleConfigRepository r, EntityManager em) {
        return PagedExcelHandler.of("stSettleConfig", "정산기준",
            StSettleConfig.class, StSettleConfigDto.Item.class, StSettleConfigDto.Request.class,
            r, svc::getList, svc::getPageData, "settleConfigId", em);
    }

    @Bean
    public ExcelDomainHandler<StSettleRaw, StSettleRawDto.Item, StSettleRawDto.Request>
    stSettleRawExcelHandler(BoStSettleRawService svc, StSettleRawRepository r, EntityManager em) {
        return PagedExcelHandler.of("stSettleRaw", "정산원장",
            StSettleRaw.class, StSettleRawDto.Item.class, StSettleRawDto.Request.class,
            r, svc::getList, svc::getPageData, "settleRawId", em);
    }

    @Bean
    public ExcelDomainHandler<StSettleAdj, StSettleAdjDto.Item, StSettleAdjDto.Request>
    stSettleAdjExcelHandler(BoStSettleAdjService svc, StSettleAdjRepository r, EntityManager em) {
        return PagedExcelHandler.of("stSettleAdj", "정산조정",
            StSettleAdj.class, StSettleAdjDto.Item.class, StSettleAdjDto.Request.class,
            r, svc::getList, svc::getPageData, "settleAdjId", em);
    }

    @Bean
    public ExcelDomainHandler<StSettleClose, StSettleCloseDto.Item, StSettleCloseDto.Request>
    stSettleCloseExcelHandler(BoStSettleCloseService svc, StSettleCloseRepository r, EntityManager em) {
        return PagedExcelHandler.of("stSettleClose", "정산마감",
            StSettleClose.class, StSettleCloseDto.Item.class, StSettleCloseDto.Request.class,
            r, svc::getList, svc::getPageData, "settleCloseId", em);
    }

    @Bean
    public ExcelDomainHandler<StSettleEtcAdj, StSettleEtcAdjDto.Item, StSettleEtcAdjDto.Request>
    stSettleEtcAdjExcelHandler(BoStSettleEtcAdjService svc, StSettleEtcAdjRepository r, EntityManager em) {
        return PagedExcelHandler.of("stSettleEtcAdj", "기타조정",
            StSettleEtcAdj.class, StSettleEtcAdjDto.Item.class, StSettleEtcAdjDto.Request.class,
            r, svc::getList, svc::getPageData, "settleEtcAdjId", em);
    }

    @Bean
    public ExcelDomainHandler<StSettlePay, StSettlePayDto.Item, StSettlePayDto.Request>
    stSettlePayExcelHandler(BoStSettlePayService svc, StSettlePayRepository r, EntityManager em) {
        return PagedExcelHandler.of("stSettlePay", "정산지급",
            StSettlePay.class, StSettlePayDto.Item.class, StSettlePayDto.Request.class,
            r, svc::getList, svc::getPageData, "settlePayId", em);
    }

    @Bean
    public ExcelDomainHandler<StErpVoucher, StErpVoucherDto.Item, StErpVoucherDto.Request>
    stErpVoucherExcelHandler(BoStErpService svc, StErpVoucherRepository r, EntityManager em) {
        return PagedExcelHandler.of("stErpVoucher", "ERP전표",
            StErpVoucher.class, StErpVoucherDto.Item.class, StErpVoucherDto.Request.class,
            r, svc::getList, svc::getPageData, "erpVoucherId", em);
    }

    @Bean
    public ExcelDomainHandler<StRecon, StReconDto.Item, StReconDto.Request>
    stReconExcelHandler(BoStReconService svc, StReconRepository r, EntityManager em) {
        return PagedExcelHandler.of("stRecon", "정산대사",
            StRecon.class, StReconDto.Item.class, StReconDto.Request.class,
            r, svc::getList, svc::getPageData, "reconId", em);
    }
}
