package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecBeBo.base.sy.repository.SyhSendMsgLogRepository;
import com.shopjoy.ecBeBo.common.util.PageHelper;
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
        // [QueryDSL] 메시지 발송 로그 (SMS/카카오/앱푸시) 단건 조회
        return syhSendMsgLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhSendMsgLogDto.Item> getList(SyhSendMsgLogDto.Request req) {
        // [QueryDSL] 메시지 발송 로그 (SMS/카카오/앱푸시) 목록 조회
        return syhSendMsgLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhSendMsgLogDto.Item> getPageData(SyhSendMsgLogDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 메시지 발송 로그 (SMS/카카오/앱푸시) 페이지 조회
        return syhSendMsgLogRepository.selectPageData(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhSendMsgLog entity) {
        // [QueryDSL] 메시지 발송 로그 (SMS/카카오/앱푸시) 선택적 필드 수정
        return syhSendMsgLogRepository.updateSelective(entity);
    }
}
