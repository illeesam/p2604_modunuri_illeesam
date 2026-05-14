package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhSendEmailLogService {

    private final SyhSendEmailLogRepository syhSendEmailLogRepository;

    /** getById — 단건조회 */
    public SyhSendEmailLogDto.Item getById(String id) {
        return syhSendEmailLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhSendEmailLogDto.Item> getList(SyhSendEmailLogDto.Request req) {
        return syhSendEmailLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhSendEmailLogDto.PageResponse getPageData(SyhSendEmailLogDto.Request req) {
        PageHelper.addPaging(req);
        return syhSendEmailLogRepository.selectPageList(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhSendEmailLog entity) {
        return syhSendEmailLogRepository.updateSelective(entity);
    }
}
