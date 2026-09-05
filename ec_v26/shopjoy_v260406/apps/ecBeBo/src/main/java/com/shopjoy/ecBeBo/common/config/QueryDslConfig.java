package com.shopjoy.ecadminapi.common.config;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * QueryDSL 설정.
 *
 * <p>역할/책임: 타입세이프 동적 쿼리 작성을 위한 {@link JPAQueryFactory} 를 스프링 빈으로
 * 등록한다. 리포지토리/서비스에서 주입받아 Q타입 기반 쿼리를 작성할 때 사용한다.</p>
 *
 * <p>동작 시점: 애플리케이션 컨텍스트 기동 시 단일 인스턴스로 생성된다.</p>
 *
 * <p>주의: {@link EntityManager} 는 컨테이너 관리 프록시(스레드별 영속성 컨텍스트로 위임)이므로
 * 팩토리를 싱글톤으로 두어도 트랜잭션/스레드 안전성에 문제가 없다.</p>
 */
@Configuration
@RequiredArgsConstructor
public class QueryDslConfig {

    /** 스프링이 주입하는 JPA EntityManager(컨테이너 관리 프록시). */
    private final EntityManager entityManager;

    /**
     * QueryDSL JPAQueryFactory 빈을 생성한다.
     *
     * @return 주입된 {@link EntityManager} 로 초기화된 {@link JPAQueryFactory} 싱글톤.
     *         실제 쿼리 실행은 호출 스레드의 영속성 컨텍스트에 위임되므로 싱글톤 공유가 안전
     */
    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(entityManager);
    }
}