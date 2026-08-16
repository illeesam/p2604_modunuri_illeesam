package com.shopjoy.ecadminapi.bo.common.config;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCacheRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmPlanRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherRepository;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 프로모션(pm) 도메인 엑셀 다운로드 등록소 — 화면 하나 = {@code @Bean} 하나.
 *
 * <p>{@link ExcelDomainConfig} 와 동일한 패턴으로 {@link PagedExcelHandler#of} 팩토리를 사용한다.
 * pm 도메인은 각 화면의 목록(Mng) API 가 이미 QueryDSL 기반 {@code selectList}/{@code selectPageData}
 * 를 갖고 있어(예: {@code PmCacheRepository}), 새 SQL/JPQL 없이 그 메서드를 그대로 재사용한다 —
 * 화면 그리드와 동일한 검색조건으로 조회되므로 엑셀 결과가 항상 화면과 일치한다.</p>
 *
 * <p>다른 도메인(sy/mb 로그 등) 은 {@link ExcelDomainConfig} 에서 별도로 관리하며,
 * 병행 작업 충돌을 피하기 위해 pm 도메인은 이 파일에서만 등록한다.</p>
 */
@Configuration
public class PmExcelDomainConfig {

    /* ── 프로모션 > 캐시(충전금)관리 ──────────────────────────── */

    @Bean
    public ExcelDomainHandler<PmCache, PmCacheDto.Item, PmCacheDto.Request>
    pmCacheExcelHandler(PmCacheRepository r, EntityManager em) {
        return PagedExcelHandler.of("pmCache", "캐시",
            PmCache.class, PmCacheDto.Item.class, PmCacheDto.Request.class,
            r, r::selectList, r::selectPageData, "cacheId", em);
    }

    /* ── 프로모션 > 쿠폰관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<PmCoupon, PmCouponDto.Item, PmCouponDto.Request>
    pmCouponExcelHandler(PmCouponRepository r, EntityManager em) {
        return PagedExcelHandler.of("pmCoupon", "쿠폰",
            PmCoupon.class, PmCouponDto.Item.class, PmCouponDto.Request.class,
            r, r::selectList, r::selectPageData, "couponId", em);
    }

    /* ── 프로모션 > 할인관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<PmDiscnt, PmDiscntDto.Item, PmDiscntDto.Request>
    pmDiscntExcelHandler(PmDiscntRepository r, EntityManager em) {
        return PagedExcelHandler.of("pmDiscnt", "할인",
            PmDiscnt.class, PmDiscntDto.Item.class, PmDiscntDto.Request.class,
            r, r::selectList, r::selectPageData, "discntId", em);
    }

    /* ── 프로모션 > 이벤트관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<PmEvent, PmEventDto.Item, PmEventDto.Request>
    pmEventExcelHandler(PmEventRepository r, EntityManager em) {
        return PagedExcelHandler.of("pmEvent", "이벤트",
            PmEvent.class, PmEventDto.Item.class, PmEventDto.Request.class,
            r, r::selectList, r::selectPageData, "eventId", em);
    }

    /* ── 프로모션 > 사은품관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<PmGift, PmGiftDto.Item, PmGiftDto.Request>
    pmGiftExcelHandler(PmGiftRepository r, EntityManager em) {
        return PagedExcelHandler.of("pmGift", "사은품",
            PmGift.class, PmGiftDto.Item.class, PmGiftDto.Request.class,
            r, r::selectList, r::selectPageData, "giftId", em);
    }

    /* ── 프로모션 > 기획전관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<PmPlan, PmPlanDto.Item, PmPlanDto.Request>
    pmPlanExcelHandler(PmPlanRepository r, EntityManager em) {
        return PagedExcelHandler.of("pmPlan", "기획전",
            PmPlan.class, PmPlanDto.Item.class, PmPlanDto.Request.class,
            r, r::selectList, r::selectPageData, "planId", em);
    }

    /* ── 프로모션 > 적립금관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<PmSave, PmSaveDto.Item, PmSaveDto.Request>
    pmSaveExcelHandler(PmSaveRepository r, EntityManager em) {
        return PagedExcelHandler.of("pmSave", "적립금",
            PmSave.class, PmSaveDto.Item.class, PmSaveDto.Request.class,
            r, r::selectList, r::selectPageData, "saveId", em);
    }

    /* ── 프로모션 > 바우처관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<PmVoucher, PmVoucherDto.Item, PmVoucherDto.Request>
    pmVoucherExcelHandler(PmVoucherRepository r, EntityManager em) {
        return PagedExcelHandler.of("pmVoucher", "상품권",
            PmVoucher.class, PmVoucherDto.Item.class, PmVoucherDto.Request.class,
            r, r::selectList, r::selectPageData, "voucherId", em);
    }
}
