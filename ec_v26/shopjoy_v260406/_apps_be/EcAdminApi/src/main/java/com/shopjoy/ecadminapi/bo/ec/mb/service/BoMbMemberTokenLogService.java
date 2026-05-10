package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberTokenLogRepository;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbhMemberTokenLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 회원 토큰 로그 서비스 — base 위임 (thin wrapper) + deleteAll.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoMbMemberTokenLogService {

    private final MbhMemberTokenLogService mbhMemberTokenLogService;
    private final MbhMemberTokenLogRepository mbhMemberTokenLogRepository;

    public MbhMemberTokenLogDto.Item getById(String id) { return mbhMemberTokenLogService.getById(id); }
    public List<MbhMemberTokenLogDto.Item> getList(MbhMemberTokenLogDto.Request req) { return mbhMemberTokenLogService.getList(req); }
    public MbhMemberTokenLogDto.PageResponse getPageData(MbhMemberTokenLogDto.Request req) { return mbhMemberTokenLogService.getPageData(req); }

    /** deleteAll — 전체 삭제 */
    @Transactional
    public void deleteAll() {
        mbhMemberTokenLogRepository.deleteAllBulk();
    }
}
