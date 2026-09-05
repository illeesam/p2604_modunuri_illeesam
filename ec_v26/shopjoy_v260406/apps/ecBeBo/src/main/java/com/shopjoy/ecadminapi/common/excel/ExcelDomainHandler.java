package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Map;
import java.util.function.Consumer;

/**
 * 엑셀 다운로드/업로드 도메인 핸들러.
 *
 * <p>각 도메인(사용자/역할/부서/...)은 이 인터페이스를 구현한 Spring Bean 하나만 제공하면
 * {@link com.shopjoy.ecadminapi.bo.common.controller.BoExcelController} 의 단일 진입점에서
 * 자동 라우팅된다. 새 도메인 추가 시 작성해야 할 백엔드 코드는 **이 Handler 한 클래스뿐**.
 *
 * <p><b>일반적인 구현 예시</b>:
 * <pre>
 * &#064;Component
 * &#064;RequiredArgsConstructor
 * public class SyUserExcelHandler implements ExcelDomainHandler&lt;SyUser, SyUserDto.Item, SyUserDto.Request&gt; {
 *     private final SyUserService syUserService;
 *     private final SyUserRepository syUserRepository;
 *
 *     public String key()               { return "user"; }
 *     public Class&lt;SyUser&gt; entityClass()        { return SyUser.class; }
 *     public Class&lt;SyUserDto.Item&gt; itemClass()  { return SyUserDto.Item.class; }
 *     public Class&lt;SyUserDto.Request&gt; reqClass(){ return SyUserDto.Request.class; }
 *     public JpaRepository&lt;SyUser, String&gt; repository() { return syUserRepository; }
 *     public long countList(SyUserDto.Request r){ return syUserService.countList(r); }
 *     public void fetchChunked(SyUserDto.Request r, int sz, Consumer&lt;SyUserDto.Item&gt; c) {
 *         syUserService.fetchChunked(r, sz, c);
 *     }
 * }
 * </pre>
 *
 * @param <E>   JPA Entity 클래스 (예: SyUser)
 * @param <I>   조회 결과 Dto.Item 클래스 (예: SyUserDto.Item) — JOIN 컬럼 포함 가능
 * @param <Q>   검색 Request 클래스 — BaseRequest 상속
 */
public interface ExcelDomainHandler<E, I, Q extends BaseRequest> {

    /** 도메인 식별 키 (URL path 변수와 매핑). 예: "user", "role", "dept" */
    String key();

    /** 사용자에게 보일 한글명. 미구현 시 key() 그대로 사용. */
    default String label() { return key(); }

    /** Entity 클래스 — Excel 메타 빌드 + upsert 시 newInstance() 대상 */
    Class<E> entityClass();

    /** Dto.Item 클래스 — 다운로드 데이터 타입 + Entity 와의 필드 교집합 추출용 */
    Class<I> itemClass();

    /** Request 클래스 — Spring @ModelAttribute 바인딩용. newInstance() 가능해야 함. */
    Class<Q> reqClass();

    /** JpaRepository — upsert/existsCheck 위임용 */
    JpaRepository<E, String> repository();

    /** 검색조건 기준 전체 카운트 — 대량 export 상한 검증용 */
    long countList(Q req);

    /**
     * 청크 단위 fetch — 메모리 안전한 대량 export 용.
     * 구현은 보통 {@code service.fetchChunked(req, chunkSize, consumer)} 위임.
     */
    void fetchChunked(Q req, int chunkSize, Consumer<I> consumer);

    /**
     * 추가 메타 override (선택). null 반환 시 {@link ExcelMetaBuilder#fromEntity(Class, Class)}
     * 가 자동 빌드. 특정 컬럼만 추가 제외하거나 라벨 변경 필요 시 override.
     */
    default ExcelMetaInfo meta() { return null; }

    /**
     * upsert 후 후처리 (선택). 캐시 무효화 등.
     * @param result upsertList 결과 ({inserted, updated, errors})
     */
    default void afterUpsert(Map<String, Object> result) { /* no-op */ }
}
