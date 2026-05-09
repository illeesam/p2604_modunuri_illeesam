package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmChattMsgMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattMsgRepository;
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
public class CmChattMsgService {

    private final CmChattMsgMapper cmChattMsgMapper;
    private final CmChattMsgRepository cmChattMsgRepository;

    @PersistenceContext
    private EntityManager em;

    public CmChattMsgDto.Item getById(String id) {
        CmChattMsgDto.Item dto = cmChattMsgMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public CmChattMsg findById(String id) {
        return cmChattMsgRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return cmChattMsgRepository.existsById(id);
    }

    public List<CmChattMsgDto.Item> getList(CmChattMsgDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return cmChattMsgMapper.selectList(req);
    }

    public CmChattMsgDto.PageResponse getPageData(CmChattMsgDto.Request req) {
        PageHelper.addPaging(req);
        CmChattMsgDto.PageResponse res = new CmChattMsgDto.PageResponse();
        List<CmChattMsgDto.Item> list = cmChattMsgMapper.selectPageList(req);
        long count = cmChattMsgMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public CmChattMsg create(CmChattMsg body) {
        body.setChattMsgId(CmUtil.generateId("cm_chatt_msg"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmChattMsg saved = cmChattMsgRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getChattMsgId());
    }

    @Transactional
    public CmChattMsg save(CmChattMsg entity) {
        if (!existsById(entity.getChattMsgId()))
            throw new CmBizException("존재하지 않는 CmChattMsg입니다: " + entity.getChattMsgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattMsg saved = cmChattMsgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getChattMsgId());
    }

    @Transactional
    public CmChattMsg update(String id, CmChattMsg body) {
        CmChattMsg entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "chattMsgId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattMsg saved = cmChattMsgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public CmChattMsg updatePartial(CmChattMsg entity) {
        if (entity.getChattMsgId() == null) throw new CmBizException("chattMsgId 가 필요합니다.");
        if (!existsById(entity.getChattMsgId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getChattMsgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmChattMsgMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getChattMsgId());
    }

    @Transactional
    public void delete(String id) {
        CmChattMsg entity = findById(id);
        cmChattMsgRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<CmChattMsg> saveList(List<CmChattMsg> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getChattMsgId() != null)
            .map(CmChattMsg::getChattMsgId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmChattMsgRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<CmChattMsg> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getChattMsgId() != null)
            .toList();
        for (CmChattMsg row : updateRows) {
            CmChattMsg entity = findById(row.getChattMsgId());
            VoUtil.voCopyExclude(row, entity, "chattMsgId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmChattMsgRepository.save(entity);
            upsertedIds.add(entity.getChattMsgId());
        }
        em.flush();

        List<CmChattMsg> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmChattMsg row : insertRows) {
            row.setChattMsgId(CmUtil.generateId("cm_chatt_msg"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmChattMsgRepository.save(row);
            upsertedIds.add(row.getChattMsgId());
        }
        em.flush();
        em.clear();

        List<CmChattMsg> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
