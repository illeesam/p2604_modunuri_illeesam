package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmChattService {

    private final CmChattRepository cmChattRepository;

    @PersistenceContext
    private EntityManager em;

    public CmChattDto.Item getById(String id) {
        // [QueryDSL] 채팅 방 단건 조회
        CmChattDto.Item dto = cmChattRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public CmChattDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 채팅 방 단건 조회
        return cmChattRepository.selectById(id).orElse(null);
    }

    public CmChatt findById(String id) {
        // [쿼리 메서드] 채팅 방 단건 조회
        return cmChattRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public CmChatt findByIdOrNull(String id) {
        // [쿼리 메서드] 채팅 방 단건 조회
        return cmChattRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        // [쿼리 메서드] 채팅 방 존재 여부 확인
        return cmChattRepository.existsById(id);
    }

    public List<CmChattDto.Item> getList(CmChattDto.Request req) {
        // [QueryDSL] 채팅 방 목록 조회
        return cmChattRepository.selectList(req);
    }

    public BasePage<CmChattDto.Item> getPageData(CmChattDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 채팅 방 페이지 조회
        return cmChattRepository.selectPageData(req);
    }

    @Transactional
    public CmChatt create(CmChatt body) {
        body.setChattId(CmUtil.generateId("cm_chatt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 채팅 방 저장
        CmChatt saved = cmChattRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmChatt update(String id, CmChatt body) {
        CmUtil.requireId(id, "id", this);
        CmChatt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "chattId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 채팅 방 저장
        CmChatt saved = cmChattRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmChatt updateSelective(CmChatt entity) {
        if (entity.getChattId() == null) throw new CmBizException("chattId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getChattId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getChattId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 채팅 방 선택적 필드 수정
        int affected = cmChattRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmChatt entity = findById(id);
        // [쿼리 메서드] 채팅 방 삭제
        cmChattRepository.delete(entity);
        em.flush();
    }
}
