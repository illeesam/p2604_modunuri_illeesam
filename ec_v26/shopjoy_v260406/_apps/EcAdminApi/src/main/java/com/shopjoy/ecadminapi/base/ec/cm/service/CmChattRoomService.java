package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmChattRoomMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattRoomRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmChattRoomService {

    private final CmChattRoomMapper mapper;
    private final CmChattRoomRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmChattRoomDto getById(String id) {
        // cm_chatt_room :: select one :: id [orm:mybatis]
        CmChattRoomDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmChattRoomDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_chatt_room :: select list :: p [orm:mybatis]
        List<CmChattRoomDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmChattRoomDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_chatt_room :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmChattRoom entity) {
        // cm_chatt_room :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmChattRoom create(CmChattRoom entity) {
        entity.setChattRoomId(CmUtil.generateId("cm_chatt_room"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_chatt_room :: insert or update :: [orm:jpa]
        CmChattRoom result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmChattRoom save(CmChattRoom entity) {
        if (!repository.existsById(entity.getChattRoomId()))
            throw new CmBizException("존재하지 않는 CmChattRoom입니다: " + entity.getChattRoomId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_chatt_room :: insert or update :: [orm:jpa]
        CmChattRoom result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmChattRoom입니다: " + id);
        // cm_chatt_room :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
