package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecBeBo.base.sy.repository.SyhAccessLogRepository;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhAccessLogService {

    private final SyhAccessLogRepository syhAccessLogRepository;

    /** getById — 단건 상세조회 (코드명/연관명 풀필드) */
    public SyhAccessLogDto.Item getById(String id) {
        // [QueryDSL] API 요청/응답 액세스 로그 (비동기 선택 수집) 단건 조회
        return syhAccessLogRepository.selectById(id).orElse(null);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhAccessLogDto.Item> getPageData(SyhAccessLogDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] API 요청/응답 액세스 로그 (비동기 선택 수집) 페이지 조회
        return syhAccessLogRepository.selectPageData(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        // [쿼리 메서드] 전체 로그 삭제 (JpaRepository 기본 제공)
        syhAccessLogRepository.deleteAllInBatch();
    }
}
