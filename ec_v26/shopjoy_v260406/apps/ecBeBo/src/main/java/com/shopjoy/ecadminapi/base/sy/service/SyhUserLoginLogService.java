package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserLoginLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyhUserLoginLogService {

    private final SyhUserLoginLogRepository syhUserLoginLogRepository;

    /** getById — 단건조회 */
    public SyhUserLoginLogDto.Item getById(String id) {
        // [QueryDSL] 관리자 사용자 로그인 로그 단건 조회
        return syhUserLoginLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhUserLoginLogDto.Item> getList(SyhUserLoginLogDto.Request req) {
        // [QueryDSL] 관리자 사용자 로그인 로그 목록 조회
        return syhUserLoginLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhUserLoginLogDto.Item> getPageData(SyhUserLoginLogDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 관리자 사용자 로그인 로그 페이지 조회
        return syhUserLoginLogRepository.selectPageData(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhUserLoginLog entity) {
        // [QueryDSL] 관리자 사용자 로그인 로그 선택적 필드 수정
        return syhUserLoginLogRepository.updateSelective(entity);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        // [쿼리 메서드] 전체 로그 삭제 (JpaRepository 기본 제공)
        syhUserLoginLogRepository.deleteAllInBatch();
    }
}
