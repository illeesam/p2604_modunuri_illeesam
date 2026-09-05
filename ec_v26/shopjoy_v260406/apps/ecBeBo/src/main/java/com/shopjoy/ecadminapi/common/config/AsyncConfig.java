package com.shopjoy.ecadminapi.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 비동기(@Async) 실행 설정.
 *
 * <p>메시지 발송(메일/카카오/SMS/시스템알림)처럼 본 업무 응답을 지연시키면 안 되는 부가 작업을
 * 별도 스레드풀에서 처리하기 위한 설정. {@code @Async("msgSendExecutor")} 로 지정한다.</p>
 *
 * <p>주의: @Async 스레드에는 SecurityContext / PageHelper ThreadLocal 이 전파되지 않는다.
 * 발송 이력의 reg_by 는 GUEST 로 기록되며(발송 주체는 시스템), 이는 의도된 동작이다.</p>
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    /** 메시지 발송 전용 스레드풀. 발송이 느려도 요청 스레드를 점유하지 않게 분리한다. */
    @Bean(name = "msgSendExecutor")
    public Executor msgSendExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("msg-send-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        executor.initialize();
        return executor;
    }

    /** @Async void 메서드에서 던져진 예외는 호출자에게 전파되지 않으므로 여기서 로깅한다. */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            log.error("[Async] 비동기 실행 중 예외 — {}.{}", method.getDeclaringClass().getSimpleName(), method.getName(), ex);
    }
}
