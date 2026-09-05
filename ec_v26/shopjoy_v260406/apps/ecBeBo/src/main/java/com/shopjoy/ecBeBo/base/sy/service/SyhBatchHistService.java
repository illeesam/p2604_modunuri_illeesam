package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhBatchHist;
import com.shopjoy.ecBeBo.base.sy.repository.SyhBatchHistRepository;
import com.shopjoy.ecBeBo.common.util.PageHelper;
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
        // [QueryDSL] 배치 실행 이력 단건 조회
        return syhBatchHistRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhBatchHistDto.Item> getList(SyhBatchHistDto.Request req) {
        // [QueryDSL] 배치 실행 이력 목록 조회
        return syhBatchHistRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhBatchHistDto.Item> getPageData(SyhBatchHistDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 배치 실행 이력 페이지 조회
        return syhBatchHistRepository.selectPageData(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhBatchHist entity) {
        // [QueryDSL] 배치 실행 이력 선택적 필드 수정
        return syhBatchHistRepository.updateSelective(entity);
    }
}
