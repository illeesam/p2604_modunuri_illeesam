package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhSendMsgLogService {

    private final SyhSendMsgLogRepository syhSendMsgLogRepository;

    /** getById — 단건조회 */
    public SyhSendMsgLogDto.Item getById(String id) {
        return syhSendMsgLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhSendMsgLogDto.Item> getList(SyhSendMsgLogDto.Request req) {
        return syhSendMsgLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhSendMsgLogDto.PageResponse getPageData(SyhSendMsgLogDto.Request req) {
        PageHelper.addPaging(req);
        return syhSendMsgLogRepository.selectPageList(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhSendMsgLog entity) {
        return syhSendMsgLogRepository.updateSelective(entity);
    }
}
