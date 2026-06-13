package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhSendEmailLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyhSendEmailLogService {

    private final SyhSendEmailLogService syhSendEmailLogService;

    public SyhSendEmailLogDto.Item getById(String id) {
        return syhSendEmailLogService.getById(id);
    }

    public SyhSendEmailLogDto.PageResponse getPageData(SyhSendEmailLogDto.Request req) {
        return syhSendEmailLogService.getPageData(req);
    }
}
