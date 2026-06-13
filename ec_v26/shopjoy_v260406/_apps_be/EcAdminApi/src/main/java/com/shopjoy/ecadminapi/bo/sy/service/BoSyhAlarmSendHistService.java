package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhAlarmSendHistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyhAlarmSendHistService {

    private final SyhAlarmSendHistService syhAlarmSendHistService;

    public SyhAlarmSendHistDto.Item getById(String id) {
        return syhAlarmSendHistService.getById(id);
    }

    public SyhAlarmSendHistDto.PageResponse getPageData(SyhAlarmSendHistDto.Request req) {
        return syhAlarmSendHistService.getPageData(req);
    }
}
