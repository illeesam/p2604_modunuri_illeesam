package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecBeBo.base.sy.repository.SyhUserTokenLogRepository;
import com.shopjoy.ecBeBo.common.util.PageHelper;
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
        // [QueryDSL] 관리자 사용자 토큰 이력 단건 조회
        return syhUserTokenLogRepository.selectById(id).orElse(null);
    }

    /** getList — 목록조회 */
    public List<SyhUserTokenLogDto.Item> getList(SyhUserTokenLogDto.Request req) {
        // [QueryDSL] 관리자 사용자 토큰 이력 목록 조회
        return syhUserTokenLogRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhUserTokenLogDto.Item> getPageData(SyhUserTokenLogDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 관리자 사용자 토큰 이력 페이지 조회
        return syhUserTokenLogRepository.selectPageData(req);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyhUserTokenLog entity) {
        // [QueryDSL] 관리자 사용자 토큰 이력 선택적 필드 수정
        return syhUserTokenLogRepository.updateSelective(entity);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        // [쿼리 메서드] 전체 로그 삭제 (JpaRepository 기본 제공)
        syhUserTokenLogRepository.deleteAllInBatch();
    }
}
