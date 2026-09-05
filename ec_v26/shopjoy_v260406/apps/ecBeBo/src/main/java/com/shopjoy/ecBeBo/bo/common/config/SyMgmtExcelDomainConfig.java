package com.shopjoy.ecadminapi.bo.common.config;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyExceldownDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyExceldown;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.repository.SyAlarmRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbmRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbsRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyBrandRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyContactRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyExceldownRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyMenuRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyTemplateRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRepository;
import com.shopjoy.ecadminapi.base.sy.service.SyExceldownService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAlarmService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAttachService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBatchService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBbmService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBbsService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyBrandService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyCodeService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyContactService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyDeptService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyI18nService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyMenuService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyPathService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyPropService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSySiteService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyTemplateService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyUserService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyVendorService;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyVendorUserService;
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

    // 빈 이름 주의: bo.sy.service.SyUserExcelHandler(@Component, domain key "user", 미사용 레거시)와
    // 이름이 겹치면 BeanDefinitionOverrideException 발생 → 메서드명만 syUserMgmtExcelHandler 로 구분
    // (도메인 키는 "syUser" 그대로 유지, 프론트 SyUserMng.js 변경 불필요)
    @Bean
    public ExcelDomainHandler<SyUser, SyUserDto.Item, SyUserDto.Request>
    syUserMgmtExcelHandler(BoSyUserService svc, SyUserRepository r, EntityManager em) {
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

    /* ── 시스템 > 엑셀다운로드 이력 ────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyExceldown, SyExceldownDto.Item, SyExceldownDto.Request>
    syExceldownExcelHandler(SyExceldownService svc, SyExceldownRepository r, EntityManager em) {
        return PagedExcelHandler.of("syExceldown", "엑셀다운로드 요청이력",
            SyExceldown.class, SyExceldownDto.Item.class, SyExceldownDto.Request.class,
            r, svc::getList, svc::getPageData, "exceldownId", em);
    }

    /* ── 시스템 > 역할 관리 ────────────────────────────────────── */

    // 여기 등록하지 않는다: bo.sy.service.SyRoleExcelHandler(@Component)가 이미 domain key "role"로
    // 등록되어 있다(Redis 역할캐시 무효화까지 포함된 더 완전한 구현). 예전에 여기에도 같은 key로
    // 중복 등록했다가 Spring 빈 이름 충돌(BeanDefinitionOverrideException)로 부팅 자체가
    // 실패했던 적이 있다(2026-08-17) — compileJava 는 이런 빈 충돌을 못 잡는다, 실제 부팅으로만
    // 확인 가능. 프론트 SyRoleMng.js 는 domain="role" 그대로 사용, 변경 불필요.

    /* ── 시스템 > 메뉴 관리 ────────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyMenu, SyMenuDto.Item, SyMenuDto.Request>
    syMenuExcelHandler(BoSyMenuService svc, SyMenuRepository r, EntityManager em) {
        return PagedExcelHandler.of("menu", "메뉴",
            SyMenu.class, SyMenuDto.Item.class, SyMenuDto.Request.class,
            r, svc::getList, svc::getPageData, "menuId", em);
    }

    /* ── 시스템 > 부서 관리 ────────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyDept, SyDeptDto.Item, SyDeptDto.Request>
    syDeptExcelHandler(BoSyDeptService svc, SyDeptRepository r, EntityManager em) {
        return PagedExcelHandler.of("dept", "부서",
            SyDept.class, SyDeptDto.Item.class, SyDeptDto.Request.class,
            r, svc::getList, svc::getPageData, "deptId", em);
    }

    /* ── 시스템 > 공통코드 관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyCode, SyCodeDto.Item, SyCodeDto.Request>
    syCodeMgmtExcelHandler(BoSyCodeService svc, SyCodeRepository r, EntityManager em) {
        return PagedExcelHandler.of("code", "공통코드",
            SyCode.class, SyCodeDto.Item.class, SyCodeDto.Request.class,
            r, svc::getList, svc::getPageData, "codeId", em);
    }

    /* ── 시스템 > 브랜드 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyBrand, SyBrandDto.Item, SyBrandDto.Request>
    syBrandExcelHandler(BoSyBrandService svc, SyBrandRepository r, EntityManager em) {
        return PagedExcelHandler.of("brand", "브랜드",
            SyBrand.class, SyBrandDto.Item.class, SyBrandDto.Request.class,
            r, svc::getList, svc::getPageData, "brandId", em);
    }

    /* ── 시스템 > 배치 관리 ────────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyBatch, SyBatchDto.Item, SyBatchDto.Request>
    syBatchExcelHandler(BoSyBatchService svc, SyBatchRepository r, EntityManager em) {
        return PagedExcelHandler.of("batch", "배치",
            SyBatch.class, SyBatchDto.Item.class, SyBatchDto.Request.class,
            r, svc::getList, svc::getPageData, "batchId", em);
    }

    /* ── 시스템 > 첨부파일 관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyAttach, SyAttachDto.Item, SyAttachDto.Request>
    syAttachExcelHandler(BoSyAttachService svc, SyAttachRepository r, EntityManager em) {
        return PagedExcelHandler.of("syAttach", "첨부파일",
            SyAttach.class, SyAttachDto.Item.class, SyAttachDto.Request.class,
            r, svc::getList, svc::getPageData, "attachId", em);
    }

    /* ── 시스템 > 다국어 관리 ──────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyI18n, SyI18nDto.Item, SyI18nDto.Request>
    syI18nExcelHandler(BoSyI18nService svc, SyI18nRepository r, EntityManager em) {
        return PagedExcelHandler.of("syI18n", "다국어",
            SyI18n.class, SyI18nDto.Item.class, SyI18nDto.Request.class,
            r, svc::getList, svc::getPageData, "i18nId", em);
    }

    /* ── 시스템 > 표시경로 관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyPath, SyPathDto.Item, SyPathDto.Request>
    syPathExcelHandler(BoSyPathService svc, SyPathRepository r, EntityManager em) {
        return PagedExcelHandler.of("syPath", "표시경로",
            SyPath.class, SyPathDto.Item.class, SyPathDto.Request.class,
            r, svc::getList, svc::getPageData, "pathId", em);
    }

    /* ── 시스템 > 프로퍼티 관리 ────────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyProp, SyPropDto.Item, SyPropDto.Request>
    syPropExcelHandler(BoSyPropService svc, SyPropRepository r, EntityManager em) {
        return PagedExcelHandler.of("syProp", "프로퍼티",
            SyProp.class, SyPropDto.Item.class, SyPropDto.Request.class,
            r, svc::getList, svc::getPageData, "propId", em);
    }

    /* ── 시스템 > 업체 사용자 관리 ─────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyVendorUser, SyVendorUserDto.Item, SyVendorUserDto.Request>
    syVendorUserExcelHandler(BoSyVendorUserService svc, SyVendorUserRepository r, EntityManager em) {
        return PagedExcelHandler.of("syVendorUser", "업체 사용자",
            SyVendorUser.class, SyVendorUserDto.Item.class, SyVendorUserDto.Request.class,
            r, svc::getList, svc::getPageData, "vendorUserId", em);
    }
}
