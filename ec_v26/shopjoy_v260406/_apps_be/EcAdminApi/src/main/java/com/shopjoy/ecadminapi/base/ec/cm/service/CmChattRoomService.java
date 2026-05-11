package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmChattRoomMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattRoomRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmChattRoomService {

    private final CmChattRoomMapper cmChattRoomMapper;
    private final CmChattRoomRepository cmChattRoomRepository;

    @PersistenceContext
    private EntityManager em;

    public CmChattRoomDto.Item getById(String id) {
        CmChattRoomDto.Item dto = cmChattRoomMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public CmChattRoom findById(String id) {
        return cmChattRoomRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return cmChattRoomRepository.existsById(id);
    }

    public List<CmChattRoomDto.Item> getList(CmChattRoomDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return cmChattRoomMapper.selectList(VoUtil.voToMap(req));
    }

    public CmChattRoomDto.PageResponse getPageData(CmChattRoomDto.Request req) {
        PageHelper.addPaging(req);
        CmChattRoomDto.PageResponse res = new CmChattRoomDto.PageResponse();
        List<CmChattRoomDto.Item> list = cmChattRoomMapper.selectPageList(VoUtil.voToMap(req));
        long count = cmChattRoomMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public CmChattRoom create(CmChattRoom body) {
        body.setChattRoomId(CmUtil.generateId("cm_chatt_room"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmChattRoom save(CmChattRoom entity) {
        if (!existsById(entity.getChattRoomId()))
            throw new CmBizException("존재하지 않는 CmChattRoom입니다: " + entity.getChattRoomId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmChattRoom update(String id, CmChattRoom body) {
        CmChattRoom entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "chattRoomId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmChattRoom updateSelective(CmChattRoom entity) {
        if (entity.getChattRoomId() == null) throw new CmBizException("chattRoomId 가 필요합니다.");
        if (!existsById(entity.getChattRoomId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getChattRoomId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmChattRoomMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmChattRoom entity = findById(id);
        cmChattRoomRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<CmChattRoom> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getChattRoomId() != null)
            .map(CmChattRoom::getChattRoomId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmChattRoomRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmChattRoom> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getChattRoomId() != null)
            .toList();
        for (CmChattRoom row : updateRows) {
            CmChattRoom entity = findById(row.getChattRoomId());
            VoUtil.voCopyExclude(row, entity, "chattRoomId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmChattRoomRepository.save(entity);
        }
        em.flush();

        List<CmChattRoom> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmChattRoom row : insertRows) {
            row.setChattRoomId(CmUtil.generateId("cm_chatt_room"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmChattRoomRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
