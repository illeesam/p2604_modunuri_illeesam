package com.shopjoy.ecadminapi.common.excel;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.function.Consumer;

/**
 * 페이지 조회만 있는 도메인(주로 이력/로그)을 위한 {@link ExcelDomainHandler} 공통 구현.
 *
 * <p>이력 테이블은 수가 많고 형태가 거의 같아, 도메인마다 {@code countList}/{@code fetchChunked}
 * 를 서비스에 새로 만들면 같은 코드가 9벌 생긴다. 여기서 한 번만 구현하고 각 도메인은
 * "목록 조회 함수"와 "PK 필드명"만 알려주면 된다.</p>
 *
 * <p><b>대량 export 안전장치</b>
 * <ul>
 *   <li><b>PK 오름차순 강제</b> — 로그 테이블은 export 중에도 계속 INSERT 된다.
 *       최신순(내림차순)으로 페이징하면 새 행이 맨 앞에 끼어들어 뒤 페이지가 한 칸씩 밀리고,
 *       그 결과 <b>같은 행이 두 번 나오거나 누락</b>된다.
 *       PK 오름차순이면 새 행은 항상 끝에 붙으므로 이미 읽은 구간이 흔들리지 않는다.</li>
 *   <li><b>청크마다 {@code em.clear()}</b> — 영속성 컨텍스트가 커지지 않아 힙이 일정하게 유지된다.</li>
 *   <li><b>원본 req 불변</b> — snapshot 에만 페이징을 세팅해 호출 측 검색조건을 오염시키지 않는다.</li>
 * </ul>
 *
 * @param <E> Entity
 * @param <I> Dto.Item
 * @param <Q> Dto.Request
 */
public abstract class AbstractPagedExcelHandler<E, I, Q extends BaseRequest>
        implements ExcelDomainHandler<E, I, Q> {

    /** 목록 조회 — 구현체가 repository.selectList(req) 를 그대로 위임 */
    protected abstract List<I> selectList(Q req);

    /** 페이지 조회 — 전체 건수를 얻기 위해 사용 */
    protected abstract BasePage<I> selectPageData(Q req);

    /** 정렬 기준 PK 필드명 (camelCase). 예: "logId" */
    protected abstract String pkFieldName();

    /** 청크 사이 영속성 컨텍스트 정리를 위한 EntityManager */
    protected abstract EntityManager entityManager();

    @Override
    public long countList(Q req) {
        Q snap = snapshot(req);
        snap.setPageNo(1);
        snap.setPageSize(1);
        BasePage<I> page = selectPageData(snap);
        return page == null ? 0L : page.getPageTotalCount();
    }

    @Override
    public void fetchChunked(Q req, int chunkSize, Consumer<I> consumer) {
        Q snap = snapshot(req);
        snap.setPageSize(chunkSize);
        /* PK 오름차순 강제 — 동시 INSERT 로 인한 중복/누락 방지 (위 클래스 주석 참조) */
        snap.setSort(pkFieldName() + " asc");

        EntityManager em = entityManager();
        int pageNo = 1;
        while (true) {
            snap.setPageNo(pageNo);
            List<I> chunk = selectList(snap);
            if (chunk == null || chunk.isEmpty()) break;
            for (I item : chunk) consumer.accept(item);
            if (chunk.size() < chunkSize) break;
            pageNo++;
            if (em != null) em.clear();
        }
    }

    /** 원본 req 를 건드리지 않기 위한 복사본 */
    @SuppressWarnings("unchecked")
    private Q snapshot(Q req) {
        try {
            Q snap = (Q) reqClass().getDeclaredConstructor().newInstance();
            if (req != null) VoUtil.voCopy(req, snap);
            return snap;
        } catch (Exception e) {
            throw new IllegalStateException(
                "Request 복사 실패 — " + reqClass().getName() + " 에 기본 생성자가 필요합니다.", e);
        }
    }
}
