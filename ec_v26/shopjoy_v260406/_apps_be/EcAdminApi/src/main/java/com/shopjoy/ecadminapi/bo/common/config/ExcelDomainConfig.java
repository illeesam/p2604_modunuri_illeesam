package com.shopjoy.ecadminapi.bo.common.config;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberLoginLogRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberTokenLogRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessErrorLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessErrorLogRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessLogRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserLoginLogRepository;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserTokenLogRepository;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.PagedExcelHandler;
import jakarta.persistence.EntityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 엑셀 다운로드 도메인 등록소 — 화면 하나 = {@code @Bean} 하나.
 *
 * <p>도메인마다 핸들러 클래스를 만들면 BO 화면 수(100+)만큼 파일이 생긴다.
 * 여기서는 {@link PagedExcelHandler#of} 팩토리로 한 덩어리씩 등록해 목록을 한 파일에서 관리한다.
 * 새 화면에 엑셀을 붙이려면 <b>이 파일에 {@code @Bean} 하나만 추가</b>하면 되고,
 * 스케줄러/컨트롤러/화면은 손대지 않는다.</p>
 *
 * <p>등록만 하면 {@code ExcelDomainRegistry} 가 기동 시 자동 수집하고,
 * {@code /api/bo/exceldown/{sync|async}/{key}} 로 즉시 사용 가능하다.
 * key 가 중복되면 컨텍스트 로딩 단계에서 실패해 조기에 발견된다.</p>
 *
 * <p>정렬 PK 를 넘기는 이유: 로그 테이블은 export 중에도 INSERT 가 계속된다.
 * 최신순 페이징이면 새 행이 앞에 끼어들어 뒤 페이지가 밀리면서 중복/누락이 생기므로
 * PK 오름차순으로 읽어야 한다({@code AbstractPagedExcelHandler} 참조).</p>
 */
@Configuration
public class ExcelDomainConfig {

    /* ── 이력조회 > 회원로그인이력 ────────────────────────────── */

    @Bean
    public ExcelDomainHandler<MbhMemberLoginLog, MbhMemberLoginLogDto.Item, MbhMemberLoginLogDto.Request>
    memberLoginLogExcelHandler(MbhMemberLoginLogRepository r, EntityManager em) {
        return PagedExcelHandler.of("memberLoginLog", "회원 로그인 로그",
            MbhMemberLoginLog.class, MbhMemberLoginLogDto.Item.class, MbhMemberLoginLogDto.Request.class,
            r, r::selectList, r::selectPageData, "logId", em);
    }

    @Bean
    public ExcelDomainHandler<MbhMemberTokenLog, MbhMemberTokenLogDto.Item, MbhMemberTokenLogDto.Request>
    memberTokenLogExcelHandler(MbhMemberTokenLogRepository r, EntityManager em) {
        return PagedExcelHandler.of("memberTokenLog", "회원 토큰 이력",
            MbhMemberTokenLog.class, MbhMemberTokenLogDto.Item.class, MbhMemberTokenLogDto.Request.class,
            r, r::selectList, r::selectPageData, "logId", em);
    }

    /* ── 이력조회 > 사용자로그인이력 ──────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyhUserLoginLog, SyhUserLoginLogDto.Item, SyhUserLoginLogDto.Request>
    userLoginLogExcelHandler(SyhUserLoginLogRepository r, EntityManager em) {
        return PagedExcelHandler.of("userLoginLog", "사용자 로그인 로그",
            SyhUserLoginLog.class, SyhUserLoginLogDto.Item.class, SyhUserLoginLogDto.Request.class,
            r, r::selectList, r::selectPageData, "logId", em);
    }

    @Bean
    public ExcelDomainHandler<SyhUserTokenLog, SyhUserTokenLogDto.Item, SyhUserTokenLogDto.Request>
    userTokenLogExcelHandler(SyhUserTokenLogRepository r, EntityManager em) {
        return PagedExcelHandler.of("userTokenLog", "사용자 토큰 이력",
            SyhUserTokenLog.class, SyhUserTokenLogDto.Item.class, SyhUserTokenLogDto.Request.class,
            r, r::selectList, r::selectPageData, "logId", em);
    }

    /* ── 이력조회 > API로그조회 ──────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyhAccessLog, SyhAccessLogDto.Item, SyhAccessLogDto.Request>
    accessLogExcelHandler(SyhAccessLogRepository r, EntityManager em) {
        return PagedExcelHandler.of("accessLog", "API 접근 로그",
            SyhAccessLog.class, SyhAccessLogDto.Item.class, SyhAccessLogDto.Request.class,
            r, r::selectList, r::selectPageData, "logId", em);
    }

    @Bean
    public ExcelDomainHandler<SyhAccessErrorLog, SyhAccessErrorLogDto.Item, SyhAccessErrorLogDto.Request>
    accessErrorLogExcelHandler(SyhAccessErrorLogRepository r, EntityManager em) {
        return PagedExcelHandler.of("accessErrorLog", "API 오류 로그",
            SyhAccessErrorLog.class, SyhAccessErrorLogDto.Item.class, SyhAccessErrorLogDto.Request.class,
            r, r::selectList, r::selectPageData, "logId", em);
    }

    /* ── 이력조회 > 메시지발송이력 ────────────────────────────── */

    @Bean
    public ExcelDomainHandler<SyhSendMsgLog, SyhSendMsgLogDto.Item, SyhSendMsgLogDto.Request>
    sendMsgLogExcelHandler(SyhSendMsgLogRepository r, EntityManager em) {
        return PagedExcelHandler.of("sendMsgLog", "메시지 발송이력",
            SyhSendMsgLog.class, SyhSendMsgLogDto.Item.class, SyhSendMsgLogDto.Request.class,
            r, r::selectList, r::selectPageData, "logId", em);
    }

    @Bean
    public ExcelDomainHandler<SyhSendEmailLog, SyhSendEmailLogDto.Item, SyhSendEmailLogDto.Request>
    sendEmailLogExcelHandler(SyhSendEmailLogRepository r, EntityManager em) {
        return PagedExcelHandler.of("sendEmailLog", "이메일 발송이력",
            SyhSendEmailLog.class, SyhSendEmailLogDto.Item.class, SyhSendEmailLogDto.Request.class,
            r, r::selectList, r::selectPageData, "logId", em);
    }
}
