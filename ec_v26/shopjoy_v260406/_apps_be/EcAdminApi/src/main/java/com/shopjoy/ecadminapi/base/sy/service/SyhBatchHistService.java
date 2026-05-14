package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchHist;
import com.shopjoy.ecadminapi.base.sy.repository.SyhBatchHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhBatchHistService {

    private final SyhBatchHistRepository syhBatchHistRepository;

    /** getById — 단건조회 */
    public SyhBatchHistDto.Item getById(String id) {
        return syhBatchHistRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhBatchHistDto.Item> getList(SyhBatchHistDto.Request req) {
        return syhBatchHistRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhBatchHistDto.PageResponse getPageData(SyhBatchHistDto.Request req) {
        PageHelper.addPaging(req);
        return syhBatchHistRepository.selectPageList(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhBatchHist entity) {
        return syhBatchHistRepository.updateSelective(entity);
    }
}
