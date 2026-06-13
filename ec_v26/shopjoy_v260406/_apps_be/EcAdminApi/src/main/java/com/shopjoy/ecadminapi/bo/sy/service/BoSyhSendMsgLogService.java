package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhSendMsgLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyhSendMsgLogService {

    private final SyhSendMsgLogService syhSendMsgLogService;

    public SyhSendMsgLogDto.Item getById(String id) {
        return syhSendMsgLogService.getById(id);
    }

    public SyhSendMsgLogDto.PageResponse getPageData(SyhSendMsgLogDto.Request req) {
        return syhSendMsgLogService.getPageData(req);
    }
}
