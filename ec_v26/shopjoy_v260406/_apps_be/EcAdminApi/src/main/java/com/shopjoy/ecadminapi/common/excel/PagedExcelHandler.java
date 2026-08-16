package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.persistence.EntityManager;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.function.Function;

/**
 * 도메인마다 클래스를 만들지 않고 <b>설정 한 줄</b>로 엑셀 도메인을 등록하기 위한 팩토리.
 *
 * <p>BO 화면이 100개를 넘어가면 "도메인 = 클래스 1개" 규칙은 파일 수가 감당이 안 된다.
 * 이 팩토리를 쓰면 {@link com.shopjoy.ecadminapi.bo.common.config.ExcelDomainConfig} 한 파일에
 * {@code @Bean} 을 계속 추가하는 형태가 되어 목록을 한눈에 보고 관리할 수 있다.</p>
 *
 * <pre>
 * &#064;Bean ExcelDomainHandler&lt;?,?,?&gt; memberLoginLogExcel(MbhMemberLoginLogRepository r, EntityManager em) {
 *     return PagedExcelHandler.of("memberLoginLog", "회원 로그인 로그",
 *         MbhMemberLoginLog.class, MbhMemberLoginLogDto.Item.class, MbhMemberLoginLogDto.Request.class,
 *         r, r::selectList, r::selectPageData, "logId", em);
 * }
 * </pre>
 *
 * <p>스케줄러는 리플렉션으로 메서드를 찾지 않는다. Spring 이 모든 {@link ExcelDomainHandler} 빈을
 * 모아 {@link ExcelDomainRegistry} 에 key 로 담아두고, 예약 행의 {@code domain_cd} 로 조회할 뿐이다.
 * 검색조건은 요청 시점에 JSON 으로 저장해 두었다가 {@link ExcelDomainHandler#reqClass()} 로
 * 타입을 복원하므로, 스케줄러가 원래 HTTP 요청을 몰라도 그대로 재현된다.</p>
 */
public final class PagedExcelHandler {

    private PagedExcelHandler() { }

    /**
     * 페이지 조회 기반 도메인 등록.
     *
     * @param key          도메인 키 (URL path + sy_exceldown.domain_cd)
     * @param label        사용자에게 보일 한글명 (파일명/알림 문구에 쓰임)
     * @param entityClass  Entity 클래스
     * @param itemClass    Dto.Item 클래스
     * @param reqClass     Dto.Request 클래스 (기본 생성자 필요)
     * @param repository   JpaRepository (upsert/존재체크 위임용)
     * @param listFn       목록 조회 함수 — 보통 {@code repo::selectList}
     * @param pageFn       페이지 조회 함수 — 전체 건수 산출용. {@code repo::selectPageData}
     * @param pkFieldName  정렬 기준 PK 필드명(camelCase). 예: "logId"
     * @param em           청크 사이 영속성 컨텍스트 정리용
     */
    public static <E, I, Q extends BaseRequest> ExcelDomainHandler<E, I, Q> of(
            String key,
            String label,
            Class<E> entityClass,
            Class<I> itemClass,
            Class<Q> reqClass,
            JpaRepository<E, String> repository,
            Function<Q, List<I>> listFn,
            Function<Q, BasePage<I>> pageFn,
            String pkFieldName,
            EntityManager em) {

        return new AbstractPagedExcelHandler<E, I, Q>() {
            @Override public String key()                          { return key; }
            @Override public String label()                        { return label; }
            @Override public Class<E> entityClass()                { return entityClass; }
            @Override public Class<I> itemClass()                  { return itemClass; }
            @Override public Class<Q> reqClass()                   { return reqClass; }
            @Override public JpaRepository<E, String> repository() { return repository; }

            @Override protected List<I> selectList(Q req)          { return listFn.apply(req); }
            @Override protected BasePage<I> selectPageData(Q req)  { return pageFn.apply(req); }
            @Override protected String pkFieldName()               { return pkFieldName; }
            @Override protected EntityManager entityManager()      { return em; }
        };
    }
}
