package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecBeBo.base.sy.repository.SyhAccessErrorLogRepository;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhAccessErrorLogService {

    private final SyhAccessErrorLogRepository syhAccessErrorLogRepository;

    /** getById — 단건 상세조회 (코드명/연관명 풀필드) */
    public SyhAccessErrorLogDto.Item getById(String id) {
        // [QueryDSL] HTTP 요청 에러 로그 (비동기 수집) 단건 조회
        return syhAccessErrorLogRepository.selectById(id).orElse(null);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhAccessErrorLogDto.Item> getPageData(SyhAccessErrorLogDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] HTTP 요청 에러 로그 (비동기 수집) 페이지 조회
        return syhAccessErrorLogRepository.selectPageData(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        // [쿼리 메서드] 전체 로그 삭제 (JpaRepository 기본 제공)
        syhAccessErrorLogRepository.deleteAllInBatch();
    }
}
