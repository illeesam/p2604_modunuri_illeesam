package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessErrorLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhAccessErrorLogService {

    private final SyhAccessErrorLogRepository syhAccessErrorLogRepository;

    /** getPageData — 페이징조회 */
    public SyhAccessErrorLogDto.PageResponse getPageData(SyhAccessErrorLogDto.Request req) {
        PageHelper.addPaging(req);
        return syhAccessErrorLogRepository.selectPageList(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhAccessErrorLogRepository.deleteAllBulk();
    }
}
