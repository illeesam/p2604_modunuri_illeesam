package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
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
        return syhAccessLogRepository.selectById(id).orElse(null);
    }

    /** getPageData — 페이징조회 */
    public SyhAccessLogDto.PageResponse getPageData(SyhAccessLogDto.Request req) {
        PageHelper.addPaging(req);
        return syhAccessLogRepository.selectPageData(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhAccessLogRepository.deleteAllBulk();
    }
}
