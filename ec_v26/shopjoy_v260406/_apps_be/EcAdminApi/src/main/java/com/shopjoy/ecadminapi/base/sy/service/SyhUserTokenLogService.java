package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserTokenLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhUserTokenLogService {

    private final SyhUserTokenLogRepository syhUserTokenLogRepository;

    /** getById — 단건조회 */
    public SyhUserTokenLogDto.Item getById(String id) {
        return syhUserTokenLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhUserTokenLogDto.Item> getList(SyhUserTokenLogDto.Request req) {
        return syhUserTokenLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhUserTokenLogDto.PageResponse getPageData(SyhUserTokenLogDto.Request req) {
        PageHelper.addPaging(req);
        return syhUserTokenLogRepository.selectPageList(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhUserTokenLog entity) {
        return syhUserTokenLogRepository.updateSelective(entity);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhUserTokenLogRepository.deleteAllBulk();
    }
}
