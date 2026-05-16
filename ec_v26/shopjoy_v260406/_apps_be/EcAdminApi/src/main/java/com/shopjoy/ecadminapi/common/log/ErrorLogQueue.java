package com.shopjoy.ecadminapi.common.log;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessErrorLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessErrorLogRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * ERROR 로그 비동기 저장 큐.
 *
 * - 큐가 queueSize 를 초과하면 즉시 드롭 (성능 보호)
 * - 단일 데몬 워커 스레드가 큐를 소비하며 DB에 저장
 * - 앱 종료 시 잔여 항목 최대 50건까지 flush
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ErrorLogQueue {

    /** 큐 최대 크기 (app.error-log.queue-size, 기본 100) */
    @Value("${app.error-log.queue-size:100}")
    private int queueSize;

    /** 에러 로그 DB 저장 활성화 여부 (false 면 offer 자체를 무시) */
    @Value("${app.error-log.db-save:true}")
    private boolean dbSave;

    /** 에러 로그 영속화 리포지토리 (워커 스레드에서만 사용) */
    private final SyhAccessErrorLogRepository repository;

    /** Appender 스레드 → 워커 스레드 전달용 유한 블로킹 큐 */
    private LinkedBlockingQueue<SyhAccessErrorLog> queue;
    /** 큐를 소비하는 단일 데몬 워커 스레드 */
    private Thread workerThread;

    /** 큐 포화로 드롭된 누적 건수 (경고 출력 주기 판단용) */
    private final AtomicLong dropCount = new AtomicLong(0);

    /**
     * 큐와 워커 스레드를 초기화한다.
     *
     * <p>Bean 생성 직후 queueSize 크기의 유한 큐를 만들고 "err-log-worker" 데몬
     * 스레드로 drainLoop 를 실행한다. 데몬으로 두어 JVM 종료를 막지 않으며,
     * 잔여분 flush 는 @PreDestroy 의 shutdown 이 담당한다.
     */
    @PostConstruct
    public void init() {
        queue = new LinkedBlockingQueue<>(queueSize);

        workerThread = new Thread(this::drainLoop, "err-log-worker");
        workerThread.setDaemon(true);
        workerThread.start();

        log.info("[ErrorLog] 에러 로그 큐 시작 — queueSize={}", queueSize);
    }

    /**
     * 에러 로그를 큐에 비차단(non-blocking) 적재한다.
     *
     * <p>로그를 발생시킨 호출 스레드(Appender)에서 호출되므로 큐가 가득 차도
     * 대기하지 않고 즉시 드롭한다. dbSave=false 면 적재 자체를 건너뛴다.
     * 드롭 100건마다 한 번 System.err 로 경고를 출력한다(로거 사용 시 자기 재귀 위험 회피).
     *
     * @param entry 적재할 에러 로그 엔트리
     */
    public void offer(SyhAccessErrorLog entry) {
        if (!dbSave) return;
        if (!queue.offer(entry)) {
            long n = dropCount.incrementAndGet();
            if (n % 100 == 1) {
                System.err.printf("[ErrorLog] 큐 포화 — 드롭 누적 %d건 (queueSize=%d)%n", n, queueSize);
            }
        }
    }

    /**
     * 현재 큐에 적재된 건수.
     *
     * @return 큐 크기, 미초기화 시 0
     */
    public int size() { return queue != null ? queue.size() : 0; }

    /**
     * 설정된 큐 최대 크기.
     *
     * @return queueSize
     */
    public int getQueueSize() { return queueSize; }

    /**
     * 큐 포화로 드롭된 누적 건수.
     *
     * @return 누적 드롭 건수
     */
    public long getDropCount() { return dropCount.get(); }

    // ── 워커 ────────────────────────────────────────────────────────────
    /**
     * 워커 스레드 메인 루프. 인터럽트 전까지 큐를 소비한다.
     *
     * <p>poll 에 2초 타임아웃을 두어 큐가 비어 있어도 주기적으로 깨어나 shutdown
     * 인터럽트를 빠르게 감지한다. InterruptedException 시 인터럽트 플래그를 복구해
     * 루프를 종료하고, 그 외 예외는 삼켜(System.err) 워커가 죽지 않게 한다.
     */
    private void drainLoop() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                // 최대 2초 대기 후 반복 (shutdown 시 빠른 인터럽트 감지)
                SyhAccessErrorLog item = queue.poll(2, TimeUnit.SECONDS);
                if (item != null) save(item);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                System.err.println("[ErrorLog] 워커 예외: " + e.getMessage());
            }
        }
    }

    /**
     * 단건 에러 로그를 DB에 저장한다. (워커 스레드 전용)
     *
     * <p>저장 예외는 삼켜 워커 루프가 중단되지 않도록 한다. DB 일시 장애 시 해당
     * 로그는 유실되며 재시도하지 않는다(로그 적재가 본 트래픽을 막지 않는 원칙).
     *
     * @param entry 저장할 에러 로그 엔트리
     */
    private void save(SyhAccessErrorLog entry) {
        try {
            repository.save(entry);
        } catch (Exception e) {
            System.err.println("[ErrorLog] DB 저장 실패: " + e.getMessage());
        }
    }

    /**
     * 앱 종료 시 워커를 중단하고 잔여 에러 로그를 최대 50건까지 flush 한다.
     *
     * <p>워커에 인터럽트를 보낸 뒤 큐에 남은 항목을 최대 50건만 drainTo 로 꺼내
     * 동기 저장한다. 50건 상한은 종료 지연을 막기 위한 의도적 제한이며 그 이상은 유실될 수 있다.
     */
    @PreDestroy
    public void shutdown() {
        workerThread.interrupt();
        // 잔여 항목 최대 50건 flush
        List<SyhAccessErrorLog> remaining = new ArrayList<>();
        queue.drainTo(remaining, 50);
        if (!remaining.isEmpty()) {
            log.info("[ErrorLog] 종료 flush — {}건", remaining.size());
            remaining.forEach(this::save);
        }
    }
}
