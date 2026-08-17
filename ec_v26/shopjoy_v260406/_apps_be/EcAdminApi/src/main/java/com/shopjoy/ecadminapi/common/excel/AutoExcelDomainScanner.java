package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Id;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.Comment;
import org.springframework.beans.factory.annotation.AnnotatedBeanDefinition;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.event.EventListener;
import org.springframework.core.GenericTypeResolver;
import org.springframework.core.type.AnnotationMetadata;
import org.springframework.core.type.filter.AssignableTypeFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 도메인마다 손으로 {@code @Bean} 을 등록하지 않아도, "평범한 CRUD 목록" 레포지토리는 자동으로
 * 엑셀 도메인으로 등록해주는 스캐너.
 *
 * <p><b>왜 필요한가</b> — 엑셀 도메인이 수백 개를 넘어가면 {@code XxxExcelDomainConfig.java} 에
 * 도메인마다 5~8줄씩 손으로/생성기로 등록하는 방식은 "등록 자체"는 안전해도 "그 목록을 사람이
 * 리뷰하는 비용"이 규모에 비례해 감당 안 되는 지점이 온다. 이 스캐너는 그 지점을 넘긴 이후를
 * 대비한 것 — Repository + Dto.Item/Request + Entity 조합이 표준 패턴({@code selectList}/
 * {@code selectPageData} + {@code @Id}) 을 그대로 따르는 "예외 없는 대다수"는 자동 등록하고,
 * 서비스 enrich 가 필요하거나 패턴에서 벗어난 소수만 여전히 명시적 {@code @Bean}(예:
 * {@code StExcelDomainConfig})으로 등록한다 — <b>명시적 등록이 항상 우선</b>이며 이 스캐너는
 * 빈 자리만 채운다({@link ExcelDomainRegistry#registerIfAbsent}).
 *
 * <p><b>안전장치 — 언제, 어떻게 스캔하는가</b>
 * <ul>
 *   <li><b>Spring 살아있는 빈이 아니라 classpath 를 ASM 메타데이터로 훑는다</b>
 *       ({@link ClassPathScanningCandidateComponentProvider}) — {@code ApplicationContext.getBeansOfType()}
 *       으로 훑으면 그 순간 대상 리포지토리 175개+ 가 즉시 인스턴스화되어
 *       {@code spring.data.jpa.repositories.bootstrap-mode: lazy}(부팅시간 최적화의 핵심 설정,
 *       단독 5초+ 절감)가 무력화된다. classpath 스캔은 이 문제와 완전히 무관하다.</li>
 *   <li><b>실제 Repository 빈 조회(getBean)는 그 도메인을 진짜 처음 쓸 때(엑셀 버튼을 실제로
 *       눌렀을 때)까지 미룬다</b> — {@link AutoDiscoveredExcelHandler} 참조. 스캔 단계에서는
 *       메서드 시그니처만 reflection 으로 확인하고 빈은 건드리지 않는다.</li>
 *   <li><b>앱 기동 완료({@link ApplicationReadyEvent}) 이후 백그라운드 스레드에서 실행</b> —
 *       "부팅 완료(요청을 받기 시작하는 시점)"를 지연시키지 않는다. 스캔 자체는 여전히 CPU를
 *       쓰지만(추정 수백ms~1~2초, 실측 필요), 이미 앱이 다른 요청을 받고 있는 도중에 돌아간다.
 *       그 창(window) 동안 자동탐색 대상 도메인은 아직 레지스트리에 없을 수 있다 — 명시
 *       등록 도메인은 {@code @PostConstruct} 시점에 이미 다 등록되어 있어 영향 없다.</li>
 *   <li><b>실패는 앱을 죽이지 않는다</b> — 사람이 검증한 명시적 등록과 달리 자동탐색은 추정이라,
 *       패턴에 안 맞는 리포지토리는 조용히 스킵(디버그 로그)하고 넘어간다.</li>
 * </ul>
 *
 * <p>스캔 대상 판정 기준(전부 만족해야 등록):
 * <ol>
 *   <li>{@code JpaRepository} 를 확장하는 인터페이스</li>
 *   <li>{@code List<X> selectList(Y)} 와 {@code BasePage<X> selectPageData(Y)} 를 모두 보유
 *       (X=Dto.Item, Y=Dto.Request, 두 메서드의 X 가 서로 일치해야 함)</li>
 *   <li>Y(파라미터 타입) 가 {@link BaseRequest} 를 상속</li>
 *   <li>Entity 에 {@code @Id} 필드가 정확히 1개</li>
 *   <li>이미 명시적으로 등록된 domain key 와 충돌하지 않음(충돌 시 명시 등록이 우선, 스킵)</li>
 * </ol>
 * 서비스 enrich(연관 데이터 채움) 가 필요한 도메인은 이 스캐너가 절대 알아낼 수 없으므로
 * 항상 리포지토리 직접 호출({@code r::selectList} 방식)로만 등록된다 — 그런 도메인은
 * 지금처럼 명시적 {@code @Bean} 으로 등록해 두면 이 스캐너가 자동으로 건너뛴다.
 */
@Slf4j
@Component
public class AutoExcelDomainScanner {

    /** 스캔 대상 루트 패키지 — base 아래 전 도메인(ec/*, sy/*) */
    private static final String BASE_PACKAGE = "com.shopjoy.ecadminapi.base";

    private final ExcelDomainRegistry registry;
    private final ApplicationContext applicationContext;
    private final EntityManager entityManager;

    /** 스캔 전용 단일 데몬 스레드 — 앱 종료를 막지 않고, 별도 스레드풀 설정(@EnableAsync) 없이 동작 */
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "excel-auto-discovery");
        t.setDaemon(true);
        return t;
    });

    public AutoExcelDomainScanner(ExcelDomainRegistry registry, ApplicationContext applicationContext, EntityManager entityManager) {
        this.registry = registry;
        this.applicationContext = applicationContext;
        this.entityManager = entityManager;
    }

    /** 앱이 이미 요청을 받기 시작한 뒤에 백그라운드로 스캔 — 부팅완료 시점을 지연시키지 않는다 */
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        executor.submit(this::scanAndRegister);
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
    }

    private void scanAndRegister() {
        long t0 = System.currentTimeMillis();
        AtomicInteger registered = new AtomicInteger();
        AtomicInteger skippedExisting = new AtomicInteger();
        AtomicInteger skippedNoPattern = new AtomicInteger();

        ClassPathScanningCandidateComponentProvider scanner = repositoryInterfaceScanner();
        Set<org.springframework.beans.factory.config.BeanDefinition> candidates =
            scanner.findCandidateComponents(BASE_PACKAGE);

        for (var bd : candidates) {
            try {
                Class<?> repoClass = Class.forName(bd.getBeanClassName());
                AutoDiscoveredExcelHandler handler = tryBuildHandler(repoClass);
                if (handler == null) {
                    skippedNoPattern.incrementAndGet();
                    continue;
                }
                boolean added = registry.registerIfAbsent(handler);
                if (added) registered.incrementAndGet();
                else skippedExisting.incrementAndGet();
            } catch (Throwable e) {
                // 자동탐색 실패는 그 도메인만 스킵 — 앱을 죽이지 않는다(클래스 상단 주석 참조)
                log.debug("[AutoExcelDomainScanner] 스캔 스킵: {} — {}", bd.getBeanClassName(), e.toString());
                skippedNoPattern.incrementAndGet();
            }
        }

        long ms = System.currentTimeMillis() - t0;
        log.info("[AutoExcelDomainScanner] 완료({}ms) — 자동등록 {}건 / 이미등록(명시우선) {}건 / 패턴불일치 {}건",
            ms, registered.get(), skippedExisting.get(), skippedNoPattern.get());
    }

    /** Repository 인터페이스만 후보로 잡는 스캐너 — 기본 설정은 인터페이스를 후보에서 제외하므로 override 필요
     *  (Spring Data 자체가 @EnableJpaRepositories 스캔 때 쓰는 것과 같은 방식) */
    private ClassPathScanningCandidateComponentProvider repositoryInterfaceScanner() {
        ClassPathScanningCandidateComponentProvider scanner =
            new ClassPathScanningCandidateComponentProvider(false) {
                @Override
                protected boolean isCandidateComponent(AnnotatedBeanDefinition beanDefinition) {
                    AnnotationMetadata metadata = beanDefinition.getMetadata();
                    return metadata.isInterface() && metadata.isIndependent();
                }
            };
        scanner.addIncludeFilter(new AssignableTypeFilter(JpaRepository.class));
        return scanner;
    }

    /** 판정 기준(클래스 주석) 을 전부 만족하면 핸들러 생성, 아니면 null */
    private AutoDiscoveredExcelHandler tryBuildHandler(Class<?> repoClass) {
        // JpaRepository<T, ID> 는 타입 파라미터가 2개라 resolveTypeArgument(단수)가 아니라
        // resolveTypeArguments(복수)로 배열을 받아 [0](Entity) 만 쓴다.
        Class<?>[] typeArgs = GenericTypeResolver.resolveTypeArguments(repoClass, JpaRepository.class);
        if (typeArgs == null || typeArgs.length < 1) return null;
        Class<?> entityClass = typeArgs[0];

        Method selectList = findMethod(repoClass, "selectList", List.class);
        Method selectPageData = findMethod(repoClass, "selectPageData", BasePage.class);
        if (selectList == null || selectPageData == null) return null;

        Class<?> reqFromList = selectList.getParameterTypes()[0];
        Class<?> reqFromPage = selectPageData.getParameterTypes()[0];
        if (!reqFromList.equals(reqFromPage)) return null;               // 두 메서드의 Request 타입이 달라 한 짝이 아님
        if (!BaseRequest.class.isAssignableFrom(reqFromList)) return null; // Dto.Request 컨벤션(BaseRequest 상속) 미준수

        Class<?> itemFromList = firstTypeArg(selectList.getGenericReturnType());
        Class<?> itemFromPage = firstTypeArg(selectPageData.getGenericReturnType());
        if (itemFromList == null || itemFromPage == null || !itemFromList.equals(itemFromPage)) return null;

        String pkField = findIdFieldName(entityClass);
        if (pkField == null) return null;

        String key = decapitalize(entityClass.getSimpleName());
        String label = entityComment(entityClass);

        return new AutoDiscoveredExcelHandler(
            key, label, entityClass, itemFromList, reqFromList, repoClass,
            selectList, selectPageData, pkField, applicationContext, entityManager
        );
    }

    /** 이름 + 파라미터 1개 + 반환타입 raw class 로 후보 메서드 탐색 (오버로드 대비 첫 매치 사용) */
    private Method findMethod(Class<?> cls, String name, Class<?> rawReturnType) {
        for (Method m : cls.getMethods()) {
            if (!m.getName().equals(name)) continue;
            if (m.getParameterCount() != 1) continue;
            if (!rawReturnType.isAssignableFrom(m.getReturnType())) continue;
            return m;
        }
        return null;
    }

    /** List<X> / BasePage<X> 의 X 를 꺼낸다. 제네릭 정보 없으면 null */
    private Class<?> firstTypeArg(Type genericType) {
        if (!(genericType instanceof ParameterizedType pt)) return null;
        Type[] args = pt.getActualTypeArguments();
        if (args.length == 0 || !(args[0] instanceof Class<?> c)) return null;
        return c;
    }

    /** Entity(+ 상위 클래스 체인) 에서 @Id 필드명 탐색. 없으면 null */
    private String findIdFieldName(Class<?> entityClass) {
        Class<?> c = entityClass;
        while (c != null && c != Object.class) {
            for (Field f : c.getDeclaredFields()) {
                if (f.isAnnotationPresent(Id.class)) return f.getName();
            }
            c = c.getSuperclass();
        }
        return null;
    }

    /** Entity 클래스 레벨 @Comment → 라벨. 없으면 Entity 단순명 */
    private String entityComment(Class<?> entityClass) {
        Comment c = entityClass.getAnnotation(Comment.class);
        return (c != null && c.value() != null && !c.value().isBlank()) ? c.value() : entityClass.getSimpleName();
    }

    private String decapitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toLowerCase(s.charAt(0)) + s.substring(1);
    }
}
