package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhBatchLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhBatchLogService {

    private final SyhBatchLogRepository syhBatchLogRepository;

    /** getById — 단건조회 */
    public SyhBatchLogDto.Item getById(String id) {
        return syhBatchLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhBatchLogDto.Item> getList(SyhBatchLogDto.Request req) {
        return syhBatchLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhBatchLogDto.PageResponse getPageData(SyhBatchLogDto.Request req) {
        PageHelper.addPaging(req);
        return syhBatchLogRepository.selectPageList(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhBatchLog entity) {
        return syhBatchLogRepository.updateSelective(entity);
    }
}
