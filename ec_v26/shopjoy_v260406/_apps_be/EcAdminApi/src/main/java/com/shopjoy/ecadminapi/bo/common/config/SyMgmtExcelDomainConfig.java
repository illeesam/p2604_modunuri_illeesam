package com.shopjoy.ecadminapi.bo.common.config;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.repository.SyAlarmRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbmRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbsRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyContactRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyTemplateRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAlarmService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBbmService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBbsService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyContactService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSySiteService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyTemplateService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyVendorService;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 엑셀 다운로드 도메인 등록소 — 시스템(sy) 관리 화면 전용.
 *
 * <p>{@link ExcelDomainConfig} 는 이력조회(syh_*) 8종을 등록한 파일이고, 이 파일은
 * 시스템 관리 화면(SyAlarmMng/SyBbmMng/SyBbsMng/SyContactMng/SySiteMng/SyTemplateMng/
 * SyUserMng/SyVendorMng) 8종을 등록한다. 별도 파일로 분리한 이유는 병행 작업 시 같은
 * 파일을 동시에 수정해 생기는 충돌을 피하기 위함이다 — 등록 방식/스케줄러 동작은 동일하다.</p>
 *
 * <p>목록/페이지 조회는 각 화면의 BO Controller 가 그대로 호출하는
 * {@code Bo{Domain}Service#getList / #getPageData} 를 재사용한다 — 화면에 뜨는 데이터와
 * 엑셀로 내려받는 데이터의 검색조건·정렬·JOIN 이 항상 같은 소스라는 뜻이다(별도 SQL 없음).</p>
 */
@Configuration
public class SyMgmtExcelDomainConfig {

    /* ── 시스템 > 알림 관리 ────────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyAlarm, SyAlarmDto.Item, SyAlarmDto.Request>
    syAlarmExcelHandler(BoSyAlarmService svc, SyAlarmRepository r, EntityManager em) {
        return PagedExcelHandler.of("syAlarm", "시스템 알림",
            SyAlarm.class, SyAlarmDto.Item.class, SyAlarmDto.Request.class,
            r, svc::getList, svc::getPageData, "alarmId", em);
    }

    /* ── 시스템 > 게시판 모드 관리 ─────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyBbm, SyBbmDto.Item, SyBbmDto.Request>
    syBbmExcelHandler(BoSyBbmService svc, SyBbmRepository r, EntityManager em) {
        return PagedExcelHandler.of("syBbm", "게시판 모드",
            SyBbm.class, SyBbmDto.Item.class, SyBbmDto.Request.class,
            r, svc::getList, svc::getPageData, "bbmId", em);
    }

    /* ── 시스템 > 게시판 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyBbs, SyBbsDto.Item, SyBbsDto.Request>
    syBbsExcelHandler(BoSyBbsService svc, SyBbsRepository r, EntityManager em) {
        return PagedExcelHandler.of("syBbs", "게시글",
            SyBbs.class, SyBbsDto.Item.class, SyBbsDto.Request.class,
            r, svc::getList, svc::getPageData, "bbsId", em);
    }

    /* ── 시스템 > 문의 관리 ────────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyContact, SyContactDto.Item, SyContactDto.Request>
    syContactExcelHandler(BoSyContactService svc, SyContactRepository r, EntityManager em) {
        return PagedExcelHandler.of("syContact", "문의",
            SyContact.class, SyContactDto.Item.class, SyContactDto.Request.class,
            r, svc::getList, svc::getPageData, "contactId", em);
    }

    /* ── 시스템 > 사이트 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SySite, SySiteDto.Item, SySiteDto.Request>
    sySiteExcelHandler(BoSySiteService svc, SySiteRepository r, EntityManager em) {
        return PagedExcelHandler.of("sySite", "사이트",
            SySite.class, SySiteDto.Item.class, SySiteDto.Request.class,
            r, svc::getList, svc::getPageData, "siteId", em);
    }

    /* ── 시스템 > 템플릿 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyTemplate, SyTemplateDto.Item, SyTemplateDto.Request>
    syTemplateExcelHandler(BoSyTemplateService svc, SyTemplateRepository r, EntityManager em) {
        return PagedExcelHandler.of("syTemplate", "템플릿",
            SyTemplate.class, SyTemplateDto.Item.class, SyTemplateDto.Request.class,
            r, svc::getList, svc::getPageData, "templateId", em);
    }

    /* ── 시스템 > 사용자 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyUser, SyUserDto.Item, SyUserDto.Request>
    syUserExcelHandler(BoSyUserService svc, SyUserRepository r, EntityManager em) {
        return PagedExcelHandler.of("syUser", "시스템 사용자",
            SyUser.class, SyUserDto.Item.class, SyUserDto.Request.class,
            r, svc::getList, svc::getPageData, "userId", em);
    }

    /* ── 시스템 > 업체 관리 ────────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyVendor, SyVendorDto.Item, SyVendorDto.Request>
    syVendorExcelHandler(BoSyVendorService svc, SyVendorRepository r, EntityManager em) {
        return PagedExcelHandler.of("syVendor", "업체",
            SyVendor.class, SyVendorDto.Item.class, SyVendorDto.Request.class,
            r, svc::getList, svc::getPageData, "vendorId", em);
    }
}
