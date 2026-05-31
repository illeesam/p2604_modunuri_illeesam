package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.service.SyUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO SyUser 서비스 — base SyUserService에 위임 (thin wrapper).
 * BO 전용 권한 체크·감사 로그 등 추가 로직이 필요할 때만 이 레이어에 구현한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyUserService {

    private final SyUserService syUserService;

    /** getById — 단건조회 */
    public SyUserDto.Item getById(String id) {
        return syUserService.getById(id);
    }

    /** getList — 목록조회 */
    public List<SyUserDto.Item> getList(SyUserDto.Request req) {
        return syUserService.getList(req);
    }

    /** getPageData — 페이징조회 */
    public SyUserDto.PageResponse getPageData(SyUserDto.Request req) {
        return syUserService.getPageData(req);
    }

    /** create — 생성 */
    @Transactional
    public SyUser create(SyUser body) {
        return syUserService.create(body);
    }

    /** update — 수정 */
    @Transactional
    public SyUser update(String id, SyUser body) {
        return syUserService.update(id, body);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        syUserService.delete(id);
    }

    /** save — rowStatus 단건 분기 저장. cmd 는 API 마지막 path 세그먼트(null=기본). */
    @Transactional
    public SyUser save(String cmd, SyUser entity) {
        return syUserService.save(cmd, entity);
    }

    /** saveList — 일괄 저장. cmd 는 API 마지막 path 세그먼트(null=기본). */
    @Transactional
    public void saveList(String cmd, List<SyUser> rows) {
        syUserService.saveList(cmd, rows);
    }

    /** getDeptTreeNodeCounts — 부서 트리 노드별 사용자수 (검색조건 + 자손 누적) */
    public java.util.List<java.util.Map<String, Object>> getDeptTreeNodeCounts(SyUserDto.Request req) {
        return syUserService.getDeptTreeNodeCounts(req);
    }
}
