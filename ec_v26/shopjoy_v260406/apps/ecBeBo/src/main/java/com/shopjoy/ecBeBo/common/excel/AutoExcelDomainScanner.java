package com.shopjoy.ecBeBo.common.excel;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Id;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.Comment;
import org.springframework.beans.factory.annotation.AnnotatedBeanDefinition;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.GenericTypeResolver;
import org.springframework.core.type.AnnotationMetadata;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.type.filter.AssignableTypeFilter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Set;
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
 *   <li><b>컨텍스트 초기화(refresh) 중 {@code @PostConstruct} 로 동기 실행</b> — "구동완료" 로그가
 *       찍히는 시점에는 이미 178개 도메인이 전부 등록 완료된 상태가 보장된다(자동탐색 대상이
 *       아직 안 채워진 창(window)이 없음). 대가는 스캔 시간만큼(실측 ~300~400ms) 부팅시간이
 *       늘어나는 것뿐이다.</li>
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
/*
 * ⚠ @Lazy(false) 필수 — application-local.yml 의 spring.main.lazy-initialization: true(전역
 * 빈 지연초기화, JPA 전용인 bootstrap-mode:lazy 와는 다른 설정) 아래에서는 아무도 이 빈을
 * 의존하지 않으면(실제로 없음 — 자기 완결적 @PostConstruct 부작용 전용 빈) 컨테이너가
 * 영원히 생성하지 않는다. 즉 @PostConstruct 가 예외 없이 "그냥 한 번도 안 불린다."
 * 2026-08-17 실제로 이 버그로 자동탐색이 조용히 0건 동작한 것을 부팅 후 API 로 확인하고서야
 * 발견했다(로그도 전혀 안 남아 원인 파악에 애먹음) — 로그·에러 없이 침묵하는 실패라 특히 주의.
 */
@Lazy(false)
public class AutoExcelDomainScanner {

    /** 스캔 대상 루트 패키지 — base 아래 전 도메인(ec/*, sy/*) */
    private static final String BASE_PACKAGE = "com.shopjoy.ecBeBo.base";

    private final ExcelDomainRegistry registry;
    private final ApplicationContext applicationContext;
    private final EntityManager entityManager;

    public AutoExcelDomainScanner(ExcelDomainRegistry registry, ApplicationContext applicationContext, EntityManager entityManager) {
        this.registry = registry;
        this.applicationContext = applicationContext;
        this.entityManager = entityManager;
    }

    /**
     * 컨텍스트 초기화(refresh) 도중, 즉 "구동완료" 로그가 찍히기 전에 동기적으로 스캔한다.
     * {@link ExcelDomainRegistry} 는 이 빈의 생성자 의존성이라 Spring 이 이미 그 빈의
     * {@code @PostConstruct}(명시 등록 50개 적재)까지 끝낸 뒤에 이 메서드를 호출한다는
     * 것이 보장된다 — 순서가 뒤바뀔 걱정 없이 곧바로 {@code registerIfAbsent} 호출 가능.
     *
     * <p>2026-08-17: 애초엔 {@code ApplicationReadyEvent} 이후 백그라운드 스레드로 실행해
     * "구동완료" 타이밍에 스캔 비용이 전혀 안 잡히게 했었으나, 부팅 완료 시점에 178개 도메인이
     * 전부 등록 완료된 상태를 보장하고 싶다는 요구로 동기 방식으로 전환했다. 대가는 스캔
     * 시간만큼(실측 ~300~400ms) 부팅시간이 늘어나는 것뿐 — {@code bootstrap-mode: lazy} 는
     * 이 스캔이 Spring 빈을 전혀 건드리지 않아(순수 classpath reflection) 어느 방식이든
     * 영향받지 않는다(클래스 상단 주석 참조).
     */
    @PostConstruct
    void init() {
        scanAndRegister();
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
