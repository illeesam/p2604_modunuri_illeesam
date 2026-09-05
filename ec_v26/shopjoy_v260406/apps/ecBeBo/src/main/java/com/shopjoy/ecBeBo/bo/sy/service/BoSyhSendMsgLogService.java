package com.shopjoy.ecBeBo.bo.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecBeBo.base.sy.service.SyhSendMsgLogService;
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

    public BasePage<SyhSendMsgLogDto.Item> getPageData(SyhSendMsgLogDto.Request req) {
        return syhSendMsgLogService.getPageData(req);
    }
}
