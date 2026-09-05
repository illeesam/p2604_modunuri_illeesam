package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhApiLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhApiLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhApiLogService {

    private final SyhApiLogRepository syhApiLogRepository;

    /** getById — 단건조회 */
    public SyhApiLogDto.Item getById(String id) {
        // [QueryDSL] 외부 API 연동 로그 단건 조회
        return syhApiLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhApiLogDto.Item> getList(SyhApiLogDto.Request req) {
        // [QueryDSL] 외부 API 연동 로그 목록 조회
        return syhApiLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhApiLogDto.Item> getPageData(SyhApiLogDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 외부 API 연동 로그 페이지 조회
        return syhApiLogRepository.selectPageData(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhApiLog entity) {
        // [QueryDSL] 외부 API 연동 로그 선택적 필드 수정
        return syhApiLogRepository.updateSelective(entity);
    }

}
