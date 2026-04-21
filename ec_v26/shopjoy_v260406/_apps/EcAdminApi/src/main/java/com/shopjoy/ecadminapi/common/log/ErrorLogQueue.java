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

    @Value("${app.error-log.queue-size:100}")
    private int queueSize;

    @Value("${app.error-log.db-save:true}")
    private boolean dbSave;

    private final SyhAccessErrorLogRepository repository;

    private LinkedBlockingQueue<SyhAccessErrorLog> queue;
    private Thread workerThread;

    /** 누적 드롭 건수 */
    private final AtomicLong dropCount = new AtomicLong(0);

    @PostConstruct
    public void init() {
        queue = new LinkedBlockingQueue<>(queueSize);

        workerThread = new Thread(this::drainLoop, "err-log-worker");
        workerThread.setDaemon(true);
        workerThread.start();

        log.info("[ErrorLog] 에러 로그 큐 시작 — queueSize={}", queueSize);
    }

    /**
     * 큐에 적재. 큐가 가득 찼으면 즉시 드롭(non-blocking).
     * 드롭 100건마다 System.err 경고 (자기 자신에 log 호출 시 재귀 위험).
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

    /** 현재 큐 적재 건수 */
    public int size() { return queue != null ? queue.size() : 0; }

    /** 설정된 큐 최대 크기 */
    public int getQueueSize() { return queueSize; }

    /** 누적 드롭 건수 */
    public long getDropCount() { return dropCount.get(); }

    // ── 워커 ────────────────────────────────────────────────────────────
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

    private void save(SyhAccessErrorLog entry) {
        try {
            repository.save(entry);
        } catch (Exception e) {
            System.err.println("[ErrorLog] DB 저장 실패: " + e.getMessage());
        }
    }

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
