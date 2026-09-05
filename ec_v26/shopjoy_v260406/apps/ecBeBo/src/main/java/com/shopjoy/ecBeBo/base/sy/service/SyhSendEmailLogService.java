package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecBeBo.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhSendEmailLogService {

    private final SyhSendEmailLogRepository syhSendEmailLogRepository;

    /** getById — 단건조회 */
    public SyhSendEmailLogDto.Item getById(String id) {
        // [QueryDSL] 이메일 발송 로그 단건 조회
        return syhSendEmailLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhSendEmailLogDto.Item> getList(SyhSendEmailLogDto.Request req) {
        // [QueryDSL] 이메일 발송 로그 목록 조회
        return syhSendEmailLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhSendEmailLogDto.Item> getPageData(SyhSendEmailLogDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 이메일 발송 로그 페이지 조회
        return syhSendEmailLogRepository.selectPageData(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhSendEmailLog entity) {
        // [QueryDSL] 이메일 발송 로그 선택적 필드 수정
        return syhSendEmailLogRepository.updateSelective(entity);
    }
}
