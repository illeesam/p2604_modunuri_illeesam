package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberLoginLogRepository;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbhMemberLoginLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 회원 로그인 로그 서비스 — base 위임 (thin wrapper) + deleteAll.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoMbMemberLoginLogService {

    private final MbhMemberLoginLogService mbhMemberLoginLogService;
    private final MbhMemberLoginLogRepository mbhMemberLoginLogRepository;

    public MbhMemberLoginLogDto.Item getById(String id) { return mbhMemberLoginLogService.getById(id); }
    public List<MbhMemberLoginLogDto.Item> getList(MbhMemberLoginLogDto.Request req) { return mbhMemberLoginLogService.getList(req); }
    public MbhMemberLoginLogDto.PageResponse getPageData(MbhMemberLoginLogDto.Request req) { return mbhMemberLoginLogService.getPageData(req); }

    /** deleteAll — 전체 삭제 */
    @Transactional
    public void deleteAll() {
        mbhMemberLoginLogRepository.deleteAllBulk();
    }
}
