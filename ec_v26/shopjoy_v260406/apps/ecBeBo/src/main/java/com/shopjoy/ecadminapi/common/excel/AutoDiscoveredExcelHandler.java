package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.persistence.EntityManager;
import org.springframework.context.ApplicationContext;
import org.springframework.data.jpa.repository.JpaRepository;

import java.lang.reflect.Method;
import java.util.List;

/**
 * {@link AutoExcelDomainScanner} 가 classpath 스캔으로 찾아낸 Repository 하나에 대응하는
 * {@link ExcelDomainHandler} — reflection 으로 {@code selectList}/{@code selectPageData} 를 호출한다.
 *
 * <p><b>Repository 빈은 여기서 "쓸 때" 처음 조회한다(lazy)</b> — 스캔 단계(앱 기동 완료 후
 * 백그라운드)에서 {@code ApplicationContext.getBean()} 을 호출하면 그 순간 JPA Repository
 * 프록시가 즉시 생성되는데, 이러면 {@code bootstrap-mode: lazy}(리포지토리 175개+ 지연생성,
 * 부팅시간 최적화의 핵심 설정)가 무력화된다. 실제로 그 도메인의 [엑셀] 버튼을 눌러
 * {@link #selectList}/{@link #selectPageData} 가 처음 호출되는 시점까지 빈 조회를 미루면,
 * 다른 175개 리포지토리와 완전히 같은 "진짜 처음 쓸 때만 생성" 원칙을 그대로 지킨다.
 *
 * <p>제네릭 타입은 전부 classpath 스캔 시점에 얻은 {@code Class<?>} 라 컴파일 타임 타입 파라미터가
 * 없다 — 이 파일 안에서만 unchecked cast 를 쓰고, 그 대가로 도메인마다 코드를 안 써도 된다.
 * 이런 이유로 이 파일은 명시적 {@code @Bean}(예: {@code StExcelDomainConfig}) 등록을 대체하지
 * 않는다 — 서비스 enrich 가 필요하거나 특이 케이스인 도메인은 여전히 명시적으로 등록해야 하고,
 * 그 쪽이 항상 우선한다({@link ExcelDomainRegistry#registerIfAbsent}).
 */
public class AutoDiscoveredExcelHandler extends AbstractPagedExcelHandler<Object, Object, BaseRequest> {

    private final String key;
    private final String label;
    private final Class<?> entityClass;
    private final Class<?> itemClass;
    private final Class<?> reqClass;
    private final Class<?> repoClass;
    private final Method selectListMethod;
    private final Method selectPageDataMethod;
    private final String pkFieldName;
    private final ApplicationContext applicationContext;
    private final EntityManager entityManager;

    /** 실제 사용 시점에 딱 한 번만 조회 — {@link ApplicationContext#getBean} 이 여기서 처음 불린다 */
    private volatile JpaRepository<?, ?> repositoryBean;

    public AutoDiscoveredExcelHandler(
            String key, String label,
            Class<?> entityClass, Class<?> itemClass, Class<?> reqClass, Class<?> repoClass,
            Method selectListMethod, Method selectPageDataMethod, String pkFieldName,
            ApplicationContext applicationContext, EntityManager entityManager
    ) {
        this.key = key;
        this.label = label;
        this.entityClass = entityClass;
        this.itemClass = itemClass;
        this.reqClass = reqClass;
        this.repoClass = repoClass;
        this.selectListMethod = selectListMethod;
        this.selectPageDataMethod = selectPageDataMethod;
        this.pkFieldName = pkFieldName;
        this.applicationContext = applicationContext;
        this.entityManager = entityManager;
    }

    @Override public String key()    { return key; }
    @Override public String label()  { return label; }

    @SuppressWarnings("unchecked")
    @Override public Class<Object> entityClass()  { return (Class<Object>) entityClass; }

    @SuppressWarnings("unchecked")
    @Override public Class<Object> itemClass()    { return (Class<Object>) itemClass; }

    @SuppressWarnings("unchecked")
    @Override public Class<BaseRequest> reqClass() { return (Class<BaseRequest>) reqClass; }

    @SuppressWarnings("unchecked")
    @Override public JpaRepository<Object, String> repository() { return (JpaRepository<Object, String>) repoBean(); }

    /** 진짜 처음 쓸 때만 Spring 빈 조회 — 클래스 상단 주석 참조 */
    private JpaRepository<?, ?> repoBean() {
        JpaRepository<?, ?> r = repositoryBean;
        if (r == null) {
            synchronized (this) {
                r = repositoryBean;
                if (r == null) {
                    r = (JpaRepository<?, ?>) applicationContext.getBean(repoClass);
                    repositoryBean = r;
                }
            }
        }
        return r;
    }

    @SuppressWarnings("unchecked")
    @Override
    protected List<Object> selectList(BaseRequest req) {
        try {
            return (List<Object>) selectListMethod.invoke(repoBean(), req);
        } catch (Exception e) {
            throw new IllegalStateException("[AutoDiscoveredExcelHandler] selectList 호출 실패 — domain=" + key, e);
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    protected BasePage<Object> selectPageData(BaseRequest req) {
        try {
            return (BasePage<Object>) selectPageDataMethod.invoke(repoBean(), req);
        } catch (Exception e) {
            throw new IllegalStateException("[AutoDiscoveredExcelHandler] selectPageData 호출 실패 — domain=" + key, e);
        }
    }

    @Override protected String pkFieldName()          { return pkFieldName; }
    @Override protected EntityManager entityManager() { return entityManager; }

    @Override
    public ExcelMetaInfo meta() {
        // Entity 의 @Comment 기반 자동 메타 — 명시 등록 도메인과 동일한 방식 재사용
        return ExcelMetaBuilder.fromEntityIntersectDto(null, null, entityClass, itemClass);
    }
}
