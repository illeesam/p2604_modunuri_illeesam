package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EC 종합 대시보드 서비스.
 *
 * <p>요청 목록 [{compId, ...파라미터}] 를 받아 각 항목을 독립 조회하여
 * {@code info{NNNN}} 키로 Map에 담아 반환한다.</p>
 *
 * <p>차트 ID 체계: {@code info}{행(01~04)}{열(01~04)}</p>
 * <pre>
 * 01행: info0101(월별매출) / info0102(가입탈퇴) / info0103(상품클릭) / info0104(주문완료)
 * 02행: info0201(채널별매출) / info0202(핵심지표) / info0203(TOP7) / info0204(채널비중)
 * 03행: info0301(디바이스) / info0302(시간대) / info0303(지역별) / info0304(24H추이)
 * 04행: info0401(영업지표) / info0402(경제수준) / info0403(배송조건)
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardService {

    private final CmDashboardRepository cmDashboardRepository;
    @NonNull private final PlatformTransactionManager transactionManager;

    /**
     * 대시보드 데이터 조회.
     *
     * <p>각 항목은 {@code compId} 필드를 반드시 포함해야 하며,
     * 나머지 필드(siteNo, uiNm, limit 등)는 항목별로 자유롭게 지정한다.</p>
     *
     * <p>CompletableFuture.runAsync() 는 호출 스레드의 트랜잭션 컨텍스트를
     * 상속받지 못하므로 각 람다 안에서 TransactionTemplate 으로 트랜잭션을 독립 개설한다.</p>
     *
     * @param items [{compId: "COMP0101", siteNo: "01", uiNm: "DashboardBoEc01", ...}, ...]
     * @return {"info0101": [...], "info0202": [...], ...}
     */
    public Map<String, Object> getDashboard(List<Map<String, Object>> items) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setReadOnly(true);

        Map<String, Object> result = new ConcurrentHashMap<>();
        List<CompletableFuture<Void>> futures = items.stream()
            .map(item -> CompletableFuture.runAsync(() -> {
                String compId = String.valueOf(item.get("compId"));
                String key = "info" + compId.substring(4); // COMP0101 → info0101
                result.put(key, tx.execute(status ->
                    cmDashboardRepository.selectDashboard(compId, item)));
            }))
            .toList();
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        return result;
    }
}
