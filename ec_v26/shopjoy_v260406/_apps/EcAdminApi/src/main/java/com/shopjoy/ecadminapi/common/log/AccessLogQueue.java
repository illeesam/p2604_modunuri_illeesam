package com.shopjoy.ecadminapi.common.log;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessLogRepository;
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
 * API 액세스 로그 비동기 저장 큐.
 *
 * - 큐 포화 시 즉시 드롭 (non-blocking offer)
 * - 단일 데몬 워커 스레드가 2초 poll 루프로 DB 저장
 * - 앱 종료 시 잔여 최대 50건 flush
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AccessLogQueue {

    @Value("${app.access-log.queue-size:100}")
    private int queueSize;

    private final SyhAccessLogRepository repository;

    private LinkedBlockingQueue<SyhAccessLog> queue;
    private Thread workerThread;

    private final AtomicLong dropCount = new AtomicLong(0);

    @PostConstruct
    public void init() {
        queue = new LinkedBlockingQueue<>(queueSize);

        workerThread = new Thread(this::drainLoop, "access-log-worker");
        workerThread.setDaemon(true);
        workerThread.start();

        log.info("[AccessLog] 액세스 로그 큐 시작 — queueSize={}", queueSize);
    }

    public void offer(SyhAccessLog entry) {
        if (!queue.offer(entry)) {
            long n = dropCount.incrementAndGet();
            if (n % 100 == 1) {
                System.err.printf("[AccessLog] 큐 포화 — 드롭 누적 %d건 (queueSize=%d)%n", n, queueSize);
            }
        }
    }

    public int size()         { return queue != null ? queue.size() : 0; }
    public int getQueueSize() { return queueSize; }

    private void drainLoop() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                SyhAccessLog item = queue.poll(2, TimeUnit.SECONDS);
                if (item != null) save(item);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                System.err.println("[AccessLog] 워커 예외: " + e.getMessage());
            }
        }
    }

    private void save(SyhAccessLog entry) {
        try {
            repository.save(entry);
        } catch (Exception e) {
            System.err.println("[AccessLog] DB 저장 실패: " + e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        workerThread.interrupt();
        List<SyhAccessLog> remaining = new ArrayList<>();
        queue.drainTo(remaining, 50);
        if (!remaining.isEmpty()) {
            log.info("[AccessLog] 종료 flush — {}건", remaining.size());
            remaining.forEach(this::save);
        }
    }
}
